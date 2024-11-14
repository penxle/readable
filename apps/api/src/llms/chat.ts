import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { Annotation, END, Send, START, StateGraph } from '@langchain/langgraph';
import { and, cosineDistance, desc, eq, gte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, PageContentChunks, PageContents, Pages } from '@/db';
import { PageState } from '@/enums';
import * as langchain from '@/external/langchain';

type Chunk = {
  id: string;
  title: string | null;
  text: string;
};

type Message = {
  role: 'USER' | 'ASSISTANT';
  content: string;
};

const GraphState = Annotation.Root({
  siteId: Annotation<string>(),
  question: Annotation<string>(),

  retrievedChunks: Annotation<Chunk[]>(),
  chosenChunks: Annotation<Chunk[]>({ reducer: (s, u) => [...s, ...u], default: () => [] }),

  answer: Annotation<string>(),
  conversation: Annotation<Message[]>(),
});

type GraphState = typeof GraphState.State;
type ChunkState = {
  question: string;
  chunk: Chunk;
};

const transform = async (state: GraphState): Promise<Partial<GraphState>> => {
  if (state.conversation.length === 0) {
    return {
      question: state.question,
    };
  }

  const chain = RunnableSequence.from([
    ChatPromptTemplate.fromTemplate(`You are a interpreter that may (or may not) transform a input after assessing the input text and the previous conversation.
A previous conversation:\n\`\`\`\n{conversation}\n\`\`\`
An input text:\n\`\`\`\n{input}\n\`\`\`

If the input text contains a question that should be answered based on the previous conversation, transform the input text into a question based on the previous conversation, and return the transformed question.
Otherwise, return the input text as it is.`),
    langchain.model.withStructuredOutput(
      z.object({ question: z.string().describe('Transformed question based on the previous conversation.') }),
      { name: 'transform' },
    ),
  ]);

  const { question } = await chain.invoke({
    conversation: state.conversation,
    input: state.question,
  });

  return {
    question,
  };
};

const retrieve = async (state: GraphState): Promise<Partial<GraphState>> => {
  const vector = await langchain.embeddings.embedQuery(state.question);
  const similarity = sql`1 - (${cosineDistance(PageContentChunks.vector, vector)})`;

  const retrievedChunks = await db
    .select({
      id: Pages.id,
      title: PageContents.title,
      text: PageContentChunks.text,
      similarity,
    })
    .from(Pages)
    .innerJoin(PageContents, eq(Pages.id, PageContents.pageId))
    .innerJoin(PageContentChunks, eq(Pages.id, PageContentChunks.pageId))
    .where(and(eq(Pages.siteId, state.siteId), eq(Pages.state, PageState.PUBLISHED), gte(similarity, 0.25)))
    .orderBy(desc(similarity))
    .limit(5);

  return {
    retrievedChunks,
  };
};

const choose = async (state: ChunkState): Promise<Partial<GraphState>> => {
  const chain = RunnableSequence.from([
    ChatPromptTemplate.fromTemplate(`You are a grader assessing relevance of a retrieved text to a user question.
Text:\n\`\`\`\n{text}\n\`\`\`
Question:\n\`\`\`\n{question}\n\`\`\`

If the text contains keyword(s) or semantic meaning related to the user question, grade it as relevant.
Give a binary score 'yes' or 'no' score to indicate whether the text is relevant to the question.`),
    langchain.model.withStructuredOutput(
      z
        .object({ binaryScore: z.enum(['yes', 'no']).describe("Relevance score 'yes' or 'no'") })
        .describe("Grade the relevance of the retrieved text to the question. Either 'yes' or 'no'."),
      { name: 'grade' },
    ),
  ]);

  const grade = await chain.invoke({
    text: state.chunk,
    question: state.question,
  });

  if (grade.binaryScore === 'yes') {
    return { chosenChunks: [state.chunk] };
  }

  return {};
};

const generate = async (state: GraphState): Promise<Partial<GraphState>> => {
  const chain = RunnableSequence.from([
    ChatPromptTemplate.fromTemplate(`You are an expert AI assistant that produces clear, reasonable responses that are helpful to the user based on the documents.
Documents:\n\`\`\`\n{documents}\n\`\`\`
Question:\n\`\`\`\n{question}\n\`\`\`

Do not use common knowledge to answer the question. Only use the information provided in the documents.
Answer in the same language as the question, even if the documents are in different languages.
Carefully provide accurate, factual, thoughtful answers.`),
    langchain.model.withStructuredOutput(
      z.object({ answer: z.string().describe('Accurate, factual, thoughtful answer to the question.') }),
      { name: 'generate' },
    ),
  ]);

  const { answer } = await chain.invoke({
    documents: state.chosenChunks,
    question: state.question,
  });

  return {
    answer,
  };
};

const workflow = new StateGraph(GraphState)
  .addNode('transform', transform)
  .addNode('retrieve', retrieve)
  .addNode('choose', choose)
  .addNode('generate', generate);

workflow.addEdge(START, 'transform');
workflow.addEdge('transform', 'retrieve');
workflow.addConditionalEdges('retrieve', (state) =>
  state.retrievedChunks.map((chunk) => new Send('choose', { question: state.question, chunk })),
);
workflow.addConditionalEdges('choose', (state) => (state.chosenChunks.length > 0 ? 'generate' : END));
workflow.addEdge('generate', END);

const app = workflow.compile();

type AskParams = {
  siteId: string;
  message: string;
  conversation?: Message[];
};

type AskResult = {
  question: string;
  answer: string | null;
  chunks: Chunk[];
};

export const ask = async (params: AskParams): Promise<AskResult> => {
  const { question, answer, chosenChunks } = await app.invoke({
    siteId: params.siteId,
    question: params.message,
    conversation: params.conversation ?? [],
  });

  return {
    question,
    answer: answer?.length ? answer : null,
    chunks: chosenChunks,
  };
};

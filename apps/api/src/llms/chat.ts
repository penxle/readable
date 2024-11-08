import { StringOutputParser } from '@langchain/core/output_parsers';
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

If the input text contains keyword(s) or semantic meaning related to the previous conversation, transform the input text into a question based on the previous conversation.
Otherwise, return the input text as it is.`),
    langchain.model,
    new StringOutputParser(),
  ]);

  const question = await chain.invoke({
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
    .from(PageContentChunks)
    .innerJoin(Pages, eq(Pages.id, PageContentChunks.pageId))
    .innerJoin(PageContents, eq(Pages.id, PageContents.pageId))
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
Text:\n\`\`\`\n{chunk}\n\`\`\`
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
    chunk: state.chunk,
    question: state.question,
  });

  if (grade.binaryScore === 'yes') {
    return { chosenChunks: [state.chunk] };
  }

  return {};
};

const generate = async (state: GraphState): Promise<Partial<GraphState>> => {
  const chain = RunnableSequence.from([
    ChatPromptTemplate.fromTemplate(`You are an expert AI assistant that primarily focuses on producing clear, reasonable responses that are helpful to the user.
You always use the latest version of provided documents, and you are familiar with their latest content.
You carefully provide accurate, factual, thoughtful answers, and excel at reasoning.

TASK:
- Answer the question based on the context.
- You can reference the multiple documents to answer the question.

MUST:
- Use appropriate line breaks to make the answer more readable.
- If necessary, use markdown to generate the answer.
- Maintain a professional and accurate tone in your answer.
- Do not use common knowledge to answer the question. Only use the information provided in the context.

Context:\n\`\`\`\n{context}\n\`\`\`
Question:\n\`\`\`\n{question}\n\`\`\`

The answer:`),
    langchain.model,
    new StringOutputParser(),
  ]);

  const answer = await chain.invoke({
    context: state.chosenChunks,
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
  conversation: Message[];
};

export const ask = async (params: AskParams): Promise<string | null> => {
  const { answer } = await app.invoke({
    siteId: params.siteId,
    question: params.message,
    conversation: params.conversation,
  });

  return answer?.length ? answer : null;
};

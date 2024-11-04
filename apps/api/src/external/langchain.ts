import { VoyageEmbeddings } from '@langchain/community/embeddings/voyage';
import { ChatOpenAI } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export const model = new ChatOpenAI({
  model: 'gpt-4o-mini',
});

export const embeddings = new VoyageEmbeddings({
  modelName: 'voyage-3',
});

export const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 200,
  chunkOverlap: 40,
});

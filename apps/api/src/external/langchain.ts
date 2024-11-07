import { ChatAnthropic } from '@langchain/anthropic';
import { VoyageEmbeddings } from '@langchain/community/embeddings/voyage';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export const model = new ChatAnthropic({
  model: 'claude-3-5-haiku-latest',
});

export const embeddings = new VoyageEmbeddings({
  modelName: 'voyage-3',
});

export const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 250,
});

import { ChatAnthropic } from '@langchain/anthropic';
import { JinaEmbeddings } from '@langchain/community/embeddings/jina';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export const model = new ChatAnthropic({
  model: 'claude-3-5-haiku-latest',
  temperature: 0,
});

export const embeddings = new JinaEmbeddings({
  model: 'jina-embeddings-v3',
});

export const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 200,
  chunkOverlap: 40,
});

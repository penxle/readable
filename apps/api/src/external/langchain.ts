import { ChatAnthropic } from '@langchain/anthropic';
import { VoyageEmbeddings } from '@langchain/community/embeddings/voyage';
import { MarkdownTextSplitter, RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export const model = new ChatAnthropic({
  model: 'claude-3-5-haiku-latest',
  temperature: 0,
});

export const embeddings = new VoyageEmbeddings({
  modelName: 'voyage-3',
});

export const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 200,
});

export const markdownSplitter = new MarkdownTextSplitter({
  chunkSize: 500,
  chunkOverlap: 200,
});

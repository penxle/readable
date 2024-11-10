import { GraphQLError } from 'graphql';

type ReadableErrorParams = {
  code: string;
  message?: string;
  status?: number;
};

export class ReadableError extends GraphQLError {
  public code: string;
  public status: number;

  constructor({ code, message, status }: ReadableErrorParams) {
    super(message ?? code, { extensions: { type: 'ReadableError', code, status } });
    this.name = 'ReadableError';
    this.code = code;
    this.status = status ?? 500;
  }
}

export class AppError extends Error {
  readonly statusCode: number;
  readonly errors: { path?: string; message: string }[];

  constructor(
    message: string,
    statusCode: number,
    errors: { path?: string; message: string }[] = [],
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export class ApiError extends Error {
  statusCode: number;
  errors?: Record<string, string[]>;
  code?: string;

  constructor(message: string, statusCode = 500, errors?: Record<string, string[]>, code?: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code;
  }
}

export class ValidationApiError extends ApiError {
  constructor(errors: Record<string, string[]>, message = "Validation error") {
    super(message, 422, errors);
    this.name = "ValidationApiError";
  }
}

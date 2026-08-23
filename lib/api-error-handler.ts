import { ApiError, ValidationApiError } from "@/lib/api-errors";
import { errorResponse, validationError } from "@/lib/response";

export function handleApiError(error: unknown) {
  if (error instanceof ValidationApiError) {
    return validationError(error.errors ?? {});
  }

  if (error instanceof ApiError) {
    return errorResponse(error.message, error.statusCode, error.errors, error.code);
  }

  if (error instanceof Error) {
    return errorResponse(error.message, 500);
  }

  return errorResponse("Internal server error", 500);
}

export function withApiErrorHandling<T extends (...args: any[]) => Promise<Response>>(handler: T): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  }) as T;
}

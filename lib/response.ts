import { NextResponse } from "next/server";

export function successResponse<T>(message: string, data?: T, statusCode = 200) {
  return NextResponse.json(
    { status: "success", message, data: data ?? null },
    { status: statusCode }
  );
}

export function validationError(errors: Record<string, string[]>) {
  const allMessages = Object.values(errors).flat();
  const first = allMessages[0] ?? "Validation error";
  const rest = allMessages.length - 1;
  const message = rest > 0 ? `${first} (and ${rest} more error${rest > 1 ? "s" : ""})` : first;
  return errorResponse(message, 422, errors);
}

export function errorResponse(
  message: string,
  statusCode = 500,
  errors?: Record<string, string[]>
) {
  return NextResponse.json(
    { status: "error", message, errors: errors ?? null },
    { status: statusCode }
  );
}

export function paginatedResponse<T>(
  message: string,
  data: T[],
  meta: {
    currentPage: number;
    perPage: number;
    total: number;
    path: string;
  }
) {
  const lastPage = Math.ceil(meta.total / meta.perPage);
  const from = meta.total > 0 ? (meta.currentPage - 1) * meta.perPage + 1 : null;
  const to = meta.total > 0 ? Math.min(meta.currentPage * meta.perPage, meta.total) : null;

  return NextResponse.json({
    status: "success",
    message,
    data: {
      data,
      links: {
        first: `${meta.path}?page=1`,
        last: `${meta.path}?page=${lastPage}`,
        prev: meta.currentPage > 1 ? `${meta.path}?page=${meta.currentPage - 1}` : null,
        next: meta.currentPage < lastPage ? `${meta.path}?page=${meta.currentPage + 1}` : null,
      },
      meta: {
        current_page: meta.currentPage,
        from,
        last_page: lastPage,
        path: meta.path,
        per_page: meta.perPage,
        to,
        total: meta.total,
      },
    },
  });
}

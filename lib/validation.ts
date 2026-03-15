import { z } from "zod";
import { validationError } from "./response";

/**
 * Parse Zod schema dan return validationError jika gagal.
 * Return parsed data jika valid.
 */
export function validateSchema<T extends z.ZodType>(
  schema: T,
  data: unknown
): ReturnType<typeof validationError> | { data: z.infer<T> } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const field = issue.path.join(".") || "_root";
      if (!errors[field]) errors[field] = [];
      errors[field].push(issue.message);
    }
    return validationError(errors);
  }
  return { data: result.data };
}

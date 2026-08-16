import { successResponse } from "@/lib/response";
import { withPermission } from "@/lib/api-middleware";
import { validateSchema } from "@/lib/validation";
import { updateBeritaSchema } from "@/lib/validations/berita";
import { beritaService } from "@/lib/modules/berita/admin.service";
import { withApiErrorHandling } from "@/lib/api-error-handler";

export const GET = withPermission(
  "admin.berita.index",
  withApiErrorHandling(async (_req, context) => {
    const params = await context.params;
    const uuid = params.uuid;

    const result = await beritaService.getBeritaDetail(uuid);

    return successResponse("Detail Berita", result);
  })
);

export const PATCH = withPermission(
  "admin.berita.update",
  withApiErrorHandling(async (req, context) => {
    const params = await context.params;
    const uuid = params.uuid;

    const contentType = req.headers.get("content-type") ?? "";
    let body: any;
    let imageFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
      imageFile = formData.get("image") as File | null;
    } else {
      body = await req.json();
    }

    const validated = validateSchema(updateBeritaSchema, body);
    if (!("data" in validated)) return validated;

    const result = await beritaService.updateBerita(uuid, validated.data, imageFile);

    return successResponse("Berita berhasil diperbarui", result);
  })
);

export const DELETE = withPermission(
  "admin.berita.delete",
  withApiErrorHandling(async (_req, context) => {
    const params = await context.params;
    const uuid = params.uuid;

    await beritaService.deleteBerita(uuid);

    return successResponse("Berita berhasil dihapus");
  })
);

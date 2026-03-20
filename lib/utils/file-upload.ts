import { mkdir, unlink, writeFile } from "fs/promises";
import { join } from "path";
import { v7 as uuidv7 } from "uuid";
import { ValidationApiError } from "@/lib/api-errors";

const UPLOAD_BASE_SEGMENT = "uploads";
const UPLOAD_PUBLIC_PREFIX = `/${UPLOAD_BASE_SEGMENT}`;

type SaveUploadedFileOptions = {
  folder: string;
  allowedTypes?: string[];
  maxSizeBytes?: number;
  fieldName?: string;
  invalidTypeMessage?: string;
  maxSizeMessage?: string;
};

export async function saveUploadedFile(file: File, options: SaveUploadedFileOptions) {
  const {
    folder,
    allowedTypes,
    maxSizeBytes,
    fieldName = "file",
    invalidTypeMessage,
    maxSizeMessage,
  } = options;

  const fieldLabel = fieldName === "image" ? "Gambar" : "File";
  const normalizedTypes = allowedTypes
    ? [...new Set(allowedTypes.map((type) => (type.includes("/") ? type.split("/")[1] : type)))]
    : [];
  const defaultInvalidTypeMessage =
    normalizedTypes.length > 0
      ? `${fieldLabel} harus berupa ${normalizedTypes.join(", ").replace(/, ([^,]+)$/, ", atau $1")}`
      : `${fieldLabel} tidak valid`;
  const maxSizeMb = maxSizeBytes ? Math.floor(maxSizeBytes / (1024 * 1024)) : 0;
  const defaultMaxSizeMessage = `${fieldLabel} maksimal ${maxSizeMb}MB`;

  if (allowedTypes && !allowedTypes.includes(file.type)) {
    throw new ValidationApiError({ [fieldName]: [invalidTypeMessage ?? defaultInvalidTypeMessage] });
  }

  if (maxSizeBytes && file.size > maxSizeBytes) {
    throw new ValidationApiError({ [fieldName]: [maxSizeMessage ?? defaultMaxSizeMessage] });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = `${uuidv7()}_${file.name}`;
  const dir = getUploadDiskDir(folder);

  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), buffer);

  return filename;
}

export async function removeFileIfExists(folder: string, filename?: string | null) {
  if (!filename) return;
  const dir = getUploadDiskDir(folder);

  try {
    await unlink(join(dir, filename));
  } catch {
    // ignore missing file
  }
}

function getUploadDiskDir(folder: string) {
  return join(process.cwd(), "public", UPLOAD_BASE_SEGMENT, folder);
}

export function buildUploadFileUrl(folder: string, filename?: string | null) {
  if (!filename) return null;
  return `${UPLOAD_PUBLIC_PREFIX}/${folder}/${filename}`;
}

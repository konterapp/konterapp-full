import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/response";
import { withAuth } from "@/lib/api-middleware";

export const preferredRegion = "sin1";
export const GET = withAuth(async () => {
  try {
    const permissions = await prisma.permission.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    });

    return successResponse(
      "Permissions retrieved successfully",
      permissions.map((p) => ({ name: p.name }))
    );
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});
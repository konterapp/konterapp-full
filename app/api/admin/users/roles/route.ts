import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/response";
import { withAuth } from "@/lib/api-middleware";

export const preferredRegion = "sin1";
export const GET = withAuth(async () => {
  try {
    const roles = await prisma.role.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return successResponse("Roles retrieved successfully", roles);
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});
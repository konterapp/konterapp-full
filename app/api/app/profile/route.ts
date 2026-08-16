import { NextRequest } from "next/server";
import { successResponse } from "@/lib/response";
import { withSession } from "@/lib/api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { validateSchema } from "@/lib/validation";
import { updateProfileSchema } from "@/lib/validations/profile";
import { profileService } from "@/lib/modules/users/profile.service";

export const GET = withApiErrorHandling(
  withSession(async (_req: NextRequest, context) => {
    const profile = await profileService.getProfile(context.userId);
    return successResponse("Profile retrieved successfully", profile);
  })
);

export const PATCH = withApiErrorHandling(
  withSession(async (req: NextRequest, context) => {
    const body = await req.json();
    const result = validateSchema(updateProfileSchema, body);
    if (!("data" in result)) return result;

    const data = result.data as {
      name?: string;
      current_password?: string;
      new_password?: string;
      new_password_confirmation?: string;
    };

    if (data.new_password && data.new_password !== data.new_password_confirmation) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Konfirmasi password baru tidak cocok",
          errors: { new_password_confirmation: ["Konfirmasi password baru tidak cocok"] },
        }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    const profile = await profileService.updateProfile(context.userId, {
      name: data.name,
      current_password: data.current_password,
      new_password: data.new_password,
    });

    return successResponse("Profile updated successfully", profile);
  })
);

export const PUT = PATCH;

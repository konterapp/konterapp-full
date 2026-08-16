import { Administrator } from "@prisma/client";

export function formatAdministrator(administrator: Administrator) {
  return {
    id: administrator.id,
    uuid: administrator.uuid,
    name: administrator.name,
    email: administrator.email,
  };
}

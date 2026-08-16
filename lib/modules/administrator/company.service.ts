import { prisma } from "@/lib/prisma";

export async function listCompaniesForSelect() {
  const companies = await prisma.company.findMany({
    where: { isActive: true },
    select: { uuid: true, code: true, name: true },
    orderBy: { name: "asc" },
  });

  return companies.map((company) => ({
    uuid: company.uuid,
    code: company.code,
    name: company.name,
  }));
}

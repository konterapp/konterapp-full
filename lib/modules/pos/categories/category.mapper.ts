export function mapCategory(category: any) {
  return {
    uuid: category.uuid,
    name: category.name,
    description: category.description,
    product_count: category._count?.products ?? 0,
    created_at: category.createdAt,
    updated_at: category.updatedAt,
  };
}

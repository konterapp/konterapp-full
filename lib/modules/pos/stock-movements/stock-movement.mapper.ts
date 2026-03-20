export function mapStockMovementListItem(movement: any) {
  return {
    uuid: movement.uuid,
    created_at: movement.createdAt,
    movement_type: movement.movementType,
    quantity_change: movement.quantity,
    quantity_before: movement.previousStock,
    quantity_after: movement.newStock,
    reference_type: movement.referenceType,
    reference_uuid: movement.referenceUuid,
    notes: movement.notes,
    product: movement.product,
    branch: movement.branch,
  };
}

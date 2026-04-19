interface UnitEntity {
  uuid: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function mapUnit(unit: UnitEntity) {
  return {
    uuid: unit.uuid,
    name: unit.name,
    description: unit.description,
    created_at: unit.createdAt,
    updated_at: unit.updatedAt,
  };
}

import { campus } from "./config";

export function buildingLabel(code: string): string {
  return campus.buildings.find((b) => b.code === code)?.label ?? code;
}

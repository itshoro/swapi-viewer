import { planetsApi, type Planet } from "../../dal/planets";
import { nextResourceId, type Resource } from "../../dal/swapi";
import { field, type EditorConfig, type FieldSpec } from "./types";

const fields: FieldSpec[] = [
  field("name", "text", "Name", true),
  field("rotation_period", "text", "Rotation Period"),
  field("orbital_period", "text", "Orbital Period"),
  field("diameter", "text", "Diameter"),
  field("climate", "text", "Climate"),
  field("gravity", "text", "Gravity"),
  field("terrain", "text", "Terrain"),
  field("surface_water", "text", "Surface Water"),
  field("population", "text", "Population"),
  field("residents", "list", "Residents"),
  field("films", "list", "Films"),
];

export const planetsEditor: EditorConfig = {
  category: "planets",
  fields,
  list: () => planetsApi.list(),
  get: (id: string) => planetsApi.get(id),
  save: (id: string, data: Record<string, unknown>) =>
    planetsApi.save(id, data as unknown as Planet),
  restore: (id: string) => planetsApi.restore(id),
  isModified: (id: string) => planetsApi.isModified(id),
  nextId: () => nextResourceId("planets"),
  blank: (url: string) => planetsApi.blank(url),
  label: (resource: Resource) => planetsApi.label(resource as Planet),
};

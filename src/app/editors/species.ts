import { speciesApi, type Species } from "../../dal/species";
import { nextResourceId, type Resource } from "../../dal/swapi";
import { field, type EditorConfig, type FieldSpec } from "./types";

const fields: FieldSpec[] = [
  field("name", "text", "Name", true),
  field("classification", "text", "Classification"),
  field("designation", "text", "Designation"),
  field("average_height", "text", "Average Height"),
  field("skin_colors", "text", "Skin Colors"),
  field("hair_colors", "text", "Hair Colors"),
  field("eye_colors", "text", "Eye Colors"),
  field("average_lifespan", "text", "Average Lifespan"),
  field("homeworld", "text", "Homeworld"),
  field("language", "text", "Language"),
  field("people", "list", "People"),
  field("films", "list", "Films"),
];

export const speciesEditor: EditorConfig = {
  category: "species",
  fields,
  list: () => speciesApi.list(),
  get: (id: string) => speciesApi.get(id),
  save: (id: string, data: Record<string, unknown>) =>
    speciesApi.save(id, data as unknown as Species),
  restore: (id: string) => speciesApi.restore(id),
  isModified: (id: string) => speciesApi.isModified(id),
  nextId: () => nextResourceId("species"),
  blank: (url: string) => speciesApi.blank(url),
  label: (resource: Resource) => speciesApi.label(resource as Species),
};
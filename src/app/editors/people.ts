import { peopleApi, type Person } from "../../dal/people";
import { nextResourceId, type Resource } from "../../dal/swapi";
import { field, type EditorConfig, type FieldSpec } from "./types";

const fields: FieldSpec[] = [
  field("name", "text", "Name", true),
  field("height", "text", "Height"),
  field("mass", "text", "Mass"),
  field("hair_color", "text", "Hair Color"),
  field("skin_color", "text", "Skin Color"),
  field("eye_color", "text", "Eye Color"),
  field("birth_year", "text", "Birth Year"),
  field("gender", "text", "Gender"),
  field("homeworld", "text", "Homeworld"),
  field("films", "list", "Films"),
  field("species", "list", "Species"),
  field("vehicles", "list", "Vehicles"),
  field("starships", "list", "Starships"),
];

export const peopleEditor: EditorConfig = {
  category: "people",
  fields,
  list: () => peopleApi.list(),
  get: (id: string) => peopleApi.get(id),
  save: (id: string, data: Record<string, unknown>) =>
    peopleApi.save(id, data as unknown as Person),
  restore: (id: string) => peopleApi.restore(id),
  isModified: (id: string) => peopleApi.isModified(id),
  nextId: () => nextResourceId("people"),
  blank: (url: string) => peopleApi.blank(url),
  label: (resource: Resource) => peopleApi.label(resource as Person),
};

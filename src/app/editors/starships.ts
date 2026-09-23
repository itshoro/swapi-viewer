import { starshipsApi, type Starship } from "../../dal/starships";
import { nextResourceId, type Resource } from "../../dal/swapi";
import { field, type EditorConfig, type FieldSpec } from "./types";

const fields: FieldSpec[] = [
  field("name", "text", "Name", true),
  field("model", "text", "Model"),
  field("manufacturer", "text", "Manufacturer"),
  field("cost_in_credits", "text", "Cost in Credits"),
  field("length", "text", "Length"),
  field("max_atmosphering_speed", "text", "Max Atmosphering Speed"),
  field("crew", "text", "Crew"),
  field("passengers", "text", "Passengers"),
  field("cargo_capacity", "text", "Cargo Capacity"),
  field("consumables", "text", "Consumables"),
  field("hyperdrive_rating", "text", "Hyperdrive Rating"),
  field("MGLT", "text", "MGLT"),
  field("starship_class", "text", "Starship Class"),
  field("pilots", "list", "Pilots"),
  field("films", "list", "Films"),
];

export const starshipsEditor: EditorConfig = {
  category: "starships",
  fields,
  list: () => starshipsApi.list(),
  get: (id: string) => starshipsApi.get(id),
  save: (id: string, data: Record<string, unknown>) =>
    starshipsApi.save(id, data as unknown as Starship),
  restore: (id: string) => starshipsApi.restore(id),
  isModified: (id: string) => starshipsApi.isModified(id),
  nextId: () => nextResourceId("starships"),
  blank: (url: string) => starshipsApi.blank(url),
  label: (resource: Resource) => starshipsApi.label(resource as Starship),
};
import { vehiclesApi, type Vehicle } from "../../dal/vehicles";
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
  field("vehicle_class", "text", "Vehicle Class"),
  field("pilots", "list", "Pilots"),
  field("films", "list", "Films"),
];

export const vehiclesEditor: EditorConfig = {
  category: "vehicles",
  fields,
  list: () => vehiclesApi.list(),
  get: (id: string) => vehiclesApi.get(id),
  save: (id: string, data: Record<string, unknown>) =>
    vehiclesApi.save(id, data as unknown as Vehicle),
  restore: (id: string) => vehiclesApi.restore(id),
  isModified: (id: string) => vehiclesApi.isModified(id),
  nextId: () => nextResourceId("vehicles"),
  blank: (url: string) => vehiclesApi.blank(url),
  label: (resource: Resource) => vehiclesApi.label(resource as Vehicle),
};
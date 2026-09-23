import * as v from "valibot";
import { categoryApi, type Resource } from "./swapi";

const speciesSchema = v.object({
  name: v.string(),
  classification: v.string(),
  designation: v.string(),
  average_height: v.string(),
  skin_colors: v.string(),
  hair_colors: v.string(),
  eye_colors: v.string(),
  average_lifespan: v.string(),
  homeworld: v.nullable(v.string()),
  language: v.string(),
  people: v.array(v.string()),
  films: v.array(v.string()),
  created: v.string(),
  edited: v.string(),
  url: v.string(),
});

export type Species = v.InferOutput<typeof speciesSchema> & Resource;

export function isSpecies(value: unknown): value is Species {
  return v.is(speciesSchema, value);
}

export function blankSpecies(url: string): Species {
  return {
    name: "",
    classification: "",
    designation: "",
    average_height: "",
    skin_colors: "",
    hair_colors: "",
    eye_colors: "",
    average_lifespan: "",
    homeworld: "",
    language: "",
    people: [],
    films: [],
    created: new Date().toISOString(),
    edited: new Date().toISOString(),
    url,
  };
}

export const speciesApi = categoryApi<Species>(
  "species",
  blankSpecies,
  (species) => species.name,
  isSpecies,
);
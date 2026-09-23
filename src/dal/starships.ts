import * as v from "valibot";
import { categoryApi, type Resource } from "./swapi";

const starshipSchema = v.object({
  name: v.string(),
  model: v.string(),
  manufacturer: v.string(),
  cost_in_credits: v.string(),
  length: v.string(),
  max_atmosphering_speed: v.string(),
  crew: v.string(),
  passengers: v.string(),
  cargo_capacity: v.string(),
  consumables: v.string(),
  hyperdrive_rating: v.string(),
  MGLT: v.string(),
  starship_class: v.string(),
  pilots: v.array(v.string()),
  films: v.array(v.string()),
  created: v.string(),
  edited: v.string(),
  url: v.string(),
});

export type Starship = v.InferOutput<typeof starshipSchema> & Resource;

export function isStarship(value: unknown): value is Starship {
  return v.is(starshipSchema, value);
}

export function blankStarship(url: string): Starship {
  return {
    name: "",
    model: "",
    manufacturer: "",
    cost_in_credits: "",
    length: "",
    max_atmosphering_speed: "",
    crew: "",
    passengers: "",
    cargo_capacity: "",
    consumables: "",
    hyperdrive_rating: "",
    MGLT: "",
    starship_class: "",
    pilots: [],
    films: [],
    created: new Date().toISOString(),
    edited: new Date().toISOString(),
    url,
  };
}

export const starshipsApi = categoryApi<Starship>(
  "starships",
  blankStarship,
  (starship) => starship.name,
  isStarship,
);
import * as v from "valibot";
import { categoryApi, type Resource } from "./swapi";

const planetSchema = v.object({
  name: v.string(),
  rotation_period: v.string(),
  orbital_period: v.string(),
  diameter: v.string(),
  climate: v.string(),
  gravity: v.string(),
  terrain: v.string(),
  surface_water: v.string(),
  population: v.string(),
  residents: v.array(v.string()),
  films: v.array(v.string()),
  created: v.string(),
  edited: v.string(),
  url: v.string(),
});

export type Planet = v.InferOutput<typeof planetSchema> & Resource;

export function isPlanet(value: unknown): value is Planet {
  return v.is(planetSchema, value);
}

export function blankPlanet(url: string): Planet {
  return {
    name: "",
    rotation_period: "",
    orbital_period: "",
    diameter: "",
    climate: "",
    gravity: "",
    terrain: "",
    surface_water: "",
    population: "",
    residents: [],
    films: [],
    created: new Date().toISOString(),
    edited: new Date().toISOString(),
    url,
  };
}

export const planetsApi = categoryApi<Planet>(
  "planets",
  blankPlanet,
  (planet) => planet.name,
  isPlanet,
);
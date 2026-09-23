import * as v from "valibot";
import { categoryApi, type Resource } from "./swapi";

const personSchema = v.object({
  name: v.string(),
  height: v.string(),
  mass: v.string(),
  hair_color: v.string(),
  skin_color: v.string(),
  eye_color: v.string(),
  birth_year: v.string(),
  gender: v.string(),
  homeworld: v.string(),
  films: v.array(v.string()),
  species: v.array(v.string()),
  vehicles: v.array(v.string()),
  starships: v.array(v.string()),
  created: v.string(),
  edited: v.string(),
  url: v.string(),
});

export type Person = v.InferOutput<typeof personSchema> & Resource;

export function isPerson(value: unknown): value is Person {
  return v.is(personSchema, value);
}

export function blankPeople(url: string): Person {
  return {
    name: "",
    height: "",
    mass: "",
    hair_color: "",
    skin_color: "",
    eye_color: "",
    birth_year: "",
    gender: "",
    homeworld: "",
    films: [],
    species: [],
    vehicles: [],
    starships: [],
    created: new Date().toISOString(),
    edited: new Date().toISOString(),
    url,
  };
}

export const peopleApi = categoryApi<Person>(
  "people",
  blankPeople,
  (person) => person.name,
  isPerson,
);
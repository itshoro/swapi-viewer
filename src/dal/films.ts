import * as v from "valibot";
import { categoryApi, type Resource } from "./swapi";

const filmSchema = v.object({
  title: v.string(),
  episode_id: v.number(),
  opening_crawl: v.string(),
  director: v.string(),
  producer: v.string(),
  release_date: v.string(),
  characters: v.array(v.string()),
  planets: v.array(v.string()),
  starships: v.array(v.string()),
  vehicles: v.array(v.string()),
  species: v.array(v.string()),
  created: v.string(),
  edited: v.string(),
  url: v.string(),
});

export type Film = v.InferOutput<typeof filmSchema> & Resource;

export function isFilm(value: unknown): value is Film {
  return v.is(filmSchema, value);
}

export function blankFilm(url: string): Film {
  return {
    title: "",
    episode_id: 1,
    opening_crawl: "",
    director: "",
    producer: "",
    release_date: "",
    characters: [],
    planets: [],
    starships: [],
    vehicles: [],
    species: [],
    created: new Date().toISOString(),
    edited: new Date().toISOString(),
    url,
  };
}

export const filmsApi = categoryApi<Film>(
  "films",
  blankFilm,
  (film) => film.title,
  isFilm,
);
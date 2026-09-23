import { filmsApi, type Film } from "../../dal/films";
import { nextResourceId, type Resource } from "../../dal/swapi";
import { field, type EditorConfig, type FieldSpec } from "./types";

const fields: FieldSpec[] = [
  field("title", "text", "Title", true),
  field("episode_id", "number", "Episode ID"),
  field("opening_crawl", "multiline", "Opening Crawl"),
  field("director", "text", "Director"),
  field("producer", "text", "Producer"),
  field("release_date", "text", "Release Date"),
  field("characters", "list", "Characters"),
  field("planets", "list", "Planets"),
  field("starships", "list", "Starships"),
  field("vehicles", "list", "Vehicles"),
  field("species", "list", "Species"),
];

export const filmsEditor: EditorConfig = {
  category: "films",
  fields,
  list: () => filmsApi.list(),
  get: (id: string) => filmsApi.get(id),
  save: (id: string, data: Record<string, unknown>) =>
    filmsApi.save(id, data as unknown as Film),
  restore: (id: string) => filmsApi.restore(id),
  isModified: (id: string) => filmsApi.isModified(id),
  nextId: () => nextResourceId("films"),
  blank: (url: string) => filmsApi.blank(url),
  label: (resource: Resource) => filmsApi.label(resource as Film),
};
import { filmsEditor } from "./films";
import { peopleEditor } from "./people";
import { planetsEditor } from "./planets";
import { speciesEditor } from "./species";
import { vehiclesEditor } from "./vehicles";
import { starshipsEditor } from "./starships";
import type { EditorConfig, FieldKind, FieldSpec } from "./types";
import { field } from "./types";
import type { Category } from "../../dal/swapi";

export type { EditorConfig, FieldKind, FieldSpec };
export { field };

export const editors: Record<Category, EditorConfig> = {
  films: filmsEditor,
  people: peopleEditor,
  planets: planetsEditor,
  species: speciesEditor,
  vehicles: vehiclesEditor,
  starships: starshipsEditor,
};
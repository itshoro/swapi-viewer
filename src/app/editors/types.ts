import type {
  Category,
  CollectionItem,
  Resource,
} from "../../dal/swapi";

export type FieldKind = "text" | "number" | "boolean" | "list" | "multiline";

export interface FieldSpec {
  name: string;
  kind: FieldKind;
  label: string;
  required?: boolean;
}

export function field(
  name: string,
  kind: FieldKind,
  label: string,
  required = false,
): FieldSpec {
  return { name, kind, label, required };
}

export interface EditorConfig {
  category: Category;
  fields: FieldSpec[];
  list(): Promise<CollectionItem<Resource>[]>;
  get(id: string): Promise<Resource>;
  save(id: string, data: Record<string, unknown>): Promise<void>;
  restore(id: string): Promise<void>;
  isModified(id: string): Promise<boolean>;
  nextId(): Promise<string>;
  blank(url: string): Resource;
  label(resource: Resource): string;
}
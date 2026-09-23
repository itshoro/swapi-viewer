import { useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { deleteResource, type Category } from "../../dal/swapi";
import type { EditorConfig, FieldSpec } from "../editors";

interface CategoryFormProps {
  editor: EditorConfig;
  category: Category;
  resourceId: string;
  initial: Record<string, unknown>;
  isNew: boolean;
  modified: boolean;
}

const inputClass =
  "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

export function CategoryForm({
  editor,
  category,
  resourceId,
  initial,
  isNew,
  modified,
}: CategoryFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Record<string, unknown>>(() => ({
    ...initial,
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (name: string, value: unknown) => {
    setDraft((current) => ({ ...current, [name]: value }));
  };

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["resource", category, resourceId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["override", category, resourceId],
      }),
      queryClient.invalidateQueries({ queryKey: ["collection", category] }),
      queryClient.invalidateQueries({ queryKey: ["next-id", category] }),
    ]);
  };

  const handleSave = async (event: SubmitEvent) => {
    event.preventDefault();
    if (busy) return;
    const missing = editor.fields.some(
      (spec) => spec.required && !String(draft[spec.name] ?? "").trim(),
    );
    if (missing) {
      setError("Required fields need a value.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await editor.save(resourceId, draft);
      await invalidate();
      navigate(`/${category}/${resourceId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await editor.restore(resourceId);
      await invalidate();
      navigate(`/${category}/${resourceId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (busy) return;
    if (!window.confirm("Delete this item?")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteResource(category, resourceId);
      await invalidate();
      navigate(`/?categories=${category}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <p className="text-sm">
        {isNew ? (
          <strong className="font-semibold text-slate-700">
            New entity — will be saved as a local addition.
          </strong>
        ) : modified ? (
          <strong className="font-semibold text-amber-600">
            Modified locally — saving overwrites the local modification.
          </strong>
        ) : (
          <span className="text-slate-500">
            Editing the API response — changes are stored locally only.
          </span>
        )}
      </p>
      {!isNew && modified ? (
        <div>
          <button
            type="button"
            onClick={handleRestore}
            disabled={busy}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition-colors hover:border-amber-500 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Restore from API
          </button>
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {editor.fields.map((spec) => (
          <FieldRow
            key={spec.name}
            spec={spec}
            value={draft[spec.name]}
            onChange={(value) => updateField(spec.name, value)}
          />
        ))}
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        <Link
          to={
            isNew ? `/?categories=${category}` : `/${category}/${resourceId}`
          }
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
        >
          Cancel
        </Link>
        {!isNew ? (
          <button
            type="button"
            disabled={busy}
            onClick={handleDelete}
            className="ml-auto rounded-md border border-red-300 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}

interface FieldRowProps {
  spec: FieldSpec;
  value: unknown;
  onChange: (value: unknown) => void;
}

function FieldRow({ spec, value, onChange }: FieldRowProps) {
  const fullWidth =
    spec.kind === "multiline" || spec.kind === "list" ? "md:col-span-2" : "";
  return (
    <div className={fullWidth}>
      <label className="block text-sm font-medium text-slate-700">
        {spec.label}
        {spec.required ? (
          <span className="text-red-500" title="required">
            {" "}
            *
          </span>
        ) : null}
        {spec.kind === "text" ? (
          <input
            type="text"
            value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(event.target.value)}
            className={inputClass}
          />
        ) : null}
        {spec.kind === "number" ? (
          <input
            type="number"
            value={typeof value === "number" ? value : ""}
            onChange={(event) =>
              onChange(
                event.target.value === "" ? 0 : Number(event.target.value),
              )
            }
            className={inputClass}
          />
        ) : null}
        {spec.kind === "boolean" ? (
          <input
            type="checkbox"
            checked={value === true}
            onChange={(event) => onChange(event.target.checked)}
            className="mt-1 block h-4 w-4 accent-blue-600"
          />
        ) : null}
        {spec.kind === "list" ? (
          <ListEditor
            value={Array.isArray(value) ? value : []}
            onChange={onChange}
          />
        ) : null}
        {spec.kind === "multiline" ? (
          <textarea
            rows={6}
            value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(event.target.value)}
            className={inputClass}
          />
        ) : null}
      </label>
    </div>
  );
}

function ListEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [raw, setRaw] = useState(() => value.join("\n"));
  return (
    <textarea
      rows={Math.max(3, value.length)}
      value={raw}
      onChange={(event) => {
        setRaw(event.target.value);
        onChange(
          event.target.value.split("\n").filter((line) => line.trim() !== ""),
        );
      }}
      className={inputClass}
      placeholder="One entry per line"
    />
  );
}
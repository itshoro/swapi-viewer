import { useQueryClient } from "@tanstack/react-query";
import {
  deleteResource,
  resourceLabel,
  setResourcePinned,
  type CollectionItem,
} from "../../dal/swapi";

export function useResourceActions(
  selectedKey: string | null,
  onDeleteSelected: () => void,
) {
  const queryClient = useQueryClient();

  const togglePin = async (item: CollectionItem) => {
    try {
      await setResourcePinned(item.category, item.id, !item.pinned);
      await queryClient.invalidateQueries({
        queryKey: ["collection", item.category],
      });
    } catch {
      // Pin storage is best-effort; ignore failures.
    }
  };

  const remove = async (item: CollectionItem) => {
    if (!window.confirm(`Delete "${resourceLabel(item.resource)}"?`)) return;
    try {
      await deleteResource(item.category, item.id);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["collection", item.category],
        }),
        queryClient.invalidateQueries({ queryKey: ["deleted-keys"] }),
      ]);
      if (selectedKey === item.key) onDeleteSelected();
    } catch {
      // Delete storage is best-effort; ignore failures.
    }
  };

  return { togglePin, remove };
}
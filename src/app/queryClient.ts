import { QueryClient } from "@tanstack/react-query";
import { CACHE_LIFETIME_MS } from "../dal/cache";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE_LIFETIME_MS,
      gcTime: CACHE_LIFETIME_MS,
      retry: 2,
    },
  },
});
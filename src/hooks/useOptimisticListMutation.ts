import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';

interface Options<TItem, TVars, TResult> {
  queryKey: QueryKey;
  mutationFn: (vars: TVars) => Promise<TResult>;
  /** Produces the optimistic version of the cached list. */
  optimistic: (list: TItem[], vars: TVars) => TItem[];
  /** Reconciles the cached list with the server response. Defaults to a refetch. */
  reconcile?: (list: TItem[], result: TResult, vars: TVars) => TItem[];
}

/**
 * Shared optimistic-update recipe for list queries:
 * cancel in-flight fetches, snapshot, apply the optimistic change, roll back on
 * error, and reconcile with the server response (or refetch) once settled.
 */
export function useOptimisticListMutation<TItem, TVars, TResult>({
  queryKey,
  mutationFn,
  optimistic,
  reconcile,
}: Options<TItem, TVars, TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onMutate: async (vars: TVars) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<TItem[]>(queryKey);
      if (previous) qc.setQueryData<TItem[]>(queryKey, optimistic(previous, vars));
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKey, ctx.previous);
    },
    onSuccess: (result, vars) => {
      if (reconcile) qc.setQueryData<TItem[]>(queryKey, (list) => (list ? reconcile(list, result, vars) : list));
    },
    onSettled: () => {
      if (!reconcile) return qc.invalidateQueries({ queryKey });
    },
  });
}

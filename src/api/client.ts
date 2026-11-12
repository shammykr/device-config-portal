const ENDPOINT = '/graphql';

export class GraphQLRequestError extends Error {}

/** Minimal GraphQL-over-HTTP client used by all React Query hooks. */
export async function gqlRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new GraphQLRequestError(json.errors.map((e) => e.message).join('; '));
  if (!res.ok || !json.data) throw new GraphQLRequestError(`Request failed (${res.status})`);
  return json.data;
}

/**
 * Subscribes to a GraphQL subscription over Server-Sent Events (graphql-yoga's
 * default transport). Returns an unsubscribe function.
 */
export function gqlSubscribe<T>(query: string, onData: (data: T) => void): () => void {
  const url = `${ENDPOINT}?query=${encodeURIComponent(query)}`;
  const source = new EventSource(url);
  source.addEventListener('next', (e) => {
    const payload = JSON.parse((e as MessageEvent<string>).data) as { data?: T };
    if (payload.data) onData(payload.data);
  });
  return () => source.close();
}

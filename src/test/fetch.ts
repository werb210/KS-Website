import { vi } from "vitest";

export type Handler = (url: string, init?: RequestInit) => { status?: number; body?: unknown } | Promise<{ status?: number; body?: unknown }>;

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/** Stub global fetch, answering by URL substring. Unmatched URLs return 404. */
export function mockFetch(routes: Record<string, Handler>) {
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    for (const [frag, h] of Object.entries(routes)) {
      if (url.includes(frag)) {
        const r = await h(url, init);
        return jsonResponse(r.status ?? 200, r.body ?? {});
      }
    }
    return jsonResponse(404, { error: "not_found" });
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

export function callsTo(fn: ReturnType<typeof mockFetch>, frag: string) {
  return fn.mock.calls.filter(([u]) => String(u).includes(frag));
}

// KS_WEBSITE_KB_v1 - the website's assistant and help articles, both served by KS-Ops:
//   POST /api/public/assistant/chat { messages, page, session } -> { answer, citations, actions }
//   POST /api/public/assistant/lead { name, email, brokerage, team_size, phone?, consent, wants, message?, transcript }
//   GET  /api/public/kb/articles?q=&category=, GET /api/public/kb/articles/:slug, GET /api/public/kb/categories
// The conversation is kept in this tab only (sessionStorage); no cookies are set.
import { opsUrl, PRODUCT_NAME } from "../config";
import { load, save } from "./storage";

export type Turn = { role: "user" | "assistant"; text: string };
export type Citation = { slug: string; title: string; url: string };
export type Action = { kind: "start_demo" | "signup" | "pricing" | "book_demo" | "talk_to_person"; label: string; href: string | null };
export type ChatReply = { answer: string; citations: Citation[]; actions: Action[] };
export type HelpArticle = { slug: string; title: string; category: string; summary: string; updated_at: string | null; body_html?: string };

export const TEAM_SIZES = ["1", "2-5", "6-15", "16-50", "51+"] as const;
export const CONSENT_TEXT = `I agree that ${PRODUCT_NAME} may contact me by email (and phone, if I gave one) about ${PRODUCT_NAME}. I can unsubscribe at any time.`;

const SESSION_KEY = "ks-assistant-session";
export const CHAT_KEY = "ks-assistant-chat";

/** A random id for this tab, so the assistant's daily limit is per visitor. Never sent anywhere else. */
export function sessionId(): string {
  const have = load<string>(SESSION_KEY);
  if (typeof have === "string" && /^[A-Za-z0-9_-]{8,64}$/.test(have)) return have;
  const bytes = new Uint8Array(12);
  try {
    crypto.getRandomValues(bytes);
  } catch {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  const id = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  save(SESSION_KEY, id);
  return id;
}

/** The page the visitor is on, so the assistant can use the website's own words. */
export function currentPage(path: string = window.location.pathname): { path: string; title: string; text: string } {
  const main = document.querySelector("main");
  const text = (main?.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 3000);
  return { path: path || "/", title: document.title.slice(0, 120), text };
}

const KINDS = new Set(["start_demo", "signup", "pricing", "book_demo", "talk_to_person"]);
const SAFE_PATH = /^\/[A-Za-z0-9/_-]*$/;

export async function sendChat(messages: Turn[], path?: string): Promise<{ ok: true; reply: ChatReply } | { ok: false; error: string; limited?: boolean }> {
  try {
    const res = await fetch(opsUrl("/api/public/assistant/chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ messages: messages.slice(-12), page: currentPage(path), session: sessionId() }),
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.status === 429) return { ok: false, limited: true, error: String(body.message || "I've had a lot of questions just now. Please try again in a few minutes.") };
    if (!res.ok) return { ok: false, error: "Sorry, I couldn't answer just now. Please try again, or contact us." };
    const citations: Citation[] = (Array.isArray(body.citations) ? body.citations : [])
      .map((c: unknown) => (c && typeof c === "object" ? (c as Record<string, unknown>) : {}))
      .filter((c) => typeof c.slug === "string" && /^[a-z0-9-]+$/.test(c.slug) && typeof c.title === "string")
      .map((c) => ({ slug: String(c.slug), title: String(c.title), url: `/help/${String(c.slug)}` }));
    const actions: Action[] = (Array.isArray(body.actions) ? body.actions : [])
      .map((a: unknown) => (a && typeof a === "object" ? (a as Record<string, unknown>) : {}))
      .filter((a) => KINDS.has(String(a.kind)))
      .map((a) => ({ kind: a.kind as Action["kind"], label: String(a.label ?? ""), href: typeof a.href === "string" && SAFE_PATH.test(a.href) ? a.href : null }));
    return { ok: true, reply: { answer: String(body.answer ?? ""), citations, actions } };
  } catch {
    return { ok: false, error: "Sorry, I couldn't reach the server. Please check your connection and try again." };
  }
}

export type LeadInput = {
  name: string;
  email: string;
  brokerage: string;
  team_size: string;
  phone: string;
  consent: boolean;
  wants: "info" | "live_demo" | "person";
  message: string;
  transcript: Turn[];
};

export async function sendLead(l: LeadInput): Promise<{ ok: true; message: string } | { ok: false; errors: Record<string, string> }> {
  try {
    const res = await fetch(opsUrl("/api/public/assistant/lead"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ...l, phone: l.phone.trim() || undefined, message: l.message.trim() || undefined, transcript: l.transcript.slice(-20), website_url: "" }),
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.ok) return { ok: true, message: String(body.message ?? "Thanks. We will be in touch soon.") };
    if (res.status === 429) return { ok: false, errors: { form: "Too many requests from this connection. Please try again later." } };
    const errors = body.errors && typeof body.errors === "object" ? (body.errors as Record<string, string>) : {};
    return { ok: false, errors: Object.keys(errors).length ? errors : { form: "We couldn't send that. Please try again." } };
  } catch {
    return { ok: false, errors: { form: "We couldn't reach the server. Please check your connection and try again." } };
  }
}

export async function fetchArticles(q: string, category = ""): Promise<HelpArticle[] | null> {
  const p = new URLSearchParams();
  if (q.trim()) p.set("q", q.trim());
  if (category) p.set("category", category);
  try {
    const res = await fetch(opsUrl(`/api/public/kb/articles${p.toString() ? `?${p}` : ""}`), { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const body = (await res.json()) as { articles?: HelpArticle[] };
    return Array.isArray(body.articles) ? body.articles : [];
  } catch {
    return null;
  }
}

export async function fetchArticle(slug: string): Promise<HelpArticle | null | "missing"> {
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return "missing";
  try {
    const res = await fetch(opsUrl(`/api/public/kb/articles/${slug}`), { headers: { Accept: "application/json" } });
    if (res.status === 404) return "missing";
    if (!res.ok) return null;
    const body = (await res.json()) as { article?: HelpArticle };
    return body.article ?? "missing";
  } catch {
    return null;
  }
}

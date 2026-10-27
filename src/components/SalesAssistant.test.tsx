// KS_WEBSITE_KB_v1 - Maya on the website: asks KS-Ops with the page the visitor is on, links the help articles it used,
// offers next steps, captures a lead only with consent, hands off to a person, keeps no cookies, and handles the limit.
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { callsTo, mockFetch } from "../test/fetch";
import { SalesAssistant } from "./SalesAssistant";
import Help from "../pages/Help";

const renderIt = () =>
  render(
    <MemoryRouter initialEntries={["/pricing"]}>
      <main><h1>Pricing</h1><p>Starter, Growth and Pro.</p></main>
      <SalesAssistant />
    </MemoryRouter>,
  );

const askQ = (q: string) => {
  fireEvent.change(screen.getByLabelText("Your question"), { target: { value: q } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
};

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

describe("website assistant", () => {
  it("answers with linked help articles and next-step actions, sending the page it is on", async () => {
    const f = mockFetch({
      "/api/public/assistant/chat": () => ({
        body: {
          answer: "Growth is **$119 CAD** a seat a month billed yearly. See [Pricing](/pricing).",
          citations: [{ slug: "plans-compared", title: "Plans compared: Starter, Growth and Pro", url: "/help/plans-compared" }],
          actions: [{ kind: "start_demo", label: "Try the demo yourself", href: "/try" }, { kind: "book_demo", label: "Book a live demo", href: null }, { kind: "evil", label: "x", href: "javascript:alert(1)" }],
        },
      }),
    });
    renderIt();
    fireEvent.click(screen.getByRole("button", { name: "Questions? Ask Maya" }));
    askQ("How much is Growth?");
    const answer = await screen.findByTestId("ka-answer");
    expect(answer).toHaveTextContent("Growth is $119 CAD a seat a month billed yearly.");
    expect(within(answer).getByRole("link", { name: "Plans compared: Starter, Growth and Pro" })).toHaveAttribute("href", "/help/plans-compared");
    expect(within(answer).getByRole("link", { name: "Try the demo yourself" })).toHaveAttribute("href", "/try");
    expect(within(answer).queryByText("x")).toBeNull();
    const body = JSON.parse(String(callsTo(f, "/assistant/chat")[0][1]?.body));
    expect(body.messages).toEqual([{ role: "user", text: "How much is Growth?" }]);
    expect(body.page.path).toBe("/pricing");
    expect(body.page.text).toContain("Starter, Growth and Pro.");
    expect(body.session).toMatch(/^[0-9a-f]{24}$/);
    expect(document.cookie).toBe("");

    fireEvent.click(within(answer).getByRole("button", { name: "Book a live demo" }));
    expect(screen.getByRole("form", { name: "Book a live demo" })).toBeInTheDocument();
  });

  it("captures a lead only with consent, then hands off to a person", async () => {
    const f = mockFetch({
      "/api/public/assistant/lead": () => ({ status: 201, body: { ok: true, handed_off: true, message: "Thanks, Robin. Someone will contact you within one business day." } }),
    });
    renderIt();
    fireEvent.click(screen.getByRole("button", { name: "Questions? Ask Maya" }));
    fireEvent.click(screen.getByRole("button", { name: "Talk to a person" }));
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Robin Ray" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "robin@raycap.example" } });
    fireEvent.change(screen.getByLabelText("Brokerage"), { target: { value: "Ray Capital" } });
    fireEvent.change(screen.getByLabelText("Team size"), { target: { value: "6-15" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("Tick the box so we can contact you")).toBeInTheDocument();
    expect(callsTo(f, "/assistant/lead")).toHaveLength(0);

    fireEvent.click(screen.getByLabelText(/may contact me/));
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Someone will contact you within one business day.");
    const body = JSON.parse(String(callsTo(f, "/assistant/lead")[0][1]?.body));
    expect(body).toMatchObject({ name: "Robin Ray", email: "robin@raycap.example", brokerage: "Ray Capital", team_size: "6-15", consent: true, wants: "person", website_url: "" });
    // The demo and sign-up forms are pre-filled for them later.
    expect(localStorage.getItem("ks-demo-contact")).toContain("Ray Capital");
  });

  it("shows the server's errors and the rate-limit message", async () => {
    mockFetch({ "/api/public/assistant/chat": () => ({ status: 429, body: { error: "rate_limited", message: "I've had a lot of questions just now." } }) });
    renderIt();
    fireEvent.click(screen.getByRole("button", { name: "Questions? Ask Maya" }));
    askQ("hello");
    expect(await screen.findByRole("alert")).toHaveTextContent("I've had a lot of questions just now.");
  });
});

describe("help articles page", () => {
  it("cleans article HTML and keeps links between articles on the site", async () => {
    mockFetch({
      "/api/public/kb/articles/plans-compared": () => ({
        body: { article: { slug: "plans-compared", title: "Plans compared", category: "Plans and billing", summary: "s", updated_at: "2026-10-20T00:00:00Z",
          body_html: '<p>See <a href="#kb-free-trials-and-demo" data-kb-slug="free-trials-and-demo">trials</a>.</p><img src="x" onerror="alert(1)"><script>alert(2)</script><a href="javascript:alert(3)">bad</a>' } },
      }),
    });
    const { container } = render(
      <MemoryRouter initialEntries={["/help/plans-compared"]}><Routes><Route path="/help/:slug" element={<Help />} /></Routes></MemoryRouter>,
    );
    expect(await screen.findByRole("heading", { name: "Plans compared" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("link", { name: "trials" })).toHaveAttribute("href", "/help/free-trials-and-demo"));
    expect(container.innerHTML).not.toMatch(/onerror|<script|javascript:/);
    expect(screen.getByText(/Last updated/)).toBeInTheDocument();
  });
});

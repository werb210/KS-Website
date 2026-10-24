// KS_WEBSITE_BETA_v1 - the beta programme page, its sign-up form (to KS-Ops) and the call to action that leads to it.
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { callsTo, mockFetch } from "../test/fetch";
import { renderAt } from "../test/render";
import { FeatureRequest } from "../components/FeatureRequest";
import BetaProgramme from "./BetaProgramme";

const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const submit = () => fireEvent.click(screen.getByRole("button", { name: "Join the beta programme" }));

describe("Beta programme", () => {
  it("explains early access, shaping the product, switching off and change", () => {
    mockFetch({});
    renderAt(<BetaProgramme />, "/beta");
    expect(screen.getByRole("heading", { name: "Beta programme" })).toBeInTheDocument();
    expect(screen.getByText("Early access.")).toBeInTheDocument();
    expect(screen.getByText("Shape the product.")).toBeInTheDocument();
    expect(screen.getByText("Switch it off any time.")).toBeInTheDocument();
    expect(screen.getByText("Things may change.")).toBeInTheDocument();
  });

  it("checks the form before sending anything", () => {
    const f = mockFetch({});
    renderAt(<BetaProgramme />, "/beta");
    type("Work email", "nope");
    submit();
    expect(screen.getByText("Enter your name.")).toBeInTheDocument();
    expect(screen.getByText(/Enter an email address/)).toBeInTheDocument();
    expect(screen.getByText("Enter your brokerage's name.")).toBeInTheDocument();
    expect(f).not.toHaveBeenCalled();
  });

  it("sends name, email, brokerage and interests to KS-Ops and thanks them", async () => {
    const f = mockFetch({ "/api/public/beta-signup": () => ({ status: 201, body: { ok: true, message: "Thanks - you're on the list." } }) });
    renderAt(<BetaProgramme />, "/beta");
    type("Your name", "Dana Prospect");
    type("Work email", "dana@brokerco.example");
    type("Brokerage", "BrokerCo");
    fireEvent.click(screen.getByLabelText("Mobile apps"));
    fireEvent.click(screen.getByLabelText("Reporting"));
    submit();
    expect(await screen.findByTestId("beta-sent")).toHaveTextContent("Thanks - you're on the list.");
    const [, init] = callsTo(f, "/api/public/beta-signup")[0]!;
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      name: "Dana Prospect", email: "dana@brokerco.example", brokerage: "BrokerCo", interests: ["mobile_apps", "reporting"], website_url: "",
    });
  });

  it("shows the server's field errors", async () => {
    mockFetch({ "/api/public/beta-signup": () => ({ status: 400, body: { errors: { email: "Enter a valid email address" } } }) });
    renderAt(<BetaProgramme />, "/beta");
    type("Your name", "Dana");
    type("Work email", "dana@brokerco.example");
    type("Brokerage", "BrokerCo");
    submit();
    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Some details need fixing");
  });
});

describe("Don't see a feature your business needs?", () => {
  it("offers the beta programme next to the idea link", () => {
    renderAt(<FeatureRequest />, "/");
    expect(screen.getByRole("link", { name: "Tell us your idea" })).toHaveAttribute("href", "/contact");
    expect(screen.getByRole("link", { name: "Join our beta programme" })).toHaveAttribute("href", "/beta");
  });
});

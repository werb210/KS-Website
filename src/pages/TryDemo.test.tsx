import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { callsTo, mockFetch } from "../test/fetch";
import { renderAt } from "../test/render";
import TryDemo from "./TryDemo";

const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const fill = () => {
  type("Your name", "Dana Prospect");
  type("Work email", "dana@brokerco.example");
  type("Mobile phone", "4035550199");
  type("Brokerage", "BrokerCo");
};
const submit = () => fireEvent.click(screen.getByRole("button", { name: "Text me my demo link" }));

describe("Try it yourself", () => {
  it("explains what the demo covers", () => {
    mockFetch({});
    renderAt(<TryDemo />, "/try");
    expect(screen.getByRole("heading", { name: "Try it yourself" })).toBeInTheDocument();
    expect(screen.getByText(/One bank statement was doctored/)).toBeInTheDocument();
    expect(screen.getByText(/iPhone and Apple Watch/)).toBeInTheDocument();
  });

  it("formats the mobile number as it is typed", () => {
    mockFetch({});
    renderAt(<TryDemo />, "/try");
    type("Mobile phone", "4035550199");
    expect(screen.getByLabelText("Mobile phone")).toHaveValue("(403) 555-0199");
  });

  it("checks the form before sending anything", () => {
    const f = mockFetch({});
    renderAt(<TryDemo />, "/try");
    type("Work email", "not-an-email");
    submit();
    expect(screen.getByText("Enter your name.")).toBeInTheDocument();
    expect(screen.getByText(/Enter an email address/)).toBeInTheDocument();
    expect(screen.getByText("Enter your brokerage's name.")).toBeInTheDocument();
    expect(screen.getByText(/Enter your mobile number/)).toBeInTheDocument();
    expect(f).not.toHaveBeenCalled();
  });

  it("asks KS-Ops for the demo (honeypot empty) and tells the person to check their email", async () => {
    const f = mockFetch({ "/api/public/demo/signup": () => ({ status: 201, body: { ok: true, message: "Check your email - we've sent you a private link to your demo." } }) });
    renderAt(<TryDemo />, "/try");
    fill();
    submit();
    expect(await screen.findByTestId("demo-sent")).toHaveTextContent("Check your email");
    expect(screen.getByTestId("demo-sent")).toHaveTextContent("dana@brokerco.example");
    const [, init] = callsTo(f, "/api/public/demo/signup")[0]!;
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({ name: "Dana Prospect", email: "dana@brokerco.example", phone: "(403) 555-0199", company: "BrokerCo", website_url: "" });
  });

  it("shows the service's field errors and limits", async () => {
    mockFetch({ "/api/public/demo/signup": () => ({ status: 400, body: { errors: { email: "Enter a valid email address" } } }) });
    renderAt(<TryDemo />, "/try");
    fill();
    submit();
    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Some details need fixing");
  });

  it("passes on 'too many' and 'busy' messages in plain words", async () => {
    mockFetch({ "/api/public/demo/signup": () => ({ status: 429, body: { error: "too_many_demos", message: "Too many demos were started from this network today. Please try again tomorrow." } }) });
    renderAt(<TryDemo />, "/try");
    fill();
    submit();
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Please try again tomorrow."));
  });
});

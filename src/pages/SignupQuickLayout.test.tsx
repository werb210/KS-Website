// KS_WEBSITE_SIGNUP_LAYOUT_v1 - the sign-up page uses the site's centred wrapper and a single brand in its title.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const src = readFileSync("src/pages/SignupQuick.tsx", "utf8");

describe("sign-up layout", () => {
  it("uses .wrap (centred, with side gutters), never the unstyled .container", () => {
    expect(src).not.toMatch(/className="container/);
    expect(src).toMatch(/className="wrap signup"/);
    expect(src).toMatch(/className="wrap signup__done"/);
  });
  it("lets usePageMeta add the brand once", () => {
    expect(src).toMatch(/usePageMeta\("Sign up",/);
  });
});

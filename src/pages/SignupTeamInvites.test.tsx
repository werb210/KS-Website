// KS_WEBSITE_TEAM_INVITE_TIMING_v1
import { describe, expect, it } from "vitest";
import { buildPayload } from "./Signup";
import { EMPTY_FORM } from "../lib/validation";

describe("sign-up: when the team is invited", () => {
  it("invites as soon as the system is ready by default", () => {
    expect(buildPayload({ ...EMPTY_FORM }, "").team_invites).toBe("auto");
  });
  it("holds the invites when the owner will set up first", () => {
    expect(buildPayload({ ...EMPTY_FORM, team_invites: "owner" }, "").team_invites).toBe("owner");
  });
});

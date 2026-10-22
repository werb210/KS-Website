import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { callsTo, mockFetch } from "../test/fetch";
import { CODE_CHECK_DEBOUNCE_MS, useCodeAvailability } from "./useCodeAvailability";

describe("useCodeAvailability", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("debounces typing into a single request for the final value", async () => {
    const f = mockFetch({
      "company-code-available": (url) => ({ body: { available: !url.includes("taken") } }),
    });
    const { result, rerender } = renderHook(({ code }) => useCodeAvailability(code), { initialProps: { code: "" } });
    expect(result.current.state).toBe("idle");
    for (const c of ["pra", "prai", "prair", "prairie"]) {
      rerender({ code: c });
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
    }
    expect(callsTo(f, "company-code-available")).toHaveLength(0);
    expect(result.current.state).toBe("checking");
    await act(async () => {
      vi.advanceTimersByTime(CODE_CHECK_DEBOUNCE_MS);
    });
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    const calls = callsTo(f, "company-code-available");
    expect(calls).toHaveLength(1);
    expect(String(calls[0][0])).toContain("code=prairie");
    expect(result.current.state).toBe("available");
  });

  it("reports taken codes with the reason", async () => {
    mockFetch({ "company-code-available": () => ({ body: { available: false, reason: "reserved" } }) });
    const { result } = renderHook(() => useCodeAvailability("taken-code"));
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(result.current).toEqual({ state: "taken", reason: "reserved" });
  });

  it("doesn't call the API for badly formatted codes", async () => {
    const f = mockFetch({});
    const { result } = renderHook(() => useCodeAvailability("No Spaces"));
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(result.current.state).toBe("invalid");
    expect(f).not.toHaveBeenCalled();
  });

  it("reports an error when the check fails", async () => {
    mockFetch({ "company-code-available": () => ({ status: 500 }) });
    const { result } = renderHook(() => useCodeAvailability("abc-co"));
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(result.current.state).toBe("error");
  });
});

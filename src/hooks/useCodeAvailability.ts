import { useEffect, useState } from "react";
import { checkCompanyCode } from "../lib/api";
import { codeFormatError, type CodeState } from "../lib/validation";

export const CODE_CHECK_DEBOUNCE_MS = 400;

/** Debounced live check of a company code against KS-Ops. One request per pause in typing. */
export function useCodeAvailability(code: string): { state: CodeState; reason?: string } {
  const [result, setResult] = useState<{ code: string; state: CodeState; reason?: string }>({
    code: "",
    state: "idle",
  });

  const formatError = code ? codeFormatError(code) : null;

  useEffect(() => {
    if (!code || formatError) return;
    const ac = new AbortController();
    const t = setTimeout(() => {
      setResult({ code, state: "checking" });
      checkCompanyCode(code, ac.signal)
        .then((r) => setResult({ code, state: r.available ? "available" : "taken", reason: r.reason }))
        .catch(() => {
          if (!ac.signal.aborted) setResult({ code, state: "error" });
        });
    }, CODE_CHECK_DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [code, formatError]);

  if (!code) return { state: "idle" };
  if (formatError) return { state: "invalid", reason: formatError };
  if (result.code !== code) return { state: "checking" };
  return { state: result.state, reason: result.reason };
}

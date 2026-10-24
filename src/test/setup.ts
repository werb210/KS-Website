import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";
import { resetCatalogCache } from "../hooks/useCatalog";

beforeEach(() => {
  resetCatalogCache();
  try {
    window.sessionStorage.clear();
    window.localStorage.clear();
  } catch {
    /* ignore */
  }
  window.scrollTo = () => {};
});

afterEach(() => {
  cleanup();
});

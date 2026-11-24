// KS_WEBSITE_COUNTRY_v1
import { describe, expect, it } from "vitest";
import { countryFromBrowser, currencyOf, detectCountry } from "./country";

describe("visitor country", () => {
  it("reads Canadian and US time zones", () => {
    expect(countryFromBrowser("America/Edmonton")).toBe("CA");
    expect(countryFromBrowser("America/Toronto")).toBe("CA");
    expect(countryFromBrowser("America/Chicago")).toBe("US");
    expect(countryFromBrowser("America/Indiana/Indianapolis")).toBe("US");
    expect(countryFromBrowser("Pacific/Honolulu")).toBe("US");
  });
  it("falls back to the language, then Canada", () => {
    expect(countryFromBrowser("Europe/London", ["en-US"])).toBe("US");
    expect(countryFromBrowser("Europe/London", ["fr-CA"])).toBe("CA");
    expect(countryFromBrowser("Europe/London", ["en"])).toBeNull();
  });
  it("lets ?country= win and maps the currency", () => {
    expect(detectCountry("?country=us")).toBe("US");
    expect(detectCountry("?country=CA")).toBe("CA");
    expect(currencyOf("US")).toBe("USD");
    expect(currencyOf("CA")).toBe("CAD");
  });
});

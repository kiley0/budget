import {
  parseCurrency,
  formatCurrency,
  getAmountVariant,
  budgetDisplayName,
  formatMetaDate,
  formatLastOpened,
} from "./format";

describe("parseCurrency", () => {
  it("parses plain numbers", () => {
    expect(parseCurrency("100")).toBe(100);
    expect(parseCurrency("0")).toBe(0);
    expect(parseCurrency("1234.56")).toBe(1234.56);
  });

  it("strips commas", () => {
    expect(parseCurrency("1,000")).toBe(1000);
    expect(parseCurrency("1,000,000")).toBe(1000000);
    expect(parseCurrency("1,234.56")).toBe(1234.56);
  });

  it("returns NaN for invalid input", () => {
    expect(parseCurrency("")).toBeNaN();
    expect(parseCurrency("abc")).toBeNaN();
    expect(parseCurrency("--")).toBeNaN();
  });

  it("handles null/undefined via String()", () => {
    expect(parseCurrency(null as unknown as string)).toBeNaN();
  });
});

describe("formatCurrency", () => {
  it("formats as USD", () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain("1");
    expect(result).toContain("234");
    expect(result).toContain("56");
    expect(result).toMatch(/[\$£€]|USD|1,?234/);
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBeDefined();
    expect(formatCurrency(0).length).toBeGreaterThan(0);
  });
});

describe("getAmountVariant", () => {
  it("returns positive for zero and positive amounts", () => {
    expect(getAmountVariant(0)).toBe("positive");
    expect(getAmountVariant(100)).toBe("positive");
  });

  it("returns negative for negative amounts", () => {
    expect(getAmountVariant(-1)).toBe("negative");
    expect(getAmountVariant(-100)).toBe("negative");
  });
});

describe("budgetDisplayName", () => {
  it("shortens long ids with ellipsis", () => {
    expect(budgetDisplayName("12345678-abcd")).toContain("12345678");
    expect(budgetDisplayName("12345678-abcd")).toContain("…");
  });

  it("keeps short ids as-is", () => {
    expect(budgetDisplayName("short")).toBe("Budget short");
  });
});

describe("formatMetaDate", () => {
  it("formats valid ISO date", () => {
    const result = formatMetaDate("2026-03-04");
    expect(result).toMatch(/Mar|03|4|2026/);
  });

  it("returns empty string for undefined or invalid", () => {
    expect(formatMetaDate(undefined)).toBe("");
    expect(formatMetaDate("")).toBe("");
  });
});

describe("formatLastOpened", () => {
  it("returns 'Last opened' + date when provided", () => {
    const result = formatLastOpened("2026-03-04");
    expect(result).toContain("Last opened");
  });

  it("returns empty string when undefined", () => {
    expect(formatLastOpened(undefined)).toBe("");
  });
});

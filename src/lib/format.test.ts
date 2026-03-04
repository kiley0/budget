import { parseCurrency, formatCurrency } from "./format";

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

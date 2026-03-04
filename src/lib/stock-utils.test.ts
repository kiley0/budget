import { computeProceedsAfterTax } from "./stock-utils";

describe("computeProceedsAfterTax", () => {
  it("computes gross when tax rate is 0", () => {
    expect(computeProceedsAfterTax(100, 50, 0)).toBe(5000);
  });

  it("applies tax rate correctly", () => {
    expect(computeProceedsAfterTax(100, 100, 25)).toBe(7500);
  });

  it("returns 0 when shares <= 0", () => {
    expect(computeProceedsAfterTax(0, 100, 0)).toBe(0);
    expect(computeProceedsAfterTax(-1, 100, 0)).toBe(0);
  });

  it("returns 0 when shares is NaN", () => {
    expect(computeProceedsAfterTax(NaN, 100, 0)).toBe(0);
  });

  it("clamps tax rate to 0–100", () => {
    expect(computeProceedsAfterTax(100, 100, -10)).toBe(10000);
    expect(computeProceedsAfterTax(100, 100, 150)).toBe(0);
  });
});

import { describe, expect, it } from "vitest";
import { buildBudgetCommandPaletteCommands } from "./budget-command-palette";

describe("buildBudgetCommandPaletteCommands", () => {
  it("includes core commands and jump entries for each month", () => {
    const months = [
      { year: 2026, monthIndex: 0 },
      { year: 2026, monthIndex: 1 },
    ];
    const commands = buildBudgetCommandPaletteCommands(months);

    expect(commands).toContainEqual({
      value: "back-to-top",
      label: "Back to top",
    });
    expect(commands).toContainEqual({
      value: "add-income",
      label: "Add expected income",
    });
    expect(commands).toContainEqual({
      value: "jump-0",
      label: "Jump to January 2026",
    });
    expect(commands).toContainEqual({
      value: "jump-1",
      label: "Jump to February 2026",
    });
  });

  it("returns 9 core + N jump commands", () => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      year: 2025,
      monthIndex: i,
    }));
    const commands = buildBudgetCommandPaletteCommands(months);
    expect(commands).toHaveLength(9 + 12);
  });
});

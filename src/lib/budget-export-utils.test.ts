import { describe, it, expect } from "vitest";
import { getExportTimestamp } from "./budget-export-utils";

describe("getExportTimestamp", () => {
  it("returns timestamp string in filename-safe format", () => {
    const ts = getExportTimestamp();
    expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}$/);
    expect(ts).not.toContain(":");
  });
});

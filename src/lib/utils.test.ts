import { describe, expect, it } from "vitest";
import { toggleSetMember } from "./utils";

describe("toggleSetMember", () => {
  it("adds item when absent", () => {
    const set = new Set(["a", "b"]);
    const result = toggleSetMember(set, "c");
    expect(result).toEqual(new Set(["a", "b", "c"]));
  });

  it("removes item when present", () => {
    const set = new Set(["a", "b", "c"]);
    const result = toggleSetMember(set, "b");
    expect(result).toEqual(new Set(["a", "c"]));
  });

  it("does not mutate original set", () => {
    const set = new Set(["a"]);
    toggleSetMember(set, "b");
    expect(set).toEqual(new Set(["a"]));
  });
});

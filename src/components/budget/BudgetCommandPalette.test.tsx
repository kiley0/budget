/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BudgetCommandPalette } from "./BudgetCommandPalette";

const baseCommands = [
  { value: "back", label: "Back to top" },
  { value: "add", label: "Add expected income", disabled: false },
  { value: "manage", label: "Manage income" },
];

describe("BudgetCommandPalette", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("renders search input and command list when open", () => {
    const onExecute = vi.fn();
    render(
      <BudgetCommandPalette
        open={true}
        onOpenChange={vi.fn()}
        commands={baseCommands}
        onExecute={onExecute}
      />,
    );
    expect(screen.getByPlaceholderText("Type to search…")).toBeInTheDocument();
    expect(screen.getByText("Back to top")).toBeInTheDocument();
    expect(screen.getByText("Add expected income")).toBeInTheDocument();
    expect(screen.getByText("Manage income")).toBeInTheDocument();
  });

  it("filters commands by search", () => {
    render(
      <BudgetCommandPalette
        open={true}
        onOpenChange={vi.fn()}
        commands={baseCommands}
        onExecute={vi.fn()}
      />,
    );
    const input = screen.getByPlaceholderText("Type to search…");
    fireEvent.change(input, { target: { value: "manage" } });
    expect(screen.getByText("Manage income")).toBeInTheDocument();
    expect(screen.queryByText("Back to top")).not.toBeInTheDocument();
  });

  it("calls onExecute when command is clicked", () => {
    const onExecute = vi.fn();
    render(
      <BudgetCommandPalette
        open={true}
        onOpenChange={vi.fn()}
        commands={baseCommands}
        onExecute={onExecute}
      />,
    );
    fireEvent.click(screen.getByText("Back to top"));
    expect(onExecute).toHaveBeenCalledWith("back");
  });

  it("calls onOpenChange(false) when command is executed", () => {
    const onOpenChange = vi.fn();
    render(
      <BudgetCommandPalette
        open={true}
        onOpenChange={onOpenChange}
        commands={baseCommands}
        onExecute={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Manage income"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not execute disabled commands", () => {
    const onExecute = vi.fn();
    const commands = [
      ...baseCommands,
      { value: "disabled-cmd", label: "Disabled command", disabled: true },
    ];
    render(
      <BudgetCommandPalette
        open={true}
        onOpenChange={vi.fn()}
        commands={commands}
        onExecute={onExecute}
      />,
    );
    const disabledBtn = screen.getByText("Disabled command");
    expect(disabledBtn).toBeDisabled();
    fireEvent.click(disabledBtn);
    expect(onExecute).not.toHaveBeenCalled();
  });
});

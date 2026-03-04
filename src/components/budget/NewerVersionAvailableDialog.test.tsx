/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NewerVersionAvailableDialog } from "./NewerVersionAvailableDialog";

describe("NewerVersionAvailableDialog", () => {
  it("renders when open", () => {
    render(
      <NewerVersionAvailableDialog
        open={true}
        onOpenChange={vi.fn()}
        budgetId="budget-1"
        onUpdate={vi.fn().mockResolvedValue({ ok: false })}
      />,
    );
    expect(screen.getByText("Newer version available")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter your passphrase"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Stay on current version/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Update to latest/i }),
    ).toBeInTheDocument();
  });

  it("calls onDismissWithoutUpdate when Stay on current version is clicked", () => {
    const onDismissWithoutUpdate = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <NewerVersionAvailableDialog
        open={true}
        onOpenChange={onOpenChange}
        budgetId="budget-1"
        onUpdate={vi.fn().mockResolvedValue({ ok: false })}
        onDismissWithoutUpdate={onDismissWithoutUpdate}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Stay on current version/i }),
    );
    expect(onDismissWithoutUpdate).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not call onDismissWithoutUpdate when update succeeds", async () => {
    const onDismissWithoutUpdate = vi.fn();
    const onOpenChange = vi.fn();
    const onUpdate = vi.fn().mockResolvedValue({ ok: true });
    render(
      <NewerVersionAvailableDialog
        open={true}
        onOpenChange={onOpenChange}
        budgetId="budget-1"
        onUpdate={onUpdate}
        onDismissWithoutUpdate={onDismissWithoutUpdate}
      />,
    );
    const passphraseInput = screen.getByPlaceholderText(
      "Enter your passphrase",
    );
    fireEvent.change(passphraseInput, { target: { value: "my-passphrase" } });
    fireEvent.click(screen.getByRole("button", { name: /Update to latest/i }));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith("my-passphrase");
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
    expect(onDismissWithoutUpdate).not.toHaveBeenCalled();
  });

  it("shows error when passphrase is incorrect", async () => {
    render(
      <NewerVersionAvailableDialog
        open={true}
        onOpenChange={vi.fn()}
        budgetId="budget-1"
        onUpdate={vi.fn().mockResolvedValue({ ok: false })}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText("Enter your passphrase"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Update to latest/i }));

    await waitFor(() => {
      expect(screen.getByText(/Incorrect passphrase/i)).toBeInTheDocument();
    });
  });
});

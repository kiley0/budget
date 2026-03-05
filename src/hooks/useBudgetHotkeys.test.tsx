/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import { useBudgetHotkeys } from "./useBudgetHotkeys";

function fireKeyDown(options: {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  target?: HTMLElement;
}) {
  const {
    key,
    metaKey = false,
    ctrlKey = false,
    shiftKey = false,
    target = document.body,
  } = options;
  const e = new KeyboardEvent("keydown", {
    key,
    metaKey,
    ctrlKey,
    shiftKey,
    bubbles: true,
  });
  target.dispatchEvent(e);
  return e;
}

function createMockCallbacks() {
  return {
    setCommandPaletteOpen: vi.fn(),
    setShowDebugSection: vi.fn(),
    setIncomeModalOpen: vi.fn(),
    setExpenseModalOpen: vi.fn(),
    setAddEventDialogOpen: vi.fn(),
    setAddExpenseEventDialogOpen: vi.fn(),
    setYearlySummaryDialogOpen: vi.fn(),
    setDateViewMode: vi.fn(),
    scrollToAdjacentMonth: vi.fn(),
  };
}

const emptyDialogState = {
  commandPaletteOpen: false,
  addEventDialogOpen: false,
  addExpenseEventDialogOpen: false,
  incomeModalOpen: false,
  expenseModalOpen: false,
  yearlySummaryDialogOpen: false,
};

const defaultDeps = {
  dateViewMode: "next-12-months",
};

function TestHost({
  dialogState = emptyDialogState,
  callbacks,
  deps = defaultDeps,
}: {
  dialogState?: Partial<typeof emptyDialogState>;
  callbacks: ReturnType<typeof createMockCallbacks>;
  deps?: Partial<typeof defaultDeps>;
}) {
  useBudgetHotkeys({ ...emptyDialogState, ...dialogState }, callbacks, {
    ...defaultDeps,
    ...deps,
  });
  return <div data-testid="host" />;
}

describe("useBudgetHotkeys", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (cb: () => void) => {
      setTimeout(cb, 0);
    });
  });

  it("opens command palette on Cmd+K", () => {
    const callbacks = createMockCallbacks();
    render(<TestHost callbacks={callbacks} />);

    act(() => {
      fireKeyDown({ key: "k", metaKey: true });
    });

    expect(callbacks.setCommandPaletteOpen).toHaveBeenCalledWith(true);
  });

  it("opens command palette on Ctrl+K", () => {
    const callbacks = createMockCallbacks();
    render(<TestHost callbacks={callbacks} />);

    act(() => {
      fireKeyDown({ key: "k", ctrlKey: true });
    });

    expect(callbacks.setCommandPaletteOpen).toHaveBeenCalledWith(true);
  });

  it("shows debug section on Cmd+Shift+D", () => {
    const callbacks = createMockCallbacks();
    render(<TestHost callbacks={callbacks} />);

    act(() => {
      fireKeyDown({ key: "d", metaKey: true, shiftKey: true });
    });

    expect(callbacks.setShowDebugSection).toHaveBeenCalledWith(true);
  });

  it("opens yearly summary on Y", () => {
    const callbacks = createMockCallbacks();
    render(<TestHost callbacks={callbacks} />);

    act(() => {
      fireKeyDown({ key: "y" });
    });

    expect(callbacks.setYearlySummaryDialogOpen).toHaveBeenCalledWith(true);
  });

  it("opens add income dialog on I", () => {
    const callbacks = createMockCallbacks();
    render(<TestHost callbacks={callbacks} />);

    act(() => {
      fireKeyDown({ key: "i" });
    });

    expect(callbacks.setAddEventDialogOpen).toHaveBeenCalledWith(true);
  });

  it("opens income modal on Cmd+I", () => {
    const callbacks = createMockCallbacks();
    render(<TestHost callbacks={callbacks} />);

    act(() => {
      fireKeyDown({ key: "i", metaKey: true });
    });

    expect(callbacks.setIncomeModalOpen).toHaveBeenCalledWith(true);
  });

  it("opens add expense dialog on E", () => {
    const callbacks = createMockCallbacks();
    render(<TestHost callbacks={callbacks} />);

    act(() => {
      fireKeyDown({ key: "e" });
    });

    expect(callbacks.setAddExpenseEventDialogOpen).toHaveBeenCalledWith(true);
  });

  it("opens expense modal on Cmd+E", () => {
    const callbacks = createMockCallbacks();
    render(<TestHost callbacks={callbacks} />);

    act(() => {
      fireKeyDown({ key: "e", metaKey: true });
    });

    expect(callbacks.setExpenseModalOpen).toHaveBeenCalledWith(true);
  });

  it("scrolls to adjacent month on J", () => {
    const callbacks = createMockCallbacks();
    render(<TestHost callbacks={callbacks} />);

    act(() => {
      fireKeyDown({ key: "j" });
    });

    expect(callbacks.scrollToAdjacentMonth).toHaveBeenCalledWith(-1);
  });

  it("scrolls to adjacent month on K (without modifier)", () => {
    const callbacks = createMockCallbacks();
    render(<TestHost callbacks={callbacks} />);

    act(() => {
      fireKeyDown({ key: "k" });
    });

    expect(callbacks.scrollToAdjacentMonth).toHaveBeenCalledWith(1);
  });

  it("does not fire hotkeys when command palette is open", () => {
    const callbacks = createMockCallbacks();
    render(
      <TestHost
        callbacks={callbacks}
        dialogState={{ commandPaletteOpen: true }}
      />,
    );

    act(() => {
      fireKeyDown({ key: "y" });
    });

    expect(callbacks.setYearlySummaryDialogOpen).not.toHaveBeenCalled();
  });

  it("does not fire hotkeys when a dialog is open", () => {
    const callbacks = createMockCallbacks();
    render(
      <TestHost
        callbacks={callbacks}
        dialogState={{ yearlySummaryDialogOpen: true }}
      />,
    );

    act(() => {
      fireKeyDown({ key: "y" });
    });

    expect(callbacks.setYearlySummaryDialogOpen).not.toHaveBeenCalled();
  });

  it("does not fire hotkeys when focus is in an input", () => {
    const callbacks = createMockCallbacks();
    const input = document.createElement("input");
    document.body.appendChild(input);

    render(<TestHost callbacks={callbacks} />);

    act(() => {
      fireKeyDown({ key: "y", target: input });
    });

    expect(callbacks.setYearlySummaryDialogOpen).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it("does not fire hotkeys when focus is in a textarea", () => {
    const callbacks = createMockCallbacks();
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);

    render(<TestHost callbacks={callbacks} />);

    act(() => {
      fireKeyDown({ key: "y", target: textarea });
    });

    expect(callbacks.setYearlySummaryDialogOpen).not.toHaveBeenCalled();
    document.body.removeChild(textarea);
  });

  it("calls setDateViewMode on C when in next-year mode", () => {
    const callbacks = createMockCallbacks();
    render(
      <TestHost callbacks={callbacks} deps={{ dateViewMode: "next-year" }} />,
    );

    act(() => {
      fireKeyDown({ key: "c" });
    });

    expect(callbacks.setDateViewMode).toHaveBeenCalledWith("next-12-months");
  });
});

/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PaycheckIncomeForm } from "./PaycheckIncomeForm";

describe("PaycheckIncomeForm", () => {
  it("renders gross amount and withholdings inputs", () => {
    render(
      <PaycheckIncomeForm
        idPrefix="test-paycheck"
        gross=""
        withholdings={{}}
        onGrossChange={vi.fn()}
        onWithholdingChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Gross amount")).toBeInTheDocument();
    expect(screen.getByText("Withholdings")).toBeInTheDocument();
  });

  it("displays take-home when gross is valid", () => {
    render(
      <PaycheckIncomeForm
        idPrefix="test"
        gross="5000"
        withholdings={{}}
        onGrossChange={vi.fn()}
        onWithholdingChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/Take-home \(expected\):/)).toBeInTheDocument();
  });

  it("calls onGrossChange when gross input changes", () => {
    const onGrossChange = vi.fn();
    render(
      <PaycheckIncomeForm
        idPrefix="test"
        gross=""
        withholdings={{}}
        onGrossChange={onGrossChange}
        onWithholdingChange={vi.fn()}
      />,
    );
    const grossInput = screen.getByLabelText("Gross amount");
    fireEvent.change(grossInput, { target: { value: "5000" } });
    expect(onGrossChange).toHaveBeenCalledWith("5000");
  });
});

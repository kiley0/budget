/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StockIncomeForm } from "./StockIncomeForm";

function createMockStockFetch(overrides = {}) {
  return {
    fetch: vi.fn(),
    price: null as number | null,
    loading: false,
    error: null as string | null,
    reset: vi.fn(),
    ...overrides,
  };
}

describe("StockIncomeForm", () => {
  it("renders symbol, shares, and tax rate inputs", () => {
    const stockFetch = createMockStockFetch();
    render(
      <StockIncomeForm
        idPrefix="test-stock"
        symbol=""
        shares=""
        taxRate=""
        onSymbolChange={vi.fn()}
        onSharesChange={vi.fn()}
        onTaxRateChange={vi.fn()}
        stockFetch={stockFetch}
      />,
    );
    expect(screen.getByLabelText("Symbol")).toBeInTheDocument();
    expect(screen.getByLabelText("Shares")).toBeInTheDocument();
    expect(screen.getByLabelText(/Tax rate %/)).toBeInTheDocument();
  });

  it("renders fetch button and calls stockFetch.fetch on click", () => {
    const stockFetch = createMockStockFetch();
    render(
      <StockIncomeForm
        idPrefix="test"
        symbol="AAPL"
        shares="100"
        taxRate="25"
        onSymbolChange={vi.fn()}
        onSharesChange={vi.fn()}
        onTaxRateChange={vi.fn()}
        stockFetch={stockFetch}
      />,
    );
    const btn = screen.getByRole("button", { name: "Fetch current price" });
    fireEvent.click(btn);
    expect(stockFetch.fetch).toHaveBeenCalledWith("AAPL", "100", "25");
  });

  it("disables fetch button when symbol is empty", () => {
    const stockFetch = createMockStockFetch();
    render(
      <StockIncomeForm
        idPrefix="test"
        symbol=""
        shares="100"
        taxRate=""
        onSymbolChange={vi.fn()}
        onSharesChange={vi.fn()}
        onTaxRateChange={vi.fn()}
        stockFetch={stockFetch}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Fetch current price" }),
    ).toBeDisabled();
  });

  it("shows loading state on button when stockFetch.loading", () => {
    const stockFetch = createMockStockFetch({ loading: true });
    render(
      <StockIncomeForm
        idPrefix="test"
        symbol="AAPL"
        shares="100"
        taxRate=""
        onSymbolChange={vi.fn()}
        onSharesChange={vi.fn()}
        onTaxRateChange={vi.fn()}
        stockFetch={stockFetch}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Fetching…" }),
    ).toBeInTheDocument();
  });

  it("shows error when stockFetch.error is set", () => {
    const stockFetch = createMockStockFetch({ error: "Symbol not found" });
    render(
      <StockIncomeForm
        idPrefix="test"
        symbol=""
        shares=""
        taxRate=""
        onSymbolChange={vi.fn()}
        onSharesChange={vi.fn()}
        onTaxRateChange={vi.fn()}
        stockFetch={stockFetch}
      />,
    );
    expect(screen.getByText("Symbol not found")).toBeInTheDocument();
  });

  it("shows current price and proceeds when stockFetch.price is set", () => {
    const stockFetch = createMockStockFetch({ price: 150 });
    render(
      <StockIncomeForm
        idPrefix="test"
        symbol="AAPL"
        shares="100"
        taxRate="25"
        onSymbolChange={vi.fn()}
        onSharesChange={vi.fn()}
        onTaxRateChange={vi.fn()}
        stockFetch={stockFetch}
      />,
    );
    expect(screen.getByText(/Current price:/)).toBeInTheDocument();
    expect(screen.getByText(/Gross:/)).toBeInTheDocument();
    expect(screen.getByText(/Expected after tax:/)).toBeInTheDocument();
  });
});

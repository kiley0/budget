import {
  parseIncomeFormFromInputs,
  computePaycheckTakeHome,
  parseTaxRate,
  isValidAmount,
  type PaycheckFormInputs,
  type StockFormInputs,
} from "./income-form-utils";

describe("isValidAmount", () => {
  it("returns true for non-NaN amounts >= 0", () => {
    expect(isValidAmount(0)).toBe(true);
    expect(isValidAmount(100)).toBe(true);
    expect(isValidAmount(1.5)).toBe(true);
  });

  it("returns false for NaN or negative", () => {
    expect(isValidAmount(NaN)).toBe(false);
    expect(isValidAmount(-1)).toBe(false);
  });
});

describe("parseTaxRate", () => {
  it("parses valid rates 0-100", () => {
    expect(parseTaxRate("0")).toBe(0);
    expect(parseTaxRate("25")).toBe(25);
    expect(parseTaxRate("100")).toBe(100);
  });

  it("returns undefined for invalid", () => {
    expect(parseTaxRate("-1")).toBeUndefined();
    expect(parseTaxRate("101")).toBeUndefined();
    expect(parseTaxRate("abc")).toBeUndefined();
  });
});

describe("computePaycheckTakeHome", () => {
  it("returns gross when no withholdings", () => {
    expect(computePaycheckTakeHome({ gross: "5000", withholdings: {} })).toBe(
      5000,
    );
  });

  it("subtracts withholdings from gross", () => {
    expect(
      computePaycheckTakeHome({
        gross: "5000",
        withholdings: { federalTax: "1000", stateTax: "500" },
      }),
    ).toBe(3500);
  });

  it("returns null for invalid gross", () => {
    expect(computePaycheckTakeHome({ gross: "", withholdings: {} })).toBeNull();
    expect(
      computePaycheckTakeHome({ gross: "-100", withholdings: {} }),
    ).toBeNull();
    expect(
      computePaycheckTakeHome({ gross: "abc", withholdings: {} }),
    ).toBeNull();
  });

  it("handles commas in gross", () => {
    expect(computePaycheckTakeHome({ gross: "5,000", withholdings: {} })).toBe(
      5000,
    );
  });
});

describe("parseIncomeFormFromInputs", () => {
  it("parses simple (non-paycheck, non-stock) income", () => {
    const result = parseIncomeFormFromInputs("other", "3000", null, null);
    expect(result).toEqual({
      amount: 3000,
      stockSaleDetails: undefined,
      paycheckDetails: undefined,
    });
  });

  it("returns null for invalid simple amount", () => {
    expect(parseIncomeFormFromInputs("other", "", null, null)).toBeNull();
    expect(parseIncomeFormFromInputs("other", "-100", null, null)).toBeNull();
  });

  it("parses paycheck income with gross and withholdings", () => {
    const paycheck: PaycheckFormInputs = {
      gross: "5000",
      withholdings: { federalTax: "800", stateTax: "300" },
    };
    const result = parseIncomeFormFromInputs("paycheck", "0", paycheck, null);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(3900);
    expect(result!.paycheckDetails).toEqual({
      grossAmount: 5000,
      withholdings: { federalTax: 800, stateTax: 300 },
    });
  });

  it("returns null for invalid paycheck gross", () => {
    expect(
      parseIncomeFormFromInputs(
        "paycheck",
        "0",
        { gross: "", withholdings: {} },
        null,
      ),
    ).toBeNull();
  });

  it("parses stock income with symbol, shares, tax rate", () => {
    const stock: StockFormInputs = {
      symbol: "AAPL",
      shares: "100",
      taxRate: "25",
    };
    const result = parseIncomeFormFromInputs(
      "stock_sale_proceeds",
      "15000",
      null,
      stock,
    );
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(15000);
    expect(result!.stockSaleDetails).toEqual({
      symbol: "AAPL",
      shares: 100,
      taxRate: 25,
    });
  });

  it("returns null for invalid stock amount", () => {
    const stock: StockFormInputs = {
      symbol: "AAPL",
      shares: "100",
      taxRate: "25",
    };
    expect(
      parseIncomeFormFromInputs("stock_sale_proceeds", "-100", null, stock),
    ).toBeNull();
  });

  it("uppercases stock symbol", () => {
    const stock: StockFormInputs = {
      symbol: "aapl",
      shares: "100",
      taxRate: "0",
    };
    const result = parseIncomeFormFromInputs(
      "stock_sale_proceeds",
      "10000",
      null,
      stock,
    );
    expect(result!.stockSaleDetails?.symbol).toBe("AAPL");
  });
});

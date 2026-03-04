import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

/** GET ?symbol=AAPL — returns current stock price. Must run server-side (yahoo-finance2). */
export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  if (!symbol || !symbol.trim()) {
    return NextResponse.json(
      { error: "Missing or empty symbol" },
      { status: 400 },
    );
  }
  const sym = symbol.trim().toUpperCase();
  try {
    const yahooFinance = new YahooFinance();
    const quote = await yahooFinance.quote(sym);
    const price = quote.regularMarketPrice ?? quote.regularMarketOpen ?? null;
    if (price == null || typeof price !== "number" || Number.isNaN(price)) {
      return NextResponse.json(
        { error: "Could not get price for symbol" },
        { status: 404 },
      );
    }
    return NextResponse.json({ symbol: sym, price });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch stock price" },
      { status: 502 },
    );
  }
}

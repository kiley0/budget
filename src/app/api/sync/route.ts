import { get, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

const SYNC_PREFIX = "sync/";

function pathnameForBudget(budgetId: string): string {
  if (!budgetId || !/^[0-9a-f-]{36}$/i.test(budgetId)) {
    throw new Error("Invalid budgetId");
  }
  return `${SYNC_PREFIX}${budgetId}`;
}

/** GET ?budgetId= — retrieve encrypted blob for this budget. Returns 404 if not found. */
export async function GET(request: NextRequest) {
  const budgetId = request.nextUrl.searchParams.get("budgetId");
  if (!budgetId) {
    return NextResponse.json({ error: "Missing budgetId" }, { status: 400 });
  }
  try {
    const pathname = pathnameForBudget(budgetId);
    const result = await get(pathname, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return new NextResponse(null, { status: 404 });
    }
    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    if (name === "BlobNotFoundError") {
      return new NextResponse(null, { status: 404 });
    }
    return NextResponse.json({ error: "Sync error" }, { status: 500 });
  }
}

/** POST body: { budgetId: string, data: string } — store encrypted blob for this budget. */
export async function POST(request: NextRequest) {
  let body: { budgetId?: string; data?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { budgetId, data } = body;
  if (typeof budgetId !== "string" || typeof data !== "string") {
    return NextResponse.json(
      { error: "Missing budgetId or data" },
      { status: 400 },
    );
  }
  try {
    const pathname = pathnameForBudget(budgetId);
    await put(pathname, data, {
      access: "private",
      contentType: "text/plain; charset=utf-8",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Sync error" }, { status: 500 });
  }
}

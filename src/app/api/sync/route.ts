import { get, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

const SYNC_PREFIX = "sync/";

function pathnameForBudget(budgetId: string): string {
  if (!budgetId || !/^[0-9a-f-]{36}$/i.test(budgetId)) {
    throw new Error("Invalid budgetId");
  }
  return `${SYNC_PREFIX}${budgetId}`;
}

function pathnameForMeta(budgetId: string): string {
  return `${SYNC_PREFIX}${budgetId}.meta`;
}

/** GET ?budgetId= — retrieve encrypted blob. ?meta=1 — retrieve metadata (updatedAt) only. */
export async function GET(request: NextRequest) {
  const budgetId = request.nextUrl.searchParams.get("budgetId");
  const metaOnly = request.nextUrl.searchParams.get("meta") === "1";
  if (!budgetId) {
    return NextResponse.json({ error: "Missing budgetId" }, { status: 400 });
  }
  try {
    const pathname = metaOnly
      ? pathnameForMeta(budgetId)
      : pathnameForBudget(budgetId);
    const result = await get(pathname, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return new NextResponse(null, { status: 404 });
    }
    if (metaOnly) {
      const text = await new Response(result.stream).text();
      try {
        const parsed = JSON.parse(text || "{}");
        return NextResponse.json(
          parsed && typeof parsed === "object" ? parsed : {},
        );
      } catch {
        return NextResponse.json(
          { error: "Invalid metadata" },
          { status: 500 },
        );
      }
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

/** POST body: { budgetId: string, data: string, updatedAt?: string } — store encrypted blob and metadata. */
export async function POST(request: NextRequest) {
  let body: { budgetId?: string; data?: string; updatedAt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { budgetId, data, updatedAt } = body;
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
    if (typeof updatedAt === "string" && updatedAt) {
      try {
        const metaPathname = pathnameForMeta(budgetId);
        await put(metaPathname, JSON.stringify({ updatedAt }), {
          access: "private",
          contentType: "application/json",
          addRandomSuffix: false,
          allowOverwrite: true,
        });
      } catch {
        // Main blob succeeded; metadata is best-effort for version comparison
      }
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Sync error" }, { status: 500 });
  }
}

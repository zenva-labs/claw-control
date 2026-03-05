import { NextResponse } from "next/server";
import { getSession } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ agentId: string; sessionId: string }> },
) {
  const { agentId, sessionId } = await params;
  const session = getSession(agentId, sessionId);
  if (!session) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(session);
}

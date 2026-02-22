import { NextResponse } from "next/server";
import { getGatewayInfo } from "@/lib/openclaw";

export const dynamic = "force-dynamic";

export async function GET() {
  const info = getGatewayInfo();
  const url = `http://localhost:${info.port}/`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    return NextResponse.json({
      status: "online",
      port: info.port,
      httpStatus: res.status,
    });
  } catch {
    return NextResponse.json({ status: "offline", port: info.port });
  }
}

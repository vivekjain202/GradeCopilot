import { NextResponse } from "next/server";

import { env } from "@/env";
import { processQueuedJobs } from "@/lib/submissions/processor";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!env.CRON_SECRET || authorization !== `Bearer ${env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const outcomes = await processQueuedJobs(2);
  return NextResponse.json({ outcomes });
}

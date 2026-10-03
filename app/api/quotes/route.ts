import { getSnapshot } from "@/lib/quotes";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// 最新の株価を返す。CDNで短時間共有して、Yahooへのアクセスを抑える。
export async function GET() {
  const snapshot = await getSnapshot(true);
  return Response.json(snapshot, {
    headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=40" },
  });
}

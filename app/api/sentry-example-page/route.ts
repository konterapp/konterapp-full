export const dynamic = "force-dynamic";

export async function GET() {
  throw new Error("Test error dari API route (Sentry server-side)");
}

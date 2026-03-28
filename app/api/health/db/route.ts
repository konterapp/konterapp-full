import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const expectedKey = process.env.KEEPALIVE_CRON_KEY?.trim();
  if (expectedKey) {
    const keyFromQuery = req.nextUrl.searchParams.get('key')?.trim();
    const keyFromHeader = req.headers.get('x-keepalive-key')?.trim();
    const providedKey = keyFromQuery || keyFromHeader;

    if (!providedKey || providedKey !== expectedKey) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Unauthorized',
        },
        { status: 401 },
      );
    }
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Database reachable',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Database unreachable',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

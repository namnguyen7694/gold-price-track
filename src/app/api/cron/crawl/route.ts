import { NextResponse } from 'next/server';
import { performGoldCrawl } from '@/lib/services/gold-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Check for authorization (e.g. Vercel Cron Secret)
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('Unauthorized cron attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await performGoldCrawl();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Cron job error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

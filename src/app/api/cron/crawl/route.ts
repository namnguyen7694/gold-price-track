import { NextResponse } from 'next/server';
import { performGoldCrawl } from '@/lib/services/gold-service';

export async function GET(request: Request) {
  // Check for authorization (e.g. Vercel Cron Secret or custom API key)
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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

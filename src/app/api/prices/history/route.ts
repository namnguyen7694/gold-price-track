import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const snapshot = await adminDb.collection('gold_prices')
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(history);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('History API error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

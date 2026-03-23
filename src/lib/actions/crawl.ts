'use server';

import { performGoldCrawl } from '@/lib/services/gold-service';
import { revalidatePath } from 'next/cache';

export async function manualCrawlAction() {
  try {
    const data = await performGoldCrawl();
    
    // Trigger revalidation
    revalidatePath('/');
    
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Manual crawl error:', error);
    return { success: false, error: message };
  }
}

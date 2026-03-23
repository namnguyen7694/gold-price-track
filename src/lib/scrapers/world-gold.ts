import axios from 'axios';

export interface WorldGoldData {
  usdPerOz: number;
}

export async function scrapeWorldGoldPrice(): Promise<number | null> {
  try {
    const { data } = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1m&range=1d', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });

    const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
    return price || null;
  } catch (error) {
    console.error('Error fetching World Gold Price from Yahoo:', error);
    return null;
  }
}

export async function getExchangeRate(): Promise<number | null> {
  try {
    const { data } = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/USDVND=X?interval=1m&range=1d', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });

    const rate = data.chart?.result?.[0]?.meta?.regularMarketPrice;
    return rate || null;
  } catch (error) {
    console.error('Error fetching exchange rate from Yahoo:', error);
    // Fallback to the other API if Yahoo fails
    try {
        const { data: fallbackData } = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
        return fallbackData.rates.VND || null;
    } catch {
        return null;
    }
  }
}

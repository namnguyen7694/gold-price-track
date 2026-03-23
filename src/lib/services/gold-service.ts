import { adminDb } from "@/lib/firebase/admin";
import { scrapeLocalGoldPrice } from "@/lib/scrapers/ngoctham";
import { scrapeWorldGoldPrice, getExchangeRate } from "@/lib/scrapers/world-gold";
import { convertUsdOzToVndChi } from "@/lib/utils/convert";

export async function performGoldCrawl() {
  const [localGoldData, worldPriceUsd, exchangeRate] = await Promise.all([
    scrapeLocalGoldPrice(),
    scrapeWorldGoldPrice(),
    getExchangeRate(),
  ]);

  if (!localGoldData || !worldPriceUsd || !exchangeRate) {
    throw new Error("Failed to scrape one or more sources");
  }

  const { items: localGoldList, date: lastUpdate } = localGoldData;

  // Find "Nhẫn 999.9" as the primary local price
  const primaryLocal =
    localGoldList.find((item: { name: string }) => item.name.includes("Nhẫn 999.9")) || localGoldList[0];

  const worldPriceConverted = convertUsdOzToVndChi(worldPriceUsd, exchangeRate);

  const timestamp = new Date().toISOString();
  const data = {
    timestamp,
    local: {
      name: primaryLocal.name,
      buy: primaryLocal.buy,
      sell: primaryLocal.sell,
      unit: "VND/chỉ",
    },
    localLastUpdate: lastUpdate,
    local_all: localGoldList,
    world: {
      usd_per_oz: worldPriceUsd,
      vnd_per_chi: worldPriceConverted,
      exchange_rate: exchangeRate,
      unit: "VND/chỉ",
    },
    diff: primaryLocal.sell - worldPriceConverted,
  };

  // Save to Firestore
  await adminDb.collection("gold_prices").add(data);
  return data;
}

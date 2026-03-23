import { scrapeLocalGoldPrice } from "./src/lib/scrapers/ngoctham";
import { scrapeWorldGoldPrice, getExchangeRate } from "./src/lib/scrapers/world-gold";
import { convertUsdOzToVndChi } from "./src/lib/utils/convert";

async function test() {
  console.log("--- Testing Gold Scrapers (Final Fix) ---");

  console.log("Scraping Local Gold (AJAX API)...");
  const localData = await scrapeLocalGoldPrice();
  console.log("Local Results (All Classes):", JSON.stringify(localData, null, 2));
  const { items: localList } = localData || { items: [], date: "" };

  const localPrimary = localList?.[0]; // just for testing conversion

  console.log("Scraping World Price...");
  const worldPrice = await scrapeWorldGoldPrice();
  console.log("World USD/oz:", worldPrice);

  console.log("Fetching Exchange Rate...");
  const rate = await getExchangeRate();
  console.log("USD/VND:", rate);

  if (typeof worldPrice === "number" && typeof rate === "number") {
    const converted = convertUsdOzToVndChi(worldPrice, rate);
    console.log("Converted World Price (VND/chỉ):", converted);

    if (localPrimary) {
      console.log("Local vs World Diff (VND/chỉ):", localPrimary.sell - converted);
    }
  } else {
    console.log("Skipping conversion due to missing data");
  }
}

test();

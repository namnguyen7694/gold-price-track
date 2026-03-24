import { adminDb } from "@/lib/firebase/admin";
import { GoldPriceItem, scrapeLocalGoldPrice } from "@/lib/scrapers/ngoctham";
import { scrapeWorldGoldPrice, getExchangeRate } from "@/lib/scrapers/world-gold";
import { convertUsdOzToVndChi } from "@/lib/utils/convert";
import { broadcastTelegramNotification } from "@/lib/utils/telegram";

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

  const now = new Date();
  const timestamp = now.toISOString();
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

  // Check for fluctuations and notify
  try {
    const prevSnapshot = await adminDb.collection("gold_prices").orderBy("timestamp", "desc").limit(1).get();

    if (!prevSnapshot.empty) {
      const prevData = prevSnapshot.docs[0].data();
      const thresholdVnd = Number(process.env.ALERT_THRESHOLD) || 20000;
      const thresholdUsd = 20;

      const notifications: string[] = [];

      // 1. Check Primary Local (Nhẫn 999.9)
      const diffPrimary = data.local.sell - prevData.local.sell;
      if (Math.abs(diffPrimary) >= thresholdVnd) {
        notifications.push(
          `🔸 <b>${data.local.name}</b>: ${diffPrimary > 0 ? "🚀 +" : "📉 -"}${Math.abs(diffPrimary).toLocaleString()} VND\n   <i>(${prevData.local.sell.toLocaleString()} ➔ ${data.local.sell.toLocaleString()} VND/chỉ)</i>`,
        );
      }

      // 2. Check 990 Gold
      const current990 = localGoldList.find((item) => item.name.includes("Vàng Ta 990"));
      const prev990 = prevData.local_all?.find((item: GoldPriceItem) => item.name.includes("Vàng Ta 990"));
      if (current990 && prev990) {
        const diff990 = current990.sell - prev990.sell;
        if (Math.abs(diff990) >= thresholdVnd) {
          notifications.push(
            `🔸 <b>Vàng Ta 990</b>: ${diff990 > 0 ? "🚀 +" : "📉 -"}${Math.abs(diff990).toLocaleString()} VND\n   <i>(${prev990.sell.toLocaleString()} ➔ ${current990.sell.toLocaleString()} VND/chỉ)</i>`,
          );
        }
      }

      // 3. Check World Price (USD)
      const diffWorld = data.world.usd_per_oz - prevData.world.usd_per_oz;
      if (Math.abs(diffWorld) >= thresholdUsd) {
        notifications.push(
          `🔸 <b>Giá Thế Giới</b>: ${diffWorld > 0 ? "🚀 +" : "📉 -"}${Math.abs(diffWorld).toFixed(2)} USD\n   <i>($${prevData.world.usd_per_oz.toLocaleString()} ➔ $${data.world.usd_per_oz.toLocaleString()}/oz)</i>`,
        );
      }

      if (notifications.length > 0) {
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.vercel.app`;
        const message = `
          <b>BIẾN ĐỘNG THỊ TRƯỜNG</b>
          ━━━━━━━━━━━━━━━━━━
          ${notifications.join("\n\n")}
          ━━━━━━━━━━━━━━━━━━
          <i>Cập nhật lúc: ${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</i>
          👉 <a href="${appUrl}">Xem thêm</a>
        `.trim();
        await broadcastTelegramNotification(message);
      }
    }
  } catch (error) {
    console.error("Error calculating fluctuations:", error);
  }

  // Save to Firestore
  await adminDb.collection("gold_prices").add(data);

  // Save interval data for optimized charts
  // Use Asia/Ho_Chi_Minh timezone for interval checks (GMT+7)
  const vnTimeParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);

  const vnHour = parseInt(vnTimeParts.find((p) => p.type === "hour")?.value || "0", 10);
  const vnMinute = parseInt(vnTimeParts.find((p) => p.type === "minute")?.value || "0", 10);

  // Save every 6 hours (00, 06, 12, 18) at minute 0 in Vietnam time
  if (vnHour % 6 === 0 && vnMinute === 0) {
    await adminDb.collection("gold_prices_6h").add(data);
  }

  // Save every 24 hours (00:00 Vietnam time)
  if (vnHour === 0 && vnMinute === 0) {
    await adminDb.collection("gold_prices_24h").add(data);
  }

  return data;
}

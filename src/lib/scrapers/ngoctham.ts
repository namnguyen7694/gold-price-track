import axios from "axios";

export interface GoldPriceItem {
  id: string;
  name: string;
  buy: number;
  sell: number;
}

export interface NgocThamResponse {
  date: string;
  chitiet: {
    loaivang: string;
    giaban: string;
    giamua: string;
  }[];
}

export async function scrapeLocalGoldPrice(): Promise<{ items: GoldPriceItem[]; date: string } | null> {
  try {
    const { data } = await axios.get("https://ngoctham.com/ajax/proxy_banggia.php", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Referer: "https://ngoctham.com/bang-gia-vang/",
      },
    });

    if (!data || !data.chitiet) {
      return null;
    }

    return {
      items: data.chitiet.map((item: { loaivang: string; giamua: string; giaban: string }) => ({
        name: item.loaivang,
        buy: parseInt(item.giamua),
        sell: parseInt(item.giaban),
      })),
      date: data.date,
    };
  } catch (error) {
    console.error("Error fetching Ngoc Tham API:", error);
    return null;
  }
}

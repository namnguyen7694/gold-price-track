import axios from "axios";
import { adminDb } from "@/lib/firebase/admin";

/**
 * Sends a notification message to a Telegram chat via Bot API.
 * Requires TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in environment variables.
 */
export async function sendTelegramNotification(message: string, targetChatId?: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = targetChatId || process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("Telegram notification skipped: Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
    });
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      // Bot was blocked by user, should potentially remove from subscribers
      console.warn(`Bot blocked by user: ${chatId}`);
    } else {
      console.error("Error sending Telegram notification:", error);
    }
  }
}

/**
 * Broadcasts a message to all active subscribers in Firestore.
 */
export async function broadcastTelegramNotification(message: string) {
  try {
    const snapshot = await adminDb.collection("subscribers").get();
    if (snapshot.empty) return;

    const sendPromises = snapshot.docs.map((doc) => {
      const { chat_id } = doc.data();
      return sendTelegramNotification(message, chat_id.toString());
    });

    await Promise.allSettled(sendPromises);
  } catch (error) {
    console.error("Error broadcasting Telegram notification:", error);
  }
}

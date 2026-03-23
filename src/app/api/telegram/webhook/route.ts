import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { sendTelegramNotification } from "@/lib/utils/telegram";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const message = payload.message;

    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text.trim().toLowerCase();

    if (text === "/start" || text === "/subscribe") {
      await adminDb.collection("subscribers").doc(chatId.toString()).set({
        chat_id: chatId,
        subscribed_at: new Date().toISOString(),
        username: message.from?.username || "unknown",
        first_name: message.from?.first_name || "",
      });

      await sendTelegramNotification(
        "✅ <b>Đăng ký thành công!</b>\nBạn sẽ nhận được thông báo ngay khi giá vàng có biến động lớn.",
        chatId.toString()
      );
    } else if (text === "/unsubscribe") {
      await adminDb.collection("subscribers").doc(chatId.toString()).delete();
      await sendTelegramNotification(
        "👋 <b>Đã hủy đăng ký.</b>\nHẹn gặp lại bạn lần sau!",
        chatId.toString()
      );
    } else {
      await sendTelegramNotification(
        "Chào mừng bạn đến với <b>Gold Price Tracker</b>!\n\nSử dụng lệnh:\n/subscribe - Đăng ký nhận thông báo\n/unsubscribe - Hủy đăng ký",
        chatId.toString()
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

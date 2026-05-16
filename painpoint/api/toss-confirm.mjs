export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const body = req.body || {};
  const { paymentKey, orderId, amount } = body;

  if (!paymentKey || !orderId || !amount) {
    return res.status(400).json({ error: "paymentKey, orderId, amount 필수" });
  }

  const secretKey = process.env.TOSS_SECRET_KEY || "test_sk_DnyRpQWGrND0DwggYggL3Kwv1M9E";
  const auth = Buffer.from(`${secretKey}:`).toString("base64");

  try {
    const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    });

    const data = await tossRes.json();
    if (!tossRes.ok) {
      console.error("[toss/confirm] 실패:", data);
      return res.status(400).json({ error: data.message || "결제 승인 실패" });
    }

    console.log(`[toss/confirm] 성공: orderId=${orderId} amount=${amount}`);
    return res.status(200).json({ success: true, payment: data });
  } catch (e) {
    console.error("[toss/confirm]", e);
    return res.status(500).json({ error: String(e.message || e) });
  }
}

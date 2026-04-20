export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    // Ask AI
    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vowedbond.vercel.app",
        "X-Title": "Vowed Bond"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are Vowed Bond AI. Be helpful and professional."
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const aiData = await aiRes.json();

    const reply =
      aiData.choices?.[0]?.message?.content ||
      "No response.";

    // Save to Supabase
    await fetch(`${process.env.SUPABASE_URL}/rest/v1/chats`, {
      method: "POST",
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        user_message: message,
        bot_reply: reply
      })
    });

    return res.status(200).json({ reply });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

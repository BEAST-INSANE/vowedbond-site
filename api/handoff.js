export default async function handler(req, res) {
  try {
    const { messages } = req.body;

    await fetch(`${process.env.SUPABASE_URL}/rest/v1/chats`, {
      method: "POST",
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_message: "HUMAN SUPPORT REQUEST",
        bot_reply: JSON.stringify(messages)
      })
    });

    return res.status(200).json({ success: true });
  } catch {
    return res.status(500).json({ success: false });
  }
}

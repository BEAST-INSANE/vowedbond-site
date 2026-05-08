export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const {
      user_name,
      reply
    } = req.body;

    // SAVE ADMIN MESSAGE
    await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/chats`,
      {
        method: "POST",
        headers: {
          apikey:
            process.env.SUPABASE_ANON_KEY,
          Authorization:
            `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          "Content-Type":
            "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          user_name,
          sender: "admin",
          message: reply
        })
      }
    );

    return res.status(200).json({
      success: true
    });

  } catch (error) {

    return res.status(500).json({
      error: error.message
    });

  }
}
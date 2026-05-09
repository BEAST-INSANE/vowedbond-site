export default async function handler(req, res) {

  try {

    const {
      message,
      userName
    } = req.body;

    // SAVE USER MESSAGE
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
        },
        body: JSON.stringify({
          user_name: userName,
          sender: "user",
          message
        })
      }
    );

    // FAKE AI REPLY
    const reply =
      "Test AI reply working.";

    // SAVE AI MESSAGE
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
        },
        body: JSON.stringify({
          user_name: userName,
          sender: "ai",
          message: reply
        })
      }
    );

    return res.status(200).json({
      reply
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      error: error.message
    });

  }
}
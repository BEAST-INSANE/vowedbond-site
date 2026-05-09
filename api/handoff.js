export default async function handler(req, res) {

  try {

    const {
      userName,
      conversationId
    } = req.body;

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
          conversation_id:
            conversationId,
          user_name:
            userName,
          sender: "system",
          message:
            "HUMAN SUPPORT REQUEST"
        }),
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
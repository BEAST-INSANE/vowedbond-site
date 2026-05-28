export default async function handler(req, res) {

  try {

    const {
      conversation_id
    } = req.body;

    if (!conversation_id) {

      return res.status(400).json({
        error:
          "conversation_id required"
      });

    }

    // DELETE ALL CHAT ROWS
    await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/chats?conversation_id=eq.${conversation_id}`,
      {
        method: "DELETE",
        headers: {
          apikey:
            process.env.SUPABASE_ANON_KEY,
          Authorization:
            `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        },
      }
    );

    return res.status(200).json({
      success: true
    });

  } catch (error) {

    return res.status(500).json({
      error:
        error.message
    });

  }

}
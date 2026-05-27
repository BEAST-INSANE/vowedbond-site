export default async function handler(req, res) {

  try {

    const {
      conversationId
    } = req.query;

    if (!conversationId) {

      return res.status(400).json({
        error:
          "conversationId required"
      });

    }

    const response =
      await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/chats?conversation_id=eq.${conversationId}&sender=eq.admin&select=id,message,created_at&order=created_at.desc&limit=1`,
        {
          headers: {
            apikey:
              process.env.SUPABASE_ANON_KEY,
            Authorization:
              `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          },
        }
      );

    const data =
      await response.json();

    return res
      .status(200)
      .json(data[0] || {});

  } catch (error) {

    return res.status(500).json({
      error:
        error.message
    });

  }

}
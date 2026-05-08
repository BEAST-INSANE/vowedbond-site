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

    // get latest message row from this user
    const latestRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/chats?user_name=eq.${user_name}&select=id&order=created_at.desc&limit=1`,
      {
        headers: {
          apikey:
            process.env.SUPABASE_ANON_KEY,
          Authorization:
            `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        },
      }
    );

    const latestData =
      await latestRes.json();

    if (!latestData.length) {
      return res.status(404).json({
        error: "No chat found"
      });
    }

    const latestId =
      latestData[0].id;

    // update latest row
    await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/chats?id=eq.${latestId}`,
      {
        method: "PATCH",
        headers: {
          apikey:
            process.env.SUPABASE_ANON_KEY,
          Authorization:
            `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          admin_reply: reply,
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
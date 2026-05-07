export default async function handler(req, res) {
  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/chats?select=*&order=created_at.desc`,
      {
        headers: {
          apikey: process.env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        },
      }
    );

    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
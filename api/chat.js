export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

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
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          user_name: userName,
          sender: "user",
          message
        })
      }
    );
.then(async (r) => {
  const text = await r.text();
  console.log(text);
});

    // ASK AI
    const aiRes = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type":
            "application/json",
          "HTTP-Referer":
            "https://vowedbond.vercel.app",
          "X-Title":
            "Vowed Bond"
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `
You are Vowed Bond AI, the assistant for our AI chatbot business.

Your job is to help users understand our services, chatbot solutions, support systems, automation tools, and business offerings.

IMPORTANT RULES:

1. Only answer questions related to Vowed Bond, our services, chatbot systems, support, automation, pricing, founders, or business-related topics.

2. Do NOT answer:
- math questions
- homework
- essays
- coding help unrelated to our business
- random trivia
- politics
- celebrities
- general knowledge
- unrelated personal questions

3. The ONLY people you may talk about are:
- Jaipreet Singh Badhan
- Moksh Gagwani

4. Keep replies:
- short
- professional
- informative
- easy to understand

5. Do NOT use emojis.

6. Redirect unrelated questions politely.

7. Our services include:
- AI chatbots
- lead generation bots
- customer support bots
- automation systems
- custom chatbot solutions

8. Encourage human support if users show interest.
`
            },
            {
              role: "user",
              content: message
            }
          ]
        })
      }
    );

    const aiData =
      await aiRes.json();

    const reply =
      aiData.choices?.[0]?.message?.content ||
      "No response.";

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
          Prefer: "return=minimal"
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

    return res.status(500).json({
      error: error.message
    });

  }
}
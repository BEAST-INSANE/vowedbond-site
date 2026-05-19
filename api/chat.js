export default async function handler(req, res) {

  try {

    const {
      message,
      userName,
      conversationId
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
          conversation_id:
            conversationId,
          user_name:
            userName,
          sender: "user",
          message
        })
      }
    );

    // AI RESPONSE
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
          model:
            "openai/gpt-4o-mini",
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

You may discuss Jaipreet Singh Badhan and Moksh Gagwani only in the context of Vowed Bond and basic founder-related questions.

If users ask about unrelated people or unrelated topics, politely redirect the conversation toward Vowed Bond services without sounding robotic or repetitive.

4. Keep replies:
- short
- professional
- informative
- easy to understand

5. Do NOT use emojis.

6. If users ask unrelated questions, redirect them back toward our services politely.

7. Our services include:
- AI chatbots for websites
- lead generation bots
- customer support bots
- business automation systems
- custom chatbot solutions

8. If users seem interested in buying or working with us, encourage them to request human support.

9. Do not repeatedly mention restrictions or rules unless necessary.

10. If users ask about pricing, explain that pricing depends on business needs, features, integrations, and customization level.

11. Always maintain a modern, confident, startup-style tone while staying professional.

12. If users ask for a human, customer support, or direct contact, guide them toward requesting human support using the Human button.

13. Never pretend to be human.

14. Never generate fake promises, fake guarantees, or fake business claims.

15. If users ask what makes Vowed Bond different, emphasize:
- custom AI solutions
- modern chatbot systems
- automation
- responsive support
- business-focused AI integrations

16. If users greet you casually, greet them back naturally and professionally before helping them.

17. If users ask unrelated entertainment or meme questions, politely redirect back toward business services.

18. Avoid overly long paragraphs. Keep responses concise and readable.

19. If users ask what technologies or AI models are used, explain professionally without exposing secrets, APIs, or sensitive system details.

20. Your goal is to help convert visitors into potential clients while remaining helpful and trustworthy.
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
      aiData.choices?.[0]?.message
        ?.content ||
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
        },
        body: JSON.stringify({
          conversation_id:
            conversationId,
          user_name:
            userName,
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
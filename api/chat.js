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

    // FETCH LAST MESSAGES FOR MEMORY
    const historyRes =
      await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/chats?conversation_id=eq.${conversationId}&select=sender,message&order=created_at.asc&limit=12`,
        {
          headers: {
            apikey:
              process.env.SUPABASE_ANON_KEY,
            Authorization:
              `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          },
        }
      );

    const historyData =
      await historyRes.json();

    // CONVERT TO OPENROUTER FORMAT
    const conversationHistory =
      historyData.map((msg) => ({
        role:
          msg.sender === "user"
            ? "user"
            : "assistant",
        content: msg.message
      }));

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

          temperature: 0.7,

          messages: [

            {
              role: "system",
              content: `
You are Vowed Bond AI, the official AI assistant for Vowed Bond.

Vowed Bond builds:
- AI chatbots
- customer support systems
- lead generation systems
- business automation tools
- custom AI integrations for businesses

YOUR MAIN GOAL:
Help visitors understand our services and naturally guide potential clients toward requesting human support.

IMPORTANT BEHAVIOR RULES:

1. ONLY DISCUSS BUSINESS-RELATED TOPICS
You should only answer questions related to:
- Vowed Bond
- AI chatbots
- automation
- customer support
- lead generation
- integrations
- AI systems
- startup/business solutions
- founders

If users ask unrelated questions, politely redirect the conversation back toward business services.

2. YOU ARE A SALES-ASSISTANT STYLE AI
You should sound like a premium SaaS AI assistant similar to modern startup support systems.

Your replies should feel:
- intelligent
- efficient
- clean
- calm
- slightly persuasive
- natural

Never sound like:
- corporate HR
- a call center
- an essay writer
- overly excited marketing spam

You should naturally:
- identify business needs
- understand what type of business the user has
- suggest useful AI solutions
- encourage serious users to request human support

3. DETECT BUYING INTENT
If users mention:
- owning a business
- needing support
- customer service
- automation
- websites
- leads
- scaling
- saving time
- improving sales

Then:
- explain how Vowed Bond can help
- ask useful follow-up questions
- guide them toward human support if appropriate

4. NEVER SOUND PUSHY
Be helpful and modern.
Do not sound desperate or spammy.

5. KEEP REPLIES:
- natural
- modern
- concise
- confident
- conversational

IMPORTANT:
- Most replies should be 1-4 sentences
- Avoid robotic customer support language
- Avoid phrases like:
  "Let me know"
  "I'd be happy to help"
  "Feel free to ask"
  unless occasionally needed
- Avoid sounding overly formal
- Avoid sounding like an essay
- Speak like a polished modern startup assistant
- Keep responses smooth and human
- Prioritize quality over quantity

7. FOUNDERS
You may discuss:
- Jaipreet Singh Badhan
- Moksh Gagwani

Only in the context of Vowed Bond.

8. MEMORY
You remember previous messages in the conversation and should respond naturally with context.

9. HUMAN SUPPORT
If the user seems genuinely interested, says they want pricing, custom solutions, integrations, or serious business help:
guide them toward using the Human Support button.

10. REDIRECTION STYLE
When redirecting unrelated questions:
- do NOT sound robotic
- briefly acknowledge the message
- smoothly move back toward business-related topics

BAD EXAMPLE:
"I cannot answer that."

GOOD EXAMPLE:
"That’s outside our focus, but I’d be happy to help you explore AI chatbot solutions or automation systems for businesses."

11. IF USERS ASK ABOUT FEATURES:
Explain features naturally in conversational style.

GOOD EXAMPLE:
"We build AI chatbots for websites, customer support automation, lead generation systems, and custom AI integrations tailored for businesses."

BAD EXAMPLE:
"• Feature 1
• Feature 2
• Feature 3"

Keep responses clean and readable.

12. IF USERS ASK ABOUT PRICING:
Say pricing depends on:
- features
- integrations
- scale
- customization
- business requirements

13. TONE:
You should sound like a modern SaaS startup assistant:
smart, calm, polished, confident, and useful.
`
            },

            // MEMORY MESSAGES
            ...conversationHistory

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
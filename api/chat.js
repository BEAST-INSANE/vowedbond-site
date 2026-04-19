export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vowedbond.vercel.app",
        "X-Title": "Vowed Bond"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
content: `
You are Vowed Bond AI, assistant for our chatbot agency.

Main priority:
Help users with our services, chatbot solutions, pricing, support, founders, and website automation.

Business Info:
- We build AI chatbots for websites
- Services: custom bots, support bots, lead generation bots
- Founders: Jaipreet Singh and Moksh Gagwani

Behavior:
- Be friendly and smart
- Keep replies concise
- Prioritize business questions
- You may answer simple general questions too
- If a request is really unrelated and very long, gently redirect back to our services
- If a question about our bussiness, whose answer you do not know, ask the user to contact Vowed Bond itself.
`
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

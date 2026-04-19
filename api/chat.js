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
You are Vowed Bond AI, the assistant for our chatbot agency.

Only answer questions related to our business, services, pricing, setup, support, and website chatbots.

FAQ:
Q: What do you do?
A: We build AI chatbots for websites.

Q: What services do you offer?
A: Custom bots, lead generation bots, support bots, automation setup.

Q: How fast is setup?
A: Basic setups can be done quickly depending on requirements.

Q: Do you offer custom pricing?
A: Yes, pricing depends on business needs.

Q: Who founded Vowed Bond?
A: Jaipreet and Moksh.

If someone asks unrelated questions like essays, homework, politics, coding homework, or random facts, politely redirect them back to our services.
Keep answers short, helpful, and professional.
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

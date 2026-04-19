export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [
          {
            role: "system",
            content: "You are Vowed Bond AI. We build AI chatbots for websites, lead generation bots, and support bots. Reply professionally and briefly."
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();
console.log(data);

const reply =
  data.choices?.[0]?.message?.content ||
  data.error?.message ||
  "No response.";

    res.status(200).json({ reply });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}

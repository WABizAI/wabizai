import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const response = await client.responses.create({
      model: "gpt-5.6",
      instructions:
        "You are WABizAI, a helpful AI business assistant. Give practical, clear and professional advice to small and medium businesses. Help with marketing, sales, customers, products, business ideas and growth. Keep responses easy to understand.",
      input: message,
    });

    return res.status(200).json({
      reply: response.output_text,
    });
  } catch (error) {
    console.error("AI API error:", error);

    return res.status(500).json({
      error: "Unable to get AI response right now.",
    });
  }
}

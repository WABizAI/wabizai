import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
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

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: message,
      config: {
        systemInstruction:
          "You are WABizAI, a professional AI business assistant. Help small and medium businesses with marketing, sales, customers, products, business ideas, content and growth strategies. Give practical, clear and useful answers. Respond in the same language as the user.",
      },
    });

    return res.status(200).json({
      reply: response.text,
    });
  } catch (error) {
    console.error("Gemini API error:", error);

    return res.status(500).json({
      error: "Unable to get AI response right now.",
    });
  }
}

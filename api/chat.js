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
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Messages are required",
      });
    }

    const contents = messages
      .filter(
        (message) =>
          message &&
          typeof message.text === "string" &&
          (message.role === "user" ||
            message.role === "assistant")
      )
      .map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [
          {
            text: message.text,
          },
        ],
      }));

    if (contents.length === 0) {
      return res.status(400).json({
        error: "No valid messages found",
      });
    }

    const response = await ai.models.generateContentStream({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction:
          "You are WABizAI, a professional AI business assistant. Help small and medium businesses with marketing, sales, customers, products, business ideas, content and growth strategies. Give practical, clear and useful answers. Respond in the same language as the user. Keep answers useful and reasonably concise.",
      },
    });

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    for await (const chunk of response) {
      const text = chunk.text;

      if (text) {
        res.write(text);
      }
    }

    res.end();
  } catch (error) {
    console.error("Gemini streaming error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        error: "Unable to get AI response right now.",
      });
    }

    res.end();
  }
}

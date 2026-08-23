import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    /*
     * AUTH TOKEN
     */

    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Please login first.",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    /*
     * VERIFY USER
     */

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({
        error: "Invalid or expired session.",
      });
    }

    /*
     * REQUEST DATA
     */

    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Messages are required.",
      });
    }

    /*
     * CHECK + CONSUME AI USAGE
     */

    const { data: usage, error: usageError } =
      await supabaseAdmin.rpc(
        "consume_ai_usage",
        {
          p_user_id: user.id,
        }
      );

    if (usageError) {
      console.error(
        "Usage check error:",
        usageError
      );

      return res.status(500).json({
        error: "Unable to check AI usage.",
      });
    }

    if (!usage?.allowed) {
      return res.status(429).json({
        error:
          usage?.error ||
          "AI usage limit reached.",
        plan: usage?.plan || "free",
        credits: usage?.credits ?? 0,
        daily_messages:
          usage?.daily_messages ?? 0,
        daily_limit:
          usage?.daily_limit ?? 10,
      });
    }

    /*
     * CONVERT MESSAGES FOR GEMINI
     */

    const contents = messages
      .filter(
        (message) =>
          message &&
          typeof message.text === "string" &&
          (message.role === "user" ||
            message.role === "assistant")
      )
      .map((message) => ({
        role:
          message.role === "assistant"
            ? "model"
            : "user",

        parts: [
          {
            text: message.text,
          },
        ],
      }));

    if (contents.length === 0) {
      return res.status(400).json({
        error: "No valid messages found.",
      });
    }

    /*
     * GEMINI
     */

    const response =
      await ai.models.generateContentStream({
        model: "gemini-3.6-flash",

        contents,

        config: {
          systemInstruction:
            "You are WABizAI, a professional AI business assistant. Help small and medium businesses with marketing, sales, customers, products, business ideas, content, customer communication and growth strategies. Give practical, clear and useful answers. Respond in the same language as the user. If the user writes Urdu or Roman Urdu, respond naturally in Urdu/Roman Urdu. Keep answers useful and reasonably concise.",
        },
      });

    /*
     * STREAM RESPONSE
     */

    res.statusCode = 200;

    res.setHeader(
      "Content-Type",
      "text/plain; charset=utf-8"
    );

    res.setHeader(
      "Cache-Control",
      "no-cache"
    );

    res.setHeader(
      "Connection",
      "keep-alive"
    );

    for await (const chunk of response) {
      const text = chunk.text;

      if (text) {
        res.write(text);
      }
    }

    res.end();

  } catch (error) {

    console.error(
      "Gemini streaming error:",
      error
    );

    if (!res.headersSent) {
      return res.status(500).json({
        error:
          "Unable to get AI response right now.",
      });
    }

    res.end();
  }
}

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
    // =============================
    // AUTHENTICATION
    // =============================

    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Please login first.",
      });
    }

    const token = authHeader
      .replace("Bearer ", "")
      .trim();

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error:", userError);

      return res.status(401).json({
        error: "Invalid or expired session.",
      });
    }

    // =============================
    // REQUEST DATA
    // =============================

    const { messages } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Messages are required.",
      });
    }

    // =============================
    // PROFILE
    // =============================
    // Profile is optional for AI.
    // If database permission is not available,
    // AI will continue working.

    let profile = null;

    try {
      const {
        data: profileData,
        error: profileError,
      } = await supabaseAdmin
        .from("profiles")
        .select(
          "id, plan, credits, daily_messages, daily_message_date"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.warn(
          "Profile could not be loaded. Continuing without profile:",
          profileError.message
        );
      } else {
        profile = profileData;
      }
    } catch (profileError) {
      console.warn(
        "Profile check failed. Continuing with AI:",
        profileError?.message
      );
    }

    // =============================
    // CONVERT MESSAGES
    // =============================

    const contents = messages
      .filter(
        (message) =>
          message &&
          typeof message.text === "string" &&
          message.text.trim() &&
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
            text: message.text.trim(),
          },
        ],
      }));

    if (contents.length === 0) {
      return res.status(400).json({
        error: "No valid messages found.",
      });
    }

    // =============================
    // GEMINI AI
    // =============================

    const response =
      await ai.models.generateContentStream({
        model: "gemini-3.6-flash",

        contents,

        config: {
          systemInstruction:
            "You are WABizAI, a professional AI business assistant.

Help small and medium businesses with:
- Marketing
- Sales
- Customers
- Products
- Business ideas
- Social media content
- Customer communication
- Business growth
- Business strategy

Give practical, clear and useful answers.

Respond in the same language as the user.

If the user writes Urdu or Roman Urdu, respond naturally in Urdu or Roman Urdu.

Be friendly, professional and concise.

Do not mention internal systems, APIs, databases, profiles or technical implementation unless the user specifically asks about them.",
        },
      });

    // =============================
    // STREAM RESPONSE
    // =============================

    res.statusCode = 200;

    res.setHeader(
      "Content-Type",
      "text/plain; charset=utf-8"
    );

    res.setHeader(
      "Cache-Control",
      "no-cache, no-transform"
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
          error?.message ||
          "Unable to get AI response right now.",
      });
    }

    res.end();
  }
}

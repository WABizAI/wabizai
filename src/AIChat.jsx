import React, { useEffect, useRef, useState } from "react";

function AIChat({ user, onBack }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      text: `Hi ${user?.user_metadata?.full_name || "there"} 👋\n\nI'm your WABizAI business assistant. I can help you with marketing, customers, products, business ideas and more.\n\nWhat would you like to work on today?`,
    },
  ]);

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, busy]);

  function getReply(text) {
    const lower = text.toLowerCase();

    if (
      lower.includes("marketing") ||
      lower.includes("advert") ||
      lower.includes("promotion")
    ) {
      return "Absolutely! 🚀 I can help you create a marketing strategy. Start by identifying your target customer, your main offer and the platform where you want to reach them. For WhatsApp businesses, we can also create promotional messages and follow-up campaigns.";
    }

    if (
      lower.includes("customer") ||
      lower.includes("client")
    ) {
      return "For customer management, WABizAI can help you organize customer information, create follow-up messages, identify valuable customers and build better customer relationships. 👥";
    }

    if (
      lower.includes("product") ||
      lower.includes("sell") ||
      lower.includes("selling")
    ) {
      return "For your products 📦, I can help with product descriptions, pricing ideas, promotional content and sales strategies. Tell me what product you're selling and I'll help you build an offer.";
    }

    if (
      lower.includes("business idea") ||
      lower.includes("idea")
    ) {
      return "Here are three directions you could explore: 1️⃣ AI-powered services, 2️⃣ WhatsApp-based business services, 3️⃣ Digital products. If you tell me your budget and skills, I can suggest a more specific business idea.";
    }

    if (
      lower.includes("hello") ||
      lower.includes("hi") ||
      lower.includes("salam")
    ) {
      return "Wa Alaikum Assalam! 👋 I'm ready to help with your business. Ask me anything about marketing, customers, products, sales or business growth.";
    }

    return "That's a great question. 🤖 I'm currently running in demo mode, so my AI knowledge is limited right now. In the next step we'll connect WABizAI to a real AI model so I can give you much more powerful answers.";
  }

  function sendMessage(e) {
    e?.preventDefault();

    const text = input.trim();

    if (!text || busy) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setBusy(true);

    setTimeout(() => {
      const reply = getReply(text);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: reply,
        },
      ]);

      setBusy(false);
    }, 900);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  }

  return (
    <div className="ai-chat-page">

      {/* HEADER */}
      <header className="ai-chat-header">

        <div className="ai-header-left">
          <button
            className="ai-back-btn"
            onClick={onBack}
            aria-label="Go back"
          >
            ←
          </button>

          <div className="ai-avatar">
            ✦
          </div>

          <div>
            <strong>WABizAI Assistant</strong>
            <span>
              <i></i>
              AI Business Copilot
            </span>
          </div>
        </div>

        <button
          className="ai-new-chat"
          onClick={() =>
            setMessages([
              {
                id: Date.now(),
                role: "assistant",
                text: "New conversation started. 👋\n\nHow can I help your business today?",
              },
            ])
          }
        >
          + <span>New chat</span>
        </button>

      </header>

      {/* CHAT */}
      <main className="ai-chat-main">

        <div className="ai-chat-container">

          <div className="ai-chat-intro">

            <div className="ai-big-icon">
              ✦
            </div>

            <h1>
              Your business,
              <span> powered by AI.</span>
            </h1>

            <p>
              Ask WABizAI for ideas, strategies, content and
              business advice.
            </p>

            <div className="ai-suggestions">

              <button
                onClick={() =>
                  setInput(
                    "Give me 5 marketing ideas for my business"
                  )
                }
              >
                <span>✦</span>
                Marketing ideas
              </button>

              <button
                onClick={() =>
                  setInput(
                    "How can I get more customers?"
                  )
                }
              >
                <span>♙</span>
                Get more customers
              </button>

              <button
                onClick={() =>
                  setInput(
                    "Give me a business growth strategy"
                  )
                }
              >
                <span>⌁</span>
                Growth strategy
              </button>

            </div>

          </div>

          {/* MESSAGES */}

          <div className="ai-messages">

            {messages.map((message) => (
              <div
                key={message.id}
                className={`ai-message-row ${message.role}`}
              >

                {message.role === "assistant" && (
                  <div className="message-avatar">
                    ✦
                  </div>
                )}

                <div className="ai-message">
                  {message.text.split("\n").map(
                    (line, index) => (
                      <React.Fragment key={index}>
                        {line}

                        {index <
                          message.text.split("\n").length -
                            1 && <br />}
                      </React.Fragment>
                    )
                  )}
                </div>

              </div>
            ))}

            {busy && (
              <div className="ai-message-row assistant">

                <div className="message-avatar">
                  ✦
                </div>

                <div className="typing-message">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

              </div>
            )}

            <div ref={messagesEndRef}></div>

          </div>

        </div>

      </main>

      {/* INPUT */}

      <div className="ai-input-area">

        <form
          className="ai-input-box"
          onSubmit={sendMessage}
        >

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your business..."
            rows="1"
            disabled={busy}
          />

          <button
            type="submit"
            disabled={!input.trim() || busy}
            className="ai-send-btn"
          >
            {busy ? "..." : "↑"}
          </button>

        </form>

        <p className="ai-disclaimer">
          WABizAI can make mistakes. Check important business
          information before making decisions.
        </p>

      </div>

    </div>
  );
}

export default AIChat;

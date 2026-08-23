import React, { useEffect, useRef, useState } from "react";

function AIChat({ user, onBack }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      text: `Hi ${
        user?.user_metadata?.full_name || "there"
      } 👋\n\nI'm your WABizAI business assistant. I can help you with marketing, customers, products, business ideas and more.\n\nWhat would you like to work on today?`,
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

  async function sendMessage(e) {
    e?.preventDefault();

    const text = input.trim();

    if (!text || busy) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      text,
    };

    const conversation = [
      ...messages,
      userMessage,
    ];

    setMessages(conversation);
    setInput("");
    setBusy(true);

    const assistantId = Date.now() + 1;

    // Empty assistant message for streaming
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        text: "",
      },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: conversation,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Unable to get AI response.";

        try {
          const errorData = await response.json();
          errorMessage = errorData?.error || errorMessage;
        } catch {
          // Ignore invalid error response
        }

        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error("Streaming is not supported by this response.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let assistantText = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, {
          stream: true,
        });

        assistantText += chunk;

        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  text: assistantText,
                }
              : message
          )
        );
      }

      // Finish decoding any remaining bytes
      const finalChunk = decoder.decode();

      if (finalChunk) {
        assistantText += finalChunk;

        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  text: assistantText,
                }
              : message
          )
        );
      }

      if (!assistantText.trim()) {
        throw new Error("AI returned an empty response.");
      }
    } catch (error) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                text: `Sorry, I couldn't connect to the AI right now.\n\n${error.message}`,
              }
            : message
        )
      );
    } finally {
      setBusy(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  }

  function startSuggestion(text) {
    setInput(text);
  }

  function newChat() {
    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        text: "New conversation started. 👋\n\nHow can I help your business today?",
      },
    ]);

    setInput("");
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
          onClick={newChat}
        >
          + <span>New chat</span>
        </button>

      </header>

      {/* CHAT */}
      <main className="ai-chat-main">

        <div className="ai-chat-container">

          {/* INTRO */}
          {messages.length === 1 && (
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
                    startSuggestion(
                      "Give me 5 marketing ideas for my business"
                    )
                  }
                >
                  <span>✦</span>
                  Marketing ideas
                </button>

                <button
                  onClick={() =>
                    startSuggestion(
                      "How can I get more customers?"
                    )
                  }
                >
                  <span>♙</span>
                  Get more customers
                </button>

                <button
                  onClick={() =>
                    startSuggestion(
                      "Give me a business growth strategy"
                    )
                  }
                >
                  <span>⌁</span>
                  Growth strategy
                </button>

              </div>

            </div>
          )}

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
                    (line, index, lines) => (
                      <React.Fragment key={index}>

                        {line}

                        {index < lines.length - 1 && (
                          <br />
                        )}

                      </React.Fragment>
                    )
                  )}

                  {/* Streaming cursor */}
                  {busy &&
                    message.role === "assistant" &&
                    message.id ===
                      messages[messages.length - 1]?.id && (
                      <span className="ai-streaming-cursor">
                        ▌
                      </span>
                    )}

                </div>

              </div>

            ))}

            {/* TYPING INDICATOR */}
            {busy &&
              !messages[messages.length - 1]?.text && (
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

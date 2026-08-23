import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

function AIChat({ user, onBack }) {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text: `Hi ${
        user?.user_metadata?.full_name || "there"
      } 👋\n\nI'm your WABizAI business assistant. I can help you with marketing, customers, products, business ideas and more.\n\nWhat would you like to work on today?`,
    },
  ]);

  const [conversationId, setConversationId] = useState(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const messagesEndRef = useRef(null);

  /*
   * Load the user's latest conversation
   */
  useEffect(() => {
    async function loadLatestConversation() {
      if (!user?.id) {
        setLoadingHistory(false);
        return;
      }

      try {
        const { data: conversations, error } = await supabase
          .from("chat_conversations")
          .select("id, title")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1);

        if (error) throw error;

        if (conversations && conversations.length > 0) {
          const latestConversation = conversations[0];

          const { data: savedMessages, error: messageError } =
            await supabase
              .from("chat_messages")
              .select("id, role, content, created_at")
              .eq("conversation_id", latestConversation.id)
              .eq("user_id", user.id)
              .order("created_at", { ascending: true });

          if (messageError) throw messageError;

          setConversationId(latestConversation.id);

          if (savedMessages && savedMessages.length > 0) {
            setMessages(
              savedMessages.map((message) => ({
                id: message.id,
                role: message.role,
                text: message.content,
              }))
            );
          }
        }
      } catch (error) {
        console.error("Chat history loading error:", error);
      } finally {
        setLoadingHistory(false);
      }
    }

    loadLatestConversation();
  }, [user?.id]);

  /*
   * Auto scroll
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, busy]);

  /*
   * Create a new conversation
   */
  async function createConversation(firstMessage) {
    const title =
      firstMessage.length > 45
        ? firstMessage.substring(0, 45) + "..."
        : firstMessage;

    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({
        user_id: user.id,
        title: title || "New conversation",
      })
      .select("id")
      .single();

    if (error) throw error;

    setConversationId(data.id);

    return data.id;
  }

  /*
   * Save a message
   */
  async function saveMessage(
    conversationIdToUse,
    role,
    content
  ) {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: conversationIdToUse,
        user_id: user.id,
        role,
        content,
      })
      .select("id, role, content, created_at")
      .single();

    if (error) throw error;

    return data;
  }

  /*
   * Update conversation time
   */
  async function touchConversation(conversationIdToUse) {
    const { error } = await supabase
      .from("chat_conversations")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationIdToUse)
      .eq("user_id", user.id);

    if (error) {
      console.error(
        "Conversation update error:",
        error
      );
    }
  }

  /*
   * Send message to Gemini
   */
  async function sendMessage(e) {
    e?.preventDefault();

    const text = input.trim();

    if (!text || busy || loadingHistory) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text,
    };

    let activeConversationId = conversationId;

    try {
      setBusy(true);
      setInput("");

      /*
       * Create conversation if this is the first message
       */
      if (!activeConversationId) {
        activeConversationId =
          await createConversation(text);
      }

      /*
       * Save user message
       */
      const savedUserMessage = await saveMessage(
        activeConversationId,
        "user",
        text
      );

      const userMessageForUI = {
        id: savedUserMessage.id,
        role: "user",
        text,
      };

      /*
       * Current conversation for Gemini
       */
      const conversationForAI = [
        ...messages.filter(
          (message) => message.id !== "welcome"
        ),
        userMessageForUI,
      ];

      /*
       * Add user message
       */
      setMessages((prev) => [
        ...prev,
        userMessageForUI,
      ]);

      /*
       * Assistant placeholder
       */
      const assistantId =
        `assistant-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          text: "",
        },
      ]);

      /*
       * Call streaming API
       */
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: conversationForAI,
        }),
      });

      if (!response.ok) {
        let errorMessage =
          "Unable to get AI response.";

        try {
          const errorData =
            await response.json();

          errorMessage =
            errorData?.error ||
            errorMessage;
        } catch {
          // Ignore invalid error response
        }

        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error(
          "Streaming is not supported by this response."
        );
      }

      const reader =
        response.body.getReader();

      const decoder =
        new TextDecoder();

      let assistantText = "";

      /*
       * Read AI stream
       */
      while (true) {
        const { value, done } =
          await reader.read();

        if (done) break;

        const chunk =
          decoder.decode(value, {
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

      /*
       * Decode remaining bytes
       */
      const finalChunk =
        decoder.decode();

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
        throw new Error(
          "AI returned an empty response."
        );
      }

      /*
       * Save AI response
       */
      const savedAssistantMessage =
        await saveMessage(
          activeConversationId,
          "assistant",
          assistantText
        );

      /*
       * Replace temporary assistant ID
       * with real Supabase ID
       */
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? {
                id: savedAssistantMessage.id,
                role: "assistant",
                text: assistantText,
              }
            : message
        )
      );

      /*
       * Update conversation timestamp
       */
      await touchConversation(
        activeConversationId
      );
    } catch (error) {
      console.error(
        "AI chat error:",
        error
      );

      setMessages((prev) => {
        const hasAssistantPlaceholder =
          prev.some(
            (message) =>
              message.role === "assistant" &&
              message.text === ""
          );

        if (hasAssistantPlaceholder) {
          return prev.map((message) =>
            message.role === "assistant" &&
            message.text === ""
              ? {
                  ...message,
                  text: `Sorry, I couldn't connect to the AI right now.\n\n${error.message}`,
                }
              : message
          );
        }

        return [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            text: `Sorry, I couldn't connect to the AI right now.\n\n${error.message}`,
          },
        ];
      });
    } finally {
      setBusy(false);
    }
  }

  /*
   * Enter = send
   * Shift + Enter = new line
   */
  function handleKeyDown(e) {
    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
      e.preventDefault();
      sendMessage(e);
    }
  }

  /*
   * Suggestion buttons
   */
  function startSuggestion(text) {
    setInput(text);
  }

  /*
   * New chat
   */
  function newChat() {
    setConversationId(null);

    setMessages([
      {
        id: `welcome-${Date.now()}`,
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
            <strong>
              WABizAI Assistant
            </strong>

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
          {messages.length === 1 &&
            messages[0].role ===
              "assistant" && (
              <div className="ai-chat-intro">

                <div className="ai-big-icon">
                  ✦
                </div>

                <h1>
                  Your business,
                  <span>
                    {" "}
                    powered by AI.
                  </span>
                </h1>

                <p>
                  Ask WABizAI for ideas,
                  strategies, content and
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

            {messages.map(
              (message) => (

                <div
                  key={message.id}
                  className={`ai-message-row ${message.role}`}
                >

                  {message.role ===
                    "assistant" && (
                    <div className="message-avatar">
                      ✦
                    </div>
                  )}

                  <div className="ai-message">

                    {message.text
                      .split("\n")
                      .map(
                        (
                          line,
                          index,
                          lines
                        ) => (
                          <React.Fragment
                            key={index}
                          >
                            {line}

                            {index <
                              lines.length -
                                1 && (
                              <br />
                            )}
                          </React.Fragment>
                        )
                      )}

                    {/* Streaming cursor */}
                    {busy &&
                      message.role ===
                        "assistant" &&
                      message.id ===
                        messages[
                          messages.length -
                            1
                        ]?.id && (
                        <span className="ai-streaming-cursor">
                          ▌
                        </span>
                      )}

                  </div>

                </div>
              )
            )}

            {/* TYPING INDICATOR */}
            {busy &&
              !messages[
                messages.length - 1
              ]?.text && (
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
            onChange={(e) =>
              setInput(e.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your business..."
            rows="1"
            disabled={
              busy ||
              loadingHistory
            }
          />

          <button
            type="submit"
            disabled={
              !input.trim() ||
              busy ||
              loadingHistory
            }
            className="ai-send-btn"
          >
            {busy ? "..." : "↑"}
          </button>

        </form>

        <p className="ai-disclaimer">
          WABizAI can make mistakes.
          Check important business
          information before making
          decisions.
        </p>

      </div>

    </div>
  );
}

export default AIChat;

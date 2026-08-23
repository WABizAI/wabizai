import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

function AIChat({ user, onBack }) {
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);

  const messagesEndRef = useRef(null);

  const welcomeMessage = {
    id: "welcome",
    role: "assistant",
    text: `Hi ${
      user?.user_metadata?.full_name || "there"
    } 👋\n\nI'm your WABizAI business assistant. I can help you with marketing, customers, products, business ideas and more.\n\nWhat would you like to work on today?`,
  };

  /*
   * Load all conversations
   */
  async function loadConversations() {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("chat_conversations")
      .select("id, title, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Conversation loading error:",
        error
      );
      return;
    }

    setConversations(data || []);
  }

  /*
   * Load messages for a conversation
   */
  async function loadConversation(id) {
    if (!user?.id || !id) return;

    setLoadingHistory(true);

    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select(
          "id, role, content, created_at"
        )
        .eq("conversation_id", id)
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: true,
        });

      if (error) throw error;

      setConversationId(id);

      if (data && data.length > 0) {
        setMessages(
          data.map((message) => ({
            id: message.id,
            role: message.role,
            text: message.content,
          }))
        );
      } else {
        setMessages([welcomeMessage]);
      }

      setHistoryOpen(false);
    } catch (error) {
      console.error(
        "Message loading error:",
        error
      );
    } finally {
      setLoadingHistory(false);
    }
  }

  /*
   * Initial history
   */
  useEffect(() => {
    async function initializeChat() {
      if (!user?.id) return;

      setLoadingHistory(true);

      await loadConversations();

      const { data, error } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("user_id", user.id)
        .order("updated_at", {
          ascending: false,
        })
        .limit(1);

      if (!error && data?.length > 0) {
        await loadConversation(data[0].id);
      } else {
        setMessages([welcomeMessage]);
        setLoadingHistory(false);
      }
    }

    initializeChat();
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
   * Create conversation
   */
  async function createConversation(
    firstMessage
  ) {
    const title =
      firstMessage.length > 45
        ? firstMessage.substring(0, 45) +
          "..."
        : firstMessage;

    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({
        user_id: user.id,
        title:
          title || "New conversation",
      })
      .select(
        "id, title, created_at, updated_at"
      )
      .single();

    if (error) throw error;

    setConversationId(data.id);

    setConversations((prev) => [
      data,
      ...prev,
    ]);

    return data.id;
  }

  /*
   * Save message
   */
  async function saveMessage(
    activeId,
    role,
    content
  ) {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: activeId,
        user_id: user.id,
        role,
        content,
      })
      .select(
        "id, role, content, created_at"
      )
      .single();

    if (error) throw error;

    return data;
  }

  /*
   * Update conversation
   */
  async function touchConversation(
    activeId
  ) {
    const now =
      new Date().toISOString();

    const { error } = await supabase
      .from("chat_conversations")
      .update({
        updated_at: now,
      })
      .eq("id", activeId)
      .eq("user_id", user.id);

    if (error) {
      console.error(
        "Conversation update error:",
        error
      );
    }

    setConversations((prev) =>
      prev
        .map((conversation) =>
          conversation.id === activeId
            ? {
                ...conversation,
                updated_at: now,
              }
            : conversation
        )
        .sort(
          (a, b) =>
            new Date(b.updated_at) -
            new Date(a.updated_at)
        )
    );
  }

  /*
   * Send message
   */
  async function sendMessage(e) {
    e?.preventDefault();

    const text = input.trim();

    if (
      !text ||
      busy ||
      loadingHistory
    ) {
      return;
    }

    try {
      setBusy(true);
      setInput("");

      let activeId =
        conversationId;

      /*
       * Create conversation
       */
      if (!activeId) {
        activeId =
          await createConversation(
            text
          );
      }

      /*
       * Save user message
       */
      const savedUser =
        await saveMessage(
          activeId,
          "user",
          text
        );

      const userMessage = {
        id: savedUser.id,
        role: "user",
        text,
      };

      const conversationForAI = [
        ...messages.filter(
          (message) =>
            message.id !==
            "welcome"
        ),
        userMessage,
      ];

      setMessages((prev) => [
        ...prev,
        userMessage,
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
       * Gemini API
       */
      const response =
        await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            messages:
              conversationForAI,
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
        } catch {}

        throw new Error(
          errorMessage
        );
      }

      if (!response.body) {
        throw new Error(
          "Streaming is not supported."
        );
      }

      const reader =
        response.body.getReader();

      const decoder =
        new TextDecoder();

      let assistantText = "";

      /*
       * Streaming
       */
      while (true) {
        const {
          value,
          done,
        } = await reader.read();

        if (done) break;

        const chunk =
          decoder.decode(value, {
            stream: true,
          });

        assistantText += chunk;

        setMessages((prev) =>
          prev.map((message) =>
            message.id ===
            assistantId
              ? {
                  ...message,
                  text:
                    assistantText,
                }
              : message
          )
        );
      }

      const finalChunk =
        decoder.decode();

      if (finalChunk) {
        assistantText +=
          finalChunk;

        setMessages((prev) =>
          prev.map((message) =>
            message.id ===
            assistantId
              ? {
                  ...message,
                  text:
                    assistantText,
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
      const savedAssistant =
        await saveMessage(
          activeId,
          "assistant",
          assistantText
        );

      setMessages((prev) =>
        prev.map((message) =>
          message.id ===
          assistantId
            ? {
                id:
                  savedAssistant.id,
                role:
                  "assistant",
                text:
                  assistantText,
              }
            : message
        )
      );

      await touchConversation(
        activeId
      );

    } catch (error) {
      console.error(
        "AI chat error:",
        error
      );

      setMessages((prev) =>
        prev.map((message) =>
          message.role ===
            "assistant" &&
          message.text === ""
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

  /*
   * New chat
   */
  function newChat() {
    setConversationId(null);
    setMessages([welcomeMessage]);
    setInput("");
    setHistoryOpen(false);
  }

  /*
   * Delete conversation
   */
  async function deleteConversation(
    id
  ) {
    if (!user?.id) return;

    const confirmed =
      window.confirm(
        "Delete this conversation?"
      );

    if (!confirmed) return;

    const { error } =
      await supabase
        .from(
          "chat_conversations"
        )
        .delete()
        .eq("id", id)
        .eq(
          "user_id",
          user.id
        );

    if (error) {
      alert(
        "Unable to delete conversation."
      );
      console.error(error);
      return;
    }

    setConversations((prev) =>
      prev.filter(
        (conversation) =>
          conversation.id !== id
      )
    );

    if (conversationId === id) {
      newChat();
    }
  }

  /*
   * Enter to send
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
   * Suggestions
   */
  function startSuggestion(text) {
    setInput(text);
  }

  return (
    <div className="ai-chat-page">

      {/* MOBILE OVERLAY */}
      {historyOpen && (
        <div
          className="ai-history-overlay"
          onClick={() =>
            setHistoryOpen(false)
          }
        />
      )}

      {/* HISTORY SIDEBAR */}
      <aside
        className={`ai-history-sidebar ${
          historyOpen
            ? "open"
            : ""
        }`}
      >

        <div className="history-header">

          <div>
            <strong>
              WABizAI
            </strong>
            <span>
              Chat History
            </span>
          </div>

          <button
            className="history-close"
            onClick={() =>
              setHistoryOpen(false)
            }
          >
            ×
          </button>

        </div>

        <button
          className="history-new-chat"
          onClick={newChat}
        >
          <span>＋</span>
          New conversation
        </button>

        <div className="history-list">

          {conversations.length ===
          0 ? (
            <div className="history-empty">
              <div>✦</div>
              <p>
                No conversations yet
              </p>
              <small>
                Your chats will appear
                here.
              </small>
            </div>
          ) : (
            conversations.map(
              (conversation) => (
                <div
                  key={
                    conversation.id
                  }
                  className={`history-item ${
                    conversationId ===
                    conversation.id
                      ? "active"
                      : ""
                  }`}
                >

                  <button
                    className="history-chat-button"
                    onClick={() =>
                      loadConversation(
                        conversation.id
                      )
                    }
                  >
                    <span className="history-chat-icon">
                      ✦
                    </span>

                    <span className="history-chat-info">
                      <strong>
                        {
                          conversation.title
                        }
                      </strong>

                      <small>
                        {new Date(
                          conversation.updated_at
                        ).toLocaleDateString()}
                      </small>
                    </span>
                  </button>

                  <button
                    className="history-delete"
                    onClick={() =>
                      deleteConversation(
                        conversation.id
                      )
                    }
                    aria-label="Delete conversation"
                  >
                    🗑
                  </button>

                </div>
              )
            )
          )}

        </div>

        <div className="history-footer">
          <span>🔒</span>
          Your conversations are private.
        </div>

      </aside>

      {/* MAIN */}
      <div className="ai-chat-content">

        {/* HEADER */}
        <header className="ai-chat-header">

          <div className="ai-header-left">

            <button
              className="ai-history-menu"
              onClick={() =>
                setHistoryOpen(true)
              }
              aria-label="Open chat history"
            >
              ☰
            </button>

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

            {messages.length ===
              1 &&
              messages[0]?.role ===
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
                    Ask WABizAI for
                    ideas, strategies,
                    content and
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
                    key={
                      message.id
                    }
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
                              key={
                                index
                              }
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

              {busy &&
                !messages[
                  messages.length -
                    1
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

              <div
                ref={
                  messagesEndRef
                }
              />

            </div>

          </div>

        </main>

        {/* INPUT */}
        <div className="ai-input-area">

          <form
            className="ai-input-box"
            onSubmit={
              sendMessage
            }
          >

            <textarea
              value={input}
              onChange={(e) =>
                setInput(
                  e.target.value
                )
              }
              onKeyDown={
                handleKeyDown
              }
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
            WABizAI can make
            mistakes. Check
            important business
            information before
            making decisions.
          </p>

        </div>

      </div>

    </div>
  );
}

export default AIChat;

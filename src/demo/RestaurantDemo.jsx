import React, { useEffect, useRef, useState } from "react";

export default function RestaurantDemo() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);

  const [showGreeting, setShowGreeting] = useState(false);
  const [showQuestion, setShowQuestion] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const timersRef = useRef([]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  const openChat = () => {
    clearTimers();
    setIsChatOpen(true);
  };

  const closeChat = () => {
    clearTimers();
    setIsChatVisible(false);

    window.setTimeout(() => {
      setIsChatOpen(false);
      setShowGreeting(false);
      setShowQuestion(false);
      setShowTyping(false);
      setShowAnswer(false);
    }, 260);
  };

  useEffect(() => {
    const startTimer = window.setTimeout(() => {
      openChat();
    }, 2000);

    return () => clearTimeout(startTimer);
  }, []);

  useEffect(() => {
    if (!isChatOpen) return;

    const raf = window.requestAnimationFrame(() => {
      setIsChatVisible(true);
    });

    setShowGreeting(true);
    setShowQuestion(false);
    setShowTyping(false);
    setShowAnswer(false);

    clearTimers();

    timersRef.current.push(
      window.setTimeout(() => {
        setShowQuestion(true);
      }, 2000)
    );

    timersRef.current.push(
      window.setTimeout(() => {
        setShowTyping(true);
      }, 2600)
    );

    timersRef.current.push(
      window.setTimeout(() => {
        setShowTyping(false);
        setShowAnswer(true);
      }, 5600)
    );

    return () => {
      window.cancelAnimationFrame(raf);
      clearTimers();
    };
  }, [isChatOpen]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Website Screenshot */}
      <img
        src="/restaurant-home.png"
        alt="Bella Italia"
        style={{
          width: "100%",
          display: "block",
        }}
      />

      {/* Chat Button */}
      <button
        onClick={() => {
          if (isChatOpen) {
            closeChat();
          } else {
            openChat();
          }
        }}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          background: "#10b981",
          color: "white",
          border: "none",
          borderRadius: "999px",
          padding: "14px 20px",
          fontSize: "16px",
          fontWeight: "bold",
          cursor: "pointer",
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          zIndex: 9999,
          animation: "pulseGlow 2s infinite",
        }}
      >
        💬 Ask Bella Italia
      </button>

      {/* Chat Window */}
      {isChatOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "90px",
            right: "20px",
            width: "340px",
            maxWidth: "calc(100vw - 40px)",
            background: "white",
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
            zIndex: 9999,
            opacity: isChatVisible ? 1 : 0,
            transform: isChatVisible
              ? "translateY(0) scale(1)"
              : "translateY(18px) scale(0.92)",
            transition:
              "opacity 280ms cubic-bezier(0.2,0.8,0.2,1), transform 280ms cubic-bezier(0.2,0.8,0.2,1)",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "#10b981",
              color: "white",
              padding: "16px",
              fontWeight: "bold",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Bella Italia AI</span>

            <button
              onClick={closeChat}
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: "22px",
                lineHeight: 1,
                cursor: "pointer",
                padding: 0,
              }}
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              padding: "16px",
              background: "#f8fafc",
              minHeight: "240px",
            }}
          >
            {showGreeting && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  marginBottom: "12px",
                  animation: "bubbleIn 240ms ease",
                }}
              >
                <div
                  style={{
                    background: "#dcfce7",
                    padding: "10px 14px",
                    borderRadius: "16px",
                    maxWidth: "250px",
                  }}
                >
                  Hey! 👋 How can I help you today?
                </div>
              </div>
            )}

            {showQuestion && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: "12px",
                  animation: "bubbleIn 240ms ease",
                }}
              >
                <div
                  style={{
                    background: "#e5e7eb",
                    padding: "10px 14px",
                    borderRadius: "16px",
                    maxWidth: "220px",
                  }}
                >
                  Do you have vegetarian pizza?
                </div>
              </div>
            )}

            {showTyping && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  marginBottom: "12px",
                  animation: "bubbleIn 240ms ease",
                }}
              >
                <div
                  style={{
                    background: "#dcfce7",
                    padding: "10px 14px",
                    borderRadius: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    minWidth: "52px",
                  }}
                >
                  <span className="typing-dot" style={{ animationDelay: "0s" }}>
                    ●
                  </span>
                  <span className="typing-dot" style={{ animationDelay: "0.15s" }}>
                    ●
                  </span>
                  <span className="typing-dot" style={{ animationDelay: "0.3s" }}>
                    ●
                  </span>
                </div>
              </div>
            )}

            {showAnswer && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  animation: "bubbleIn 240ms ease",
                }}
              >
                <div
                  style={{
                    background: "#dcfce7",
                    padding: "10px 14px",
                    borderRadius: "16px",
                    maxWidth: "250px",
                  }}
                >
                  Yes! We offer Margherita, Veggie Supreme and several customizable
                  vegetarian options.
                </div>
              </div>
            )}
          </div>

          {/* Input */}
<div
  style={{
    padding: "12px",
    borderTop: "1px solid #e5e7eb",
    background: "white",
    display: "flex",
    gap: "8px",
    alignItems: "center",
  }}
>
  <input
    placeholder="Ask Bella Italia..."
    readOnly
    style={{
      flex: 1,
      padding: "12px",
      borderRadius: "12px",
      border: "1px solid #d1d5db",
      outline: "none",
      boxSizing: "border-box",
      background: "#fff",
    }}
  />

  <button
    style={{
      background: "#10b981",
      color: "white",
      border: "none",
      borderRadius: "12px",
      padding: "12px 16px",
      fontWeight: "bold",
      cursor: "pointer",
      opacity: 0.9,
    }}
  >
    ➤
  </button>
</div>
      )}

      <style>{`
        @keyframes bubbleIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulseGlow {
          0%, 100% {
            transform: translateY(0);
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          }
          50% {
            transform: translateY(-1px);
            box-shadow: 0 12px 28px rgba(16,185,129,0.28);
          }
        }

        @keyframes typingBounce {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 0.45;
          }
          40% {
            transform: translateY(-5px);
            opacity: 1;
          }
        }

        .typing-dot {
          display: inline-block;
          font-size: 12px;
          color: #10b981;
          animation: typingBounce 1s infinite;
        }
      `}</style>
    </div>
  )}
}


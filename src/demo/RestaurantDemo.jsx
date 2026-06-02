import React, { useState, useEffect } from "react";
const [showQuestion, setShowQuestion] = useState(false);
const [showTyping, setShowTyping] = useState(false);
const [showAnswer, setShowAnswer] = useState(false);
export default function RestaurantDemo() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff",
        position: "relative",
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
        onClick={() => setChatOpen(!chatOpen)}
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
        }}
      >
        💬 Ask Bella Italia
      </button>

      {/* Chat Window */}
      {chatOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "90px",
            right: "20px",
            width: "340px",
            background: "white",
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
            zIndex: 9999,
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "#10b981",
              color: "white",
              padding: "16px",
              fontWeight: "bold",
            }}
          >
            Bella Italia AI
          </div>

          {/* Messages */}
          <div
  style={{
    padding: "16px",
    background: "#f8fafc",
    minHeight: "220px",
  }}
>
  {showQuestion && (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        marginBottom: "12px",
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
      }}
    >
      <div
        style={{
          background: "#dcfce7",
          padding: "10px 14px",
          borderRadius: "16px",
        }}
      >
        Typing...
      </div>
    </div>
  )}

  {showAnswer && (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-start",
      }}
    >
      <div
        style={{
          background: "#dcfce7",
          padding: "10px 14px",
          borderRadius: "16px",
          maxWidth: "240px",
        }}
      >
        Yes! We offer Margherita, Veggie Supreme and several customizable vegetarian options.
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
            }}
          >
            <input
              placeholder="Ask Bella Italia..."
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid #d1d5db",
                outline: "none",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
  useEffect(() => {
  setTimeout(() => {
    setChatOpen(true);

    setTimeout(() => {
      setShowQuestion(true);

      setTimeout(() => {
        setShowTyping(true);

        setTimeout(() => {
          setShowTyping(false);
          setShowAnswer(true);
        }, 3000);

      }, 800);

    }, 800);

  }, 1000);
}, []);
}

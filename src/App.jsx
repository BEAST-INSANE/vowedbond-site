import React, { useState, useRef, useEffect } from "react";

export default function App() {
  const [chatOpen, setChatOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [showNamePopup, setShowNamePopup] = useState(true);
  const [tempName, setTempName] = useState("");
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! I'm Vowed Bond AI. How can I help?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);
const [humanRequested, setHumanRequested] = useState(false);
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);

    const current = input;
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: current })
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text:
            data.reply ||
            data.choices?.[0]?.message?.content ||
            data.error?.message ||
            "No response."
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Error contacting AI." }
      ]);
    }

    setLoading(false);
  };

  const GlowCard = ({
    title,
    text,
    color = "34,211,238",
    titleClass = "",
    textClass = ""
  }) => {
    const [pos, setPos] = useState({ x: 50, y: 50 });

    return (
      <div
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
        }}
        className="relative overflow-hidden min-h-[140px] p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 shadow-2xl hover:scale-105 transition duration-300"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(220px circle at ${pos.x}px ${pos.y}px, rgba(${color},0.75), rgba(${color},0.25) 35%, transparent 70%)`
          }}
        />
        <div className="relative z-10">
          <h2 className={`font-semibold ${titleClass}`}>{title}</h2>
          <p className={textClass}>{text}</p>
        </div>
      </div>
    );
  };

  const TraceCard = (props) => (
    <div className="group rounded-3xl overflow-hidden relative">
      <div className="absolute inset-0 rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition duration-300">
        <div className="absolute inset-0 rounded-3xl border-[4px] border-transparent group-hover:border-orange-200 shadow-[0_0_42px_rgba(251,146,60,1),0_0_70px_rgba(251,146,60,0.95)] animate-[trace_1.8s_linear_infinite]"></div>
      </div>
      <GlowCard {...props} />
    </div>
  );

  return (
    <div className="min-h-screen px-8 pt-0 pb-8 font-sans bg-gradient-to-br from-black via-slate-900 to-blue-950 text-white">

      {/* Logo */}
      <div className="h-24 md:h-28 overflow-hidden -mt-12 mb-2 flex items-center">
        <img
          src="/logo.png"
          alt="Vowed Bond Logo"
          className="w-48 md:w-64 object-contain translate-y-14"
        />
      </div>

      <p className="text-slate-300 text-lg max-w-2xl mb-4">
        Professional AI chatbots for business websites.
      </p>

      {/* Cards */}
      <section className="grid gap-4 md:grid-cols-3">
        <TraceCard title="Custom Bots" text="Trained on your business data." />
        <TraceCard title="24/7 Support" text="Instant replies for customers." />
        <TraceCard title="Lead Generation" text="Capture and qualify leads automatically." />
      </section>

      {/* Founders */}
      <div className="mt-8 rounded-3xl border border-yellow-300 shadow-[0_0_10px_rgba(253,224,71,0.8)]">
        <GlowCard
          title="Founders"
          text="Built by Jaipreet & Moksh — helping businesses grow with smart AI chatbots."
          color="192,132,252"
          titleClass="text-2xl font-bold"
          textClass="text-lg"
        />
      </div>

      {/* Demo */}
      <div className="mt-10">
        <GlowCard
          title="Demo Bot"
          text="Chatbot widget placeholder ready for integration."
          titleClass="text-2xl font-bold"
          textClass="text-lg"
        />
      </div>

      {/* Chat Button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 bg-cyan-400 text-black px-5 py-3 rounded-full font-bold shadow-lg z-50"
      >
        Chat
      </button>

      {/* Chat Popup */}
{chatOpen && (
  <div className="fixed bottom-4 right-2 left-2 sm:bottom-24 sm:right-6 sm:left-auto w-auto sm:w-[420px] max-w-[95vw] bg-slate-900 border border-cyan-400 rounded-2xl shadow-2xl z-50 overflow-hidden">

    {showNamePopup ? (

      <div className="p-6 flex flex-col gap-4">

        <div>
          <h2 className="text-xl font-bold">
            Before we begin
          </h2>

          <p className="text-sm text-slate-300 mt-1">
            Please enter your name to continue.
          </p>
        </div>

        <input
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          placeholder="Your name"
          className="px-4 py-3 rounded-xl bg-white/10 text-white outline-none"
        />

        <button
          onClick={() => {

  const cleaned = tempName.trim();

  if (cleaned.length < 2) return;

  if (cleaned.length > 20) {
    alert("Name is too long.");
    return;
  }

  setUserName(cleaned);
  setShowNamePopup(false);

  setMessages([
    {
      role: "bot",
      text: `Nice to meet you, ${cleaned}. How can I help you today?`
    }
  ]);
}}
          className="bg-cyan-400 text-black py-3 rounded-xl font-bold"
        >
          Continue
        </button>

      </div>

    ) : (

      <>
        <div className="p-3 font-bold border-b border-white/10 flex justify-between items-center">

  <span>Vowed Bond AI</span>

  <button
    onClick={() => setChatOpen(false)}
    className="text-white text-xl"
  >
    ×
  </button>

</div>

        <div
          ref={chatRef}
          className="h-[55vh] sm:h-80 overflow-y-auto p-3 space-y-2"
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-2 rounded-xl max-w-[85%] ${
                msg.role === "user"
                  ? "ml-auto bg-cyan-400 text-black"
                  : "bg-white/10 text-white"
              }`}
            >
              {msg.text}
            </div>
          ))}

          {loading && (
            <div className="bg-white/10 text-white p-2 rounded-xl w-fit">
              Typing...
            </div>
          )}
        </div>

        {/* Input Row */}
        <div className="p-3 border-t border-white/10 flex gap-2 items-center">

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="w-full sm:flex-1 px-4 py-2 rounded-xl bg-white/10 text-white outline-none"
          />

          <button
            onClick={sendMessage}
            className="bg-cyan-400 text-black px-4 py-2 rounded-xl font-bold"
          >
            Send
          </button>

          <button
            onClick={async () => {
              if (humanRequested) return;

              setHumanRequested(true);

              await fetch("/api/handoff", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({ messages })
              });

              setMessages((prev) => [
                ...prev,
                {
                  role: "bot",
                  text: "A human support member has been notified."
                }
              ]);
            }}
            disabled={humanRequested}
            className={`px-4 py-2 rounded-xl font-bold ${
              humanRequested
                ? "bg-gray-400 text-black cursor-not-allowed"
                : "bg-yellow-400 text-black"
            } w-full sm:w-auto`}
          >
            {humanRequested ? "Requested ✔️" : "Human"}
          </button>

        </div>
      </>

    )}

  </div>
)}
      <style>{`
        @keyframes trace {
          0% { clip-path: inset(0 100% 98% 0); }
          25% { clip-path: inset(0 0 98% 0); }
          50% { clip-path: inset(0 0 0 98%); }
          75% { clip-path: inset(98% 0 0 0); }
          100% { clip-path: inset(0 98% 0 0); }
        }
      `}</style>
    </div>
  );
}

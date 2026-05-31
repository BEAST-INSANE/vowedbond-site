import React, { useState, useRef, useEffect } from "react";

const FAQ_ITEMS = [
  {
    question: "What is a dashboard?",
    answer:
      "A dashboard is the control room for your AI assistant. You can view conversations, manage support requests, and keep track of customer activity in one place."
  },
  {
    question: "How does the chatbot learn my business?",
    answer:
      "You give us your business details, website information, and instructions. We use that to shape the assistant's replies and behavior."
  },
  {
    question: "Can I respond to customers myself?",
    answer:
      "Yes. You can take over conversations anytime using human support. The dashboard keeps everything organized."
  },
  {
    question: "Do I need coding knowledge?",
    answer:
      "No. The chatbot is designed to be simple to install and manage, even if you are not technical."
  },
  {
    question: "How long does installation take?",
    answer:
      "That depends on the business and the setup, but the goal is always to keep installation as smooth and quick as possible."
  },
  {
    question: "How much does it cost?",
    answer:
      "Pricing depends on your business needs, features, and customization level. We estimate cost based on what you actually need."
  }
];

export default function App() {
  const [chatOpen, setChatOpen] = useState(false);

  const [userName, setUserName] = useState(
    localStorage.getItem("vb_user_name") || ""
  );

  const [showNamePopup, setShowNamePopup] = useState(() => {
    return localStorage.getItem("vb_popup_completed") !== "true";
  });

  const [tempName, setTempName] = useState("");

  const [messages, setMessages] = useState(() => {
    const savedName = localStorage.getItem("vb_user_name");

    if (!savedName) {
      return [];
    }

    const saved = localStorage.getItem("vb_messages");

    return saved
      ? JSON.parse(saved)
      : [
          {
            role: "bot",
            text: "Hi! I'm Vowed Bond AI. How can I help?",
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            })
          }
        ];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [humanRequested, setHumanRequested] = useState(false);

  const [lastAdminReply, setLastAdminReply] = useState(() => {
    return localStorage.getItem("lastAdminReply") || "";
  });

  const [conversationId, setConversationId] = useState(() => {
    return localStorage.getItem("conversation_id") || "";
  });

  const [buildBusinessName, setBuildBusinessName] = useState("Acme Bakery");
  const [buildBotName, setBuildBotName] = useState("Acme Assistant");
  const [buildPrompt, setBuildPrompt] = useState(
    "Answer customer questions, help with bookings, and guide visitors to the right information."
  );
  const [previewReady, setPreviewReady] = useState(false);
  const [openFaq, setOpenFaq] = useState(-1);

  const chatRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const businessInitials =
    buildBusinessName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("")
      .slice(0, 2) || "VB";

  // SAVE MESSAGES
  useEffect(() => {
    localStorage.setItem("vb_messages", JSON.stringify(messages));
  }, [messages]);

  // AUTO SCROLL
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading, chatOpen]);

  // AUTO FOCUS
  useEffect(() => {
    if (chatOpen && inputRef.current && !showNamePopup && window.innerWidth > 768) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 200);
    }
  }, [chatOpen, showNamePopup]);

  // CHECK IF CHAT EXISTS
  useEffect(() => {
    if (!conversationId) return;

    const checkConversation = async () => {
      try {
        const res = await fetch(`/api/chats?conversationId=${conversationId}`);
        const data = await res.json();

        if (
          Array.isArray(data) &&
          data.length === 0 &&
          messages.length > 1
        ) {
          localStorage.removeItem("conversation_id");
          localStorage.removeItem("vb_messages");
          localStorage.removeItem("vb_user_name");
          localStorage.removeItem("vb_popup_completed");
          localStorage.removeItem("lastAdminReply");

          const newId =
            "vb_" +
            Math.random().toString(36).substring(2, 12);

          localStorage.setItem("conversation_id", newId);
          setConversationId(newId);
          setMessages([]);
          setUserName("");
          setTempName("");
          setHumanRequested(false);
          setShowNamePopup(true);
        }
      } catch (err) {
        console.log(err);
      }
    };

    checkConversation();
  }, [conversationId, messages.length]);

  // CHECK ADMIN REPLIES
  useEffect(() => {
    if (!conversationId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/getReply?conversationId=${conversationId}`
        );
        const data = await res.json();

        if (data.message && data.message !== lastAdminReply) {
          setLastAdminReply(data.message);
          localStorage.setItem("lastAdminReply", data.message);

          setMessages((prev) => [
            ...prev,
            {
              role: "human",
              text: data.message,
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              })
            }
          ]);
        }
      } catch (err) {
        console.log(err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [conversationId, lastAdminReply]);

  // SEND MESSAGE
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = {
      role: "user",
      text: input,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    };

    setMessages((prev) => [...prev, userMsg]);

    const current = input;
    setInput("");

    if (humanRequested) {
      await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: current,
          userName,
          conversationId
        })
      });

      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: current,
          userName,
          conversationId
        })
      });

      const data = await res.json();

      await new Promise((resolve) =>
        setTimeout(resolve, 250)
      );

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: data.reply || "No response.",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Error contacting AI.",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })
        }
      ]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-blue-950 text-white overflow-x-hidden relative"
      style={{ fontFamily: '"Manrope", sans-serif' }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700;800&display=swap');

        .display-font {
          font-family: 'Space Grotesk', sans-serif;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.15);
          border-radius: 999px;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes popup {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-emerald-500/10 blur-[160px]"></div>
        <div className="absolute top-[900px] right-0 w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[180px]"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* NAVBAR */}
      <nav className="flex items-center justify-between py-4">
          <button
            onClick={() => scrollToSection("top")}
            className="flex items-center gap-3 text-left"
          >
            <img
  src="/logo.png"
  alt="Vowed Bond"
  className="h-56 md:h-50 w-auto object-contain"
/>
          </button>

          <button
            onClick={() => scrollToSection("contact")}
            className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition"
          >
            Contact Us
          </button>
        </nav>

        {/* HERO */}
        <section id="top" className="pt-10 md:pt-16 pb-8 md:pb-12 text-center">
          <p className="text-emerald-400/90 uppercase tracking-[0.35em] text-[11px] md:text-xs font-semibold">
            AI Support Automation
          </p>

          <h1 className="display-font mt-6 text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.92] tracking-tight">
            Support <span className="text-emerald-400">Customers</span> 24/7
            <br />
            Without Hiring More Staff
          </h1>

          <p className="mt-8 max-w-4xl mx-auto text-base md:text-2xl text-slate-300 leading-relaxed">
            Custom <span className="text-emerald-400">AI assistants</span> trained on
            your business to answer questions and manage conversations from one simple
            <span className="text-emerald-400"> dashboard</span>.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => scrollToSection("dashboard")}
              className="px-7 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition"
            >
              See Dashboard
            </button>

            <button
              onClick={() => scrollToSection("builder")}
              className="px-7 py-3.5 rounded-full border border-white/15 hover:border-white/35 text-white font-semibold transition bg-white/[0.02]"
            >
              Build Your Own AI Assistant
            </button>
          </div>

          {/* HERO LOOP PREVIEW */}
          <div className="mt-16 mx-auto max-w-6xl rounded-[2rem] border border-white/10 bg-white/[0.03] p-3 md:p-4 shadow-2xl">
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#050816]">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/[0.03]">
                <span className="w-3 h-3 rounded-full bg-red-400/80"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-400/80"></span>
                <span className="w-3 h-3 rounded-full bg-green-400/80"></span>
                <div className="ml-4 h-3 w-40 rounded-full bg-white/10"></div>
              </div>

              <div className="grid gap-4 md:grid-cols-3 p-4 md:p-6">
                {[
                  {
                    title: "Restaurant Website",
                    question: "What are your opening hours?",
                    answer: "We're open Monday to Saturday from 9 AM to 8 PM."
                  },
                  {
                    title: "Clinic Website",
                    question: "Can I book an appointment?",
                    answer: "Absolutely. You can book an appointment online or call us."
                  },
                  {
                    title: "Fitness Website",
                    question: "What are your membership plans?",
                    answer: "We offer monthly, quarterly, and yearly membership options."
                  }
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.3em] text-emerald-400 font-semibold">
                        Demo Site
                      </p>
                      <span className="text-[10px] px-2 py-1 rounded-full bg-white/[0.05] text-slate-400 border border-white/10">
                        Loop
                      </span>
                    </div>

                    <h3 className="mt-4 text-xl font-bold display-font">
                      {item.title}
                    </h3>

                    <div className="mt-5 space-y-3 text-sm">
                      <div className="rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-slate-200">
                        {item.question}
                      </div>
                      <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-emerald-100">
                        {item.answer}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* DASHBOARD PREVIEW */}
        <section id="dashboard" className="py-20 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-emerald-400 uppercase tracking-[0.35em] text-[11px] md:text-xs font-semibold">
              Dashboard Preview
            </p>

            <h2 className="display-font mt-6 text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              Manage Everything From One <span className="text-emerald-400">Dashboard</span>
            </h2>

            <p className="mt-6 text-slate-300 text-base md:text-xl max-w-3xl mx-auto leading-relaxed">
              Monitor conversations, manage support requests, and stay in control of your AI assistant.
            </p>
          </div>

          <div className="mt-14 max-w-6xl mx-auto">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-4 md:p-6 shadow-2xl">
              <div className="rounded-[1.5rem] border border-white/10 bg-[#060816] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/[0.03]">
                  <span className="w-3 h-3 rounded-full bg-red-400/80"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-400/80"></span>
                  <span className="w-3 h-3 rounded-full bg-green-400/80"></span>
                  <div className="ml-4 h-3 w-40 rounded-full bg-white/10"></div>
                </div>

                <div className="grid lg:grid-cols-[260px_1fr] min-h-[460px]">
                  <aside className="border-b lg:border-b-0 lg:border-r border-white/10 p-4 md:p-5 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-300 font-bold">
                        VB
                      </div>
                      <div>
                        <div className="font-semibold">Dashboard</div>
                        <div className="text-xs text-slate-500">Live support control</div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-2 text-sm">
                      {["Chats", "Leads", "Support", "Settings"].map((item, index) => (
                        <div
                          key={item}
                          className={`flex items-center justify-between rounded-2xl px-4 py-3 border ${
                            index === 0
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
                              : "bg-white/[0.02] border-white/10 text-slate-300"
                          }`}
                        >
                          <span>{item}</span>
                          <span className="text-xs text-slate-500">
                            {index === 0 ? "12" : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </aside>

                  <main className="p-4 md:p-6 space-y-4">
                    <div className="grid sm:grid-cols-3 gap-4">
                      {[
                        ["Conversations", "124"],
                        ["Active Leads", "17"],
                        ["Support Requests", "3"]
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                        >
                          <div className="text-sm text-slate-400">{label}</div>
                          <div className="mt-2 text-3xl font-bold display-font text-white">
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 md:p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-semibold">Recent Chats</div>
                          <div className="text-sm text-slate-500">
                            Manage everything from one place
                          </div>
                        </div>
                        <div className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          Live
                        </div>
                      </div>

                      <div className="mt-5 space-y-3">
                        {[
                          {
                            name: "Maya",
                            msg: "Can I book an appointment?"
                          },
                          {
                            name: "Arjun",
                            msg: "What are your prices?"
                          },
                          {
                            name: "Sara",
                            msg: "Need help with support."
                          }
                        ].map((chat) => (
                          <div
                            key={chat.name}
                            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3"
                          >
                            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center font-semibold">
                              {chat.name[0]}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{chat.name}</div>
                              <div className="text-sm text-slate-400">
                                {chat.msg}
                              </div>
                            </div>
                            <div className="text-xs text-emerald-300">
                              New
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </main>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BUILD YOUR OWN AI ASSISTANT */}
        <section id="builder" className="py-20 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-emerald-400 uppercase tracking-[0.35em] text-[11px] md:text-xs font-semibold">
              Build Your Own AI Assistant
            </p>

            <h2 className="display-font mt-6 text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              See How A Custom <span className="text-emerald-400">Assistant</span> Could Look
            </h2>

            <p className="mt-6 text-slate-300 text-base md:text-xl max-w-3xl mx-auto leading-relaxed">
              Enter a business name, bot name, and prompt to preview a custom AI assistant. The full customization system can be expanded later.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-2 items-start">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 md:p-8 shadow-2xl">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm md:text-base font-medium text-slate-300 mb-2">
                    Business Name
                  </label>
                  <input
                    value={buildBusinessName}
                    onChange={(e) => setBuildBusinessName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-black/20 border border-white/10 outline-none text-white placeholder:text-slate-500 focus:border-emerald-400/60 transition"
                    placeholder="Your business name"
                  />
                </div>

                <div>
                  <label className="block text-sm md:text-base font-medium text-slate-300 mb-2">
                    Bot Name
                  </label>
                  <input
                    value={buildBotName}
                    onChange={(e) => setBuildBotName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-black/20 border border-white/10 outline-none text-white placeholder:text-slate-500 focus:border-emerald-400/60 transition"
                    placeholder="Your bot name"
                  />
                </div>

                <div>
                  <label className="block text-sm md:text-base font-medium text-slate-300 mb-2">
                    Prompt
                  </label>
                  <textarea
                    value={buildPrompt}
                    onChange={(e) => setBuildPrompt(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 rounded-2xl bg-black/20 border border-white/10 outline-none text-white placeholder:text-slate-500 resize-none focus:border-emerald-400/60 transition"
                    placeholder="Tell the assistant what it should do"
                  />
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-black/10 px-5 py-5 text-center text-sm md:text-base text-slate-400">
                Logo upload placeholder
              </div>

              <button
                onClick={() => setPreviewReady(true)}
                className="mt-6 w-full px-6 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition"
              >
                Generate Preview
              </button>

              <p className="mt-3 text-xs md:text-sm text-slate-500">
                This section can become fully interactive later. For now, it shows the concept clearly.
              </p>
            </div>

            <div className="rounded-[2rem] border border-emerald-500/20 bg-[#06110b] p-6 md:p-8 shadow-2xl">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.35em] text-emerald-400 font-semibold">
                  Live Preview
                </p>

                <span
                  className={`text-xs px-3 py-1 rounded-full border ${
                    previewReady
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-white/10 bg-white/[0.04] text-slate-400"
                  }`}
                >
                  {previewReady ? "Ready" : "Placeholder"}
                </span>
              </div>

              <div className="mt-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-300 font-bold">
                  {businessInitials}
                </div>

                <div>
                  <h3 className="text-2xl md:text-3xl font-bold display-font">
                    {buildBotName}
                  </h3>
                  <p className="text-slate-400 text-sm md:text-base mt-1">
                    For {buildBusinessName}
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <div className="rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-4 text-sm md:text-base leading-relaxed text-slate-200">
                  Hello! 👋 I&apos;m {buildBotName}. How can I help {buildBusinessName} customers today?
                </div>

                <div className="rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-4 text-sm md:text-base leading-relaxed text-slate-300">
                  Prompt: {buildPrompt}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {["Book Appointment", "Pricing", "Opening Hours", "Talk to Human"].map((item) => (
                  <span
                    key={item}
                    className="px-3 py-2 rounded-full border border-white/10 bg-white/[0.03] text-xs md:text-sm text-slate-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-20 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-emerald-400 uppercase tracking-[0.35em] text-[11px] md:text-xs font-semibold">
              FAQ
            </p>

            <h2 className="display-font mt-6 text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              Questions People <span className="text-emerald-400">Actually Ask</span>
            </h2>

            <p className="mt-6 text-slate-300 text-base md:text-xl max-w-3xl mx-auto leading-relaxed">
              Keep the answers short and clear so visitors understand the product fast.
            </p>
          </div>

          <div className="mt-12 max-w-4xl mx-auto space-y-3">
            {FAQ_ITEMS.map((item, index) => {
              const open = openFaq === index;

              return (
                <div
                  key={item.question}
                  className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(open ? -1 : index)}
                    className="w-full flex items-center justify-between gap-4 px-5 md:px-6 py-5 text-left"
                  >
                    <span className="font-semibold text-white text-sm md:text-base">
                      <span className="text-emerald-400 mr-3">
                        {open ? "▼" : "▶"}
                      </span>
                      {item.question}
                    </span>
                  </button>

                  {open && (
                    <div className="px-5 md:px-6 pb-5 text-slate-400 text-sm md:text-base leading-relaxed">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="py-20 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-emerald-400 uppercase tracking-[0.35em] text-[11px] md:text-xs font-semibold">
              Contact
            </p>

            <h2 className="display-font mt-6 text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              Ready To <span className="text-emerald-400">Automate</span> Your Support?
            </h2>

            <p className="mt-6 text-slate-300 text-base md:text-xl max-w-3xl mx-auto leading-relaxed">
              Choose the way you want to reach us. You can add your real links later.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3 max-w-5xl mx-auto">
            {[
              {
                title: "WhatsApp",
                desc: "Fastest way to reach us.",
                icon: "💬"
              },
              {
                title: "Instagram",
                desc: "See updates and contact us.",
                icon: "📸"
              },
              {
                title: "Email",
                desc: "For detailed inquiries.",
                icon: "✉️"
              }
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6"
              >
                <div className="text-3xl">{item.icon}</div>
                <h3 className="mt-4 text-xl md:text-2xl font-bold">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm md:text-base text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <footer className="py-10 border-t border-white/10 text-center text-sm text-slate-500">
          <div className="display-font text-white font-bold text-lg md:text-xl">
            Vowed Bond
          </div>
          <div className="mt-2 text-sm md:text-base">
            AI Customer Support For Modern Businesses
          </div>
          <div className="mt-2 text-sm md:text-base">
            © 2026 Vowed Bond
          </div>
        </footer>
      </div>

      {/* CHAT BUTTON */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-24 right-4 z-50 w-16 h-16 rounded-full bg-slate-900 border border-emerald-400/60 shadow-[0_0_25px_rgba(16,185,129,0.35)] flex items-center justify-center hover:scale-110 transition duration-300 overflow-hidden"
      >
        <img
          src="/chatbot-logo.png"
          alt="Chat"
          className="w-14 h-14 object-contain"
        />
      </button>

      {/* CHAT POPUP */}
      {chatOpen && (
        <div className="fixed bottom-12 right-2 left-2 sm:bottom-24 sm:right-6 sm:left-auto w-auto sm:w-[430px] max-w-[95vw] h-[620px] sm:h-[700px] bg-[#060816]/95 backdrop-blur-xl border border-white/10 rounded-[32px] shadow-[0_0_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden flex flex-col animate-[popup_0.25s_ease]">
          {showNamePopup ? (
            <div className="flex-1 flex flex-col justify-center p-6 pt-2 gap-4 relative">
              <button
                onClick={() => setChatOpen(false)}
                className="absolute top-4 right-4 text-2xl text-slate-400 hover:text-white transition"
              >
                ×
              </button>

              <div className="flex flex-col items-center text-center">
                <img
                  src="/chatbot-logo.png"
                  alt="Bot"
                  className="w-20 h-20 object-contain mb-4"
                />

                <h2 className="text-2xl font-bold">
                  Welcome
                </h2>

                <p className="text-slate-300 mt-2 text-base">
                  Enter your name to start chatting.
                </p>
              </div>

              <input
                maxLength={20}
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    document.getElementById("continueBtn")?.click();
                  }
                }}
                placeholder="Your name"
                className="px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none"
              />

              <button
                id="continueBtn"
                onClick={() => {
                  const cleaned = tempName.trim();

                  if (!/^[A-Za-z\s]+$/.test(cleaned)) {
                    alert("Name should contain only alphabets.");
                    return;
                  }

                  if (cleaned.length < 2) {
                    alert("Name is too short.");
                    return;
                  }

                  localStorage.setItem("vb_user_name", cleaned);

                  const newId =
                    "vb_" +
                    Math.random().toString(36).substring(2, 12);

                  localStorage.setItem("conversation_id", newId);
                  setConversationId(newId);

                  setUserName(cleaned);
                  setShowNamePopup(false);

                  localStorage.setItem("vb_popup_completed", "true");

                  setMessages([
                    {
                      role: "bot",
                      text: `Hello ${cleaned}! 👋 How can I assist you today?`,
                      time: new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })
                    }
                  ]);
                }}
                className="bg-emerald-500 hover:bg-emerald-400 transition text-black py-4 rounded-2xl font-bold"
              >
                Continue
              </button>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <img
                    src="/chatbot-logo.png"
                    alt="Bot"
                    className="w-12 h-12 object-contain"
                  />

                  <div>
                    <h2 className="font-bold text-xl">
                      Vowed Bond AI
                    </h2>

                    <p className="text-sm text-slate-400">
                      We reply instantly
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setChatOpen(false)}
                  className="text-2xl text-slate-400 hover:text-white transition"
                >
                  ×
                </button>
              </div>

              <div
                ref={chatRef}
                className="flex-1 overflow-y-auto px-4 py-5 space-y-6 custom-scrollbar"
              >
                <div className="flex items-center gap-3 text-slate-500 text-sm">
                  <div className="flex-1 h-[1px] bg-white/10"></div>
                  Today
                  <div className="flex-1 h-[1px] bg-white/10"></div>
                </div>

                {messages.map((msg, i) => (
                  <React.Fragment key={i}>
                    {msg.role === "human" &&
                      i > 0 &&
                      messages[i - 1].role !== "human" && (
                        <div className="flex items-center gap-3 my-4">
                          <div className="flex-1 h-[1px] bg-yellow-400/30"></div>

                          <p className="text-xs text-yellow-300 uppercase tracking-[3px]">
                            Human Support Joined
                          </p>

                          <div className="flex-1 h-[1px] bg-yellow-400/30"></div>
                        </div>
                      )}

                    <div
                      className={`flex animate-[fadeIn_0.25s_ease] ${
                        msg.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex gap-3 max-w-[90%] ${
                          msg.role === "user"
                            ? "flex-row-reverse"
                            : ""
                        }`}
                      >
                        {(msg.role === "bot" || msg.role === "human") && (
                          <img
                            src={
                              msg.role === "human"
                                ? "/human-logo.png"
                                : "/chatbot-logo.png"
                            }
                            alt="Avatar"
                            className="w-10 h-10 object-contain mt-1"
                          />
                        )}

                        <div>
                          <div
                            className={`px-5 py-4 rounded-[26px] text-[15px] leading-relaxed ${
                              msg.role === "user"
                                ? "bg-emerald-500 text-black rounded-br-md"
                                : msg.role === "human"
                                ? "bg-yellow-400 text-black rounded-bl-md"
                                : "bg-white/10 text-white rounded-bl-md"
                            }`}
                          >
                            {msg.text}
                          </div>

                          <p
                            className={`text-xs text-slate-500 mt-2 ${
                              msg.role === "user"
                                ? "text-right"
                                : "text-left"
                            }`}
                          >
                            {msg.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                ))}

                {loading && (
                  <div className="flex justify-start animate-[fadeIn_0.25s_ease]">
                    <div className="flex gap-3 max-w-[90%]">
                      <img
                        src="/chatbot-logo.png"
                        alt="Bot"
                        className="w-10 h-10 object-contain mt-1"
                      />

                      <div className="bg-white/10 text-white rounded-[26px] rounded-bl-md px-5 py-4 flex items-center gap-1">
                        <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>

                        <span
                          className="w-2 h-2 bg-white rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></span>

                        <span
                          className="w-2 h-2 bg-white rounded-full animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        ></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <input
                    ref={inputRef}
                    value={input}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-5 py-4 rounded-full bg-white/5 border border-white/10 text-white outline-none"
                  />

                  <button
                    disabled={loading}
                    onClick={sendMessage}
                    className={`w-14 h-14 rounded-full text-black font-bold text-xl flex items-center justify-center transition ${
                      loading
                        ? "bg-emerald-700 cursor-not-allowed"
                        : "bg-emerald-500 hover:scale-105"
                    }`}
                  >
                    ➤
                  </button>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <button
                    onClick={async () => {
                      if (humanRequested) return;

                      setHumanRequested(true);

                      await fetch("/api/handoff", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                          messages,
                          userName,
                          conversationId
                        })
                      });

                      setMessages((prev) => [
                        ...prev,
                        {
                          role: "bot",
                          text:
                            "A human support member has been notified.",
                          time: new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })
                        }
                      ]);
                    }}
                    disabled={humanRequested}
                    className={`text-sm transition ${
                      humanRequested
                        ? "text-gray-500"
                        : "text-emerald-400 hover:text-emerald-300"
                    }`}
                  >
                    {humanRequested
                      ? "Human support requested"
                      : "Talk to a human"}
                  </button>

                  <p className="text-xs text-slate-500">
                    Powered by Vowed Bond AI
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

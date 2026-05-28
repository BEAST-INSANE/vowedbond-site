import React, {
  useState,
  useRef,
  useEffect
} from "react";

export default function App() {

  const [chatOpen, setChatOpen] =
    useState(false);

  const [userName, setUserName] =
    useState(
      localStorage.getItem(
        "vb_user_name"
      ) || ""
    );

  const [showNamePopup, setShowNamePopup] =
    useState(
      !localStorage.getItem(
        "vb_user_name"
      )
    );

  const [tempName, setTempName] =
    useState("");

  const [messages, setMessages] =
    useState(() => {

      const saved =
        localStorage.getItem(
          "vb_messages"
        );

      return saved
        ? JSON.parse(saved)
        : [
            {
              role: "bot",
              text:
                "Hi! I'm Vowed Bond AI. How can I help?",
              time:
                new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit"
                })
            }
          ];

    });

  const [input, setInput] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [humanRequested, setHumanRequested] =
  useState(false);

  const [lastAdminReply, setLastAdminReply] =
  useState(() => {

    return localStorage.getItem(
      "lastAdminReply"
    ) || "";

  });

  const chatRef = useRef(null);

  const inputRef = useRef(null);

  // UNIQUE CONVERSATION ID
const [conversationId, setConversationId] = useState(() => {

  return (
    localStorage.getItem(
      "conversation_id"
    ) || ""
  );

});

  // SAVE MESSAGES
  useEffect(() => {

    localStorage.setItem(
      "vb_messages",
      JSON.stringify(messages)
    );

  }, [messages]);

  // AUTO SCROLL
  useEffect(() => {

    if (chatRef.current) {

      chatRef.current.scrollTop =
        chatRef.current.scrollHeight;

    }

  }, [messages, loading]);

  // AUTO FOCUS
  useEffect(() => {

    if (
  chatOpen &&
  inputRef.current &&
  !showNamePopup &&
  window.innerWidth > 768
) {

      setTimeout(() => {

        inputRef.current.focus();

      }, 200);

    }

  }, [
    chatOpen,
    showNamePopup
  ]);

// CHECK IF CHAT EXISTS
useEffect(() => {

  if (!conversationId)
    return;

  const checkConversation =
    async () => {

      try {

        const res =
          await fetch(
            `/api/chats?conversationId=${conversationId}`
          );

        const data =
          await res.json();

        // CHAT DELETED
        if (
  Array.isArray(data) &&
  data.length === 0 &&
  messages.length > 1
) {

          localStorage.removeItem(
            "conversation_id"
          );

          const newId =
            "vb_" +
            Math.random()
              .toString(36)
              .substring(2, 12);

          localStorage.setItem(
            "conversation_id",
            newId
          );

          setConversationId(
            newId
          );

          setMessages([
            {
              role: "bot",
              text:
                "Hi! I'm Vowed Bond AI. How can I help?"
            }
          ]);

          setShowNamePopup(
            true
          );

          setUserName("");

        }

      } catch (err) {

        console.log(err);

      }

    };

  checkConversation();

}, [conversationId]);

  // CHECK ADMIN REPLIES
  useEffect(() => {

    if (!conversationId)
      return;

    const interval =
      setInterval(async () => {

        try {

          const res =
            await fetch(
              `/api/getReply?conversationId=${conversationId}`
            );

          const data =
            await res.json();

          if (
            data.message &&
            data.message !==
              lastAdminReply
          ) {

            setLastAdminReply(
  data.message
);

localStorage.setItem(
  "lastAdminReply",
  data.message
);

            setMessages((prev) => [

              ...prev,

              {
                role: "human",
                text: data.message,
                time:
                  new Date().toLocaleTimeString([], {
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

    return () =>
      clearInterval(interval);

  }, [
    conversationId,
    lastAdminReply
  ]);

  // SEND MESSAGE
  const sendMessage =
    async () => {

      if (
        !input.trim() ||
        loading
      )
        return;

      const userMsg = {
        role: "user",
        text: input,
        time:
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })
      };

      setMessages((prev) => [
        ...prev,
        userMsg
      ]);

      const current = input;

      setInput("");

      // HUMAN SUPPORT MODE
      if (humanRequested) {

        await fetch(
          "/api/chat",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              message: current,
              userName,
              conversationId
            })
          }
        );

        return;

      }

      setLoading(true);

      try {

        const res =
          await fetch(
            "/api/chat",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json"
              },
              body: JSON.stringify({
                message: current,
                userName,
                conversationId
              })
            }
          );

        const data =
          await res.json();
   await new Promise(
    (resolve) =>
    setTimeout(resolve, 0)
   );
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text:
              data.reply ||
              "No response.",
            time:
              new Date().toLocaleTimeString([], {
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
            text:
              "Error contacting AI.",
            time:
              new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              })
          }
        ]);

      }

      setLoading(false);

    };

  // ENTER KEY SEND
  const handleKeyDown =
    (e) => {

      if (
        e.key === "Enter"
      ) {

        sendMessage();

      }

    };

  // GLOW CARD
  const GlowCard = ({
    title,
    text,
    color =
      "34,211,238",
    titleClass = "",
    textClass = ""
  }) => {

    const [pos, setPos] =
      useState({
        x: 50,
        y: 50
      });

    return (

      <div
        onMouseMove={(e) => {

          const r =
            e.currentTarget.getBoundingClientRect();

          setPos({
            x:
              e.clientX -
              r.left,
            y:
              e.clientY -
              r.top
          });

        }}
        className="relative overflow-hidden min-h-[140px] p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 shadow-2xl hover:scale-105 transition duration-300"
      >

      <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              `radial-gradient(220px circle at ${pos.x}px ${pos.y}px, rgba(${color},0.75), rgba(${color},0.25) 35%, transparent 70%)`
          }}
        />

        <div className="relative z-10">

          <h2
            className={`font-semibold ${titleClass}`}
          >

            {title}

          </h2>

          <p className={textClass}>

            {text}

          </p>

        </div>

      </div>

    );

  };

  const TraceCard = (
    props
  ) => (

    <div className="group rounded-3xl overflow-hidden relative">

      <div className="absolute inset-0 rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition duration-300">

        <div className="absolute inset-0 rounded-3xl border-[4px] border-transparent group-hover:border-orange-200 shadow-[0_0_42px_rgba(251,146,60,1),0_0_70px_rgba(251,146,60,0.95)] animate-[trace_1.8s_linear_infinite]"></div>

      </div>

      <GlowCard {...props} />

    </div>

  );

  return (

    <div className="min-h-screen px-8 pt-0 pb-8 font-sans bg-gradient-to-br from-black via-slate-900 to-blue-950 text-white">

      {/* LOGO */}
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

      {/* CARDS */}
      <section className="grid gap-4 md:grid-cols-3">

        <TraceCard
          title="Custom Bots"
          text="Trained on your business data."
        />

        <TraceCard
          title="24/7 Support"
          text="Instant replies for customers."
        />

        <TraceCard
          title="Lead Generation"
          text="Capture and qualify leads automatically."
        />

      </section>

      {/* FOUNDERS */}
      <div className="mt-8 rounded-3xl border border-yellow-300 shadow-[0_0_10px_rgba(253,224,71,0.8)]">

        <GlowCard
          title="Founders"
          text="Built by Jaipreet & Moksh — helping businesses grow with smart AI chatbots."
          color="192,132,252"
          titleClass="text-2xl font-bold"
          textClass="text-lg"
        />

      </div>

      {/* DEMO */}
      <div className="mt-10">

        <GlowCard
          title="Demo Bot"
          text="Chatbot widget placeholder ready for integration."
          titleClass="text-2xl font-bold"
          textClass="text-lg"
        />

      </div>

      {/* CHAT BUTTON */}
      <button
        onClick={() =>
          setChatOpen(
            !chatOpen
          )
        }
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-slate-900 border border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.5)] flex items-center justify-center hover:scale-110 transition duration-300 overflow-hidden"
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

              {/* CLOSE BUTTON */}
              <button
                onClick={() =>
                  setChatOpen(false)
                }
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

                <p className="text-slate-400 mt-2">
                  Enter your name to start chatting.
                </p>

              </div>

              <input
                maxLength={20}
                value={tempName}
                onChange={(e) =>
                  setTempName(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {

                  if (
                    e.key ===
                    "Enter"
                  ) {

                    document
                      .getElementById(
                        "continueBtn"
                      )
                      ?.click();

                  }

                }}
                placeholder="Your name"
                className="px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none"
              />

              <button
                id="continueBtn"
                onClick={() => {

                  const cleaned =
                    tempName.trim();

                  if (
                    !/^[A-Za-z\s]+$/.test(
                      cleaned
                    )
                  ) {

                    alert(
                      "Name should contain only alphabets."
                    );

                    return;

                  }

                  if (
                    cleaned.length < 2
                  ) {

                    alert(
                      "Name is too short."
                    );

                    return;

                  }

                  localStorage.setItem(
                    "vb_user_name",
                    cleaned
                  );

                  const newId =
  "vb_" +
  Math.random()
    .toString(36)
    .substring(2, 12);

localStorage.setItem(
  "conversation_id",
  newId
);

setConversationId(newId);

                  setUserName(
                    cleaned
                  );

                  setShowNamePopup(
                    false
                  );

                  setMessages([
                    {
                      role: "bot",
                      text:
                        `Hello ${cleaned}! 👋 How can I assist you today?`,
                      time:
                        new Date().toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })
                    }
                  ]);

                }}
                className="bg-cyan-400 hover:bg-cyan-300 transition text-black py-4 rounded-2xl font-bold"
              >

                Continue

              </button>

            </div>

          ) : (

            <>

              {/* HEADER */}
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
                  onClick={() =>
                    setChatOpen(false)
                  }
                  className="text-2xl text-slate-400 hover:text-white transition"
                >

                  ×

                </button>

              </div>

              {/* CHAT AREA */}
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

        {(msg.role === "bot" ||
          msg.role === "human") && (

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
                ? "bg-cyan-400 text-black rounded-br-md"
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

              </div>

              {/* INPUT AREA */}
              <div className="p-4 border-t border-white/10 bg-white/[0.02]">

                <div className="flex items-center gap-3">

                  <input
                    ref={inputRef}
                    value={input}
                    onKeyDown={
                      handleKeyDown
                    }
                    onChange={(e) =>
                      setInput(
                        e.target.value
                      )
                    }
                    placeholder="Type your message..."
                    className="flex-1 px-5 py-4 rounded-full bg-white/5 border border-white/10 text-white outline-none"
                  />

                  <button
                    disabled={
                      loading
                    }
                    onClick={
                      sendMessage
                    }
                    className={`w-14 h-14 rounded-full text-black font-bold text-xl flex items-center justify-center transition ${
                      loading
                        ? "bg-cyan-700 cursor-not-allowed"
                        : "bg-cyan-400 hover:scale-105"
                    }`}
                  >

                    ➤

                  </button>

                </div>

                <div className="flex items-center justify-between mt-3">

                  <button
                    onClick={async () => {

                      if (
                        humanRequested
                      )
                        return;

                      setHumanRequested(
                        true
                      );
 
                      await fetch(
                        "/api/handoff",
                        {
                          method:
                            "POST",
                          headers:
                            {
                              "Content-Type":
                                "application/json"
                            },
                          body:
                            JSON.stringify(
                              {
                                messages,
                                userName,
                                conversationId
                              }
                            )
                        }
                      );

                      setMessages(
                        (
                          prev
                        ) => [
                          ...prev,
                          {
                            role:
                              "bot",
                            text:
                              "A human support member has been notified.",
                            time:
                              new Date().toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                              })
                          }
                        ]
                      );

                    }}
                    disabled={
                      humanRequested
                    }
                    className={`text-sm transition ${
                      humanRequested
                        ? "text-gray-500"
                        : "text-cyan-400 hover:text-cyan-300"
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

      <style>{`
        @keyframes trace {
          0% { clip-path: inset(0 100% 98% 0); }
          25% { clip-path: inset(0 0 98% 0); }
          50% { clip-path: inset(0 0 0 98%); }
          75% { clip-path: inset(98% 0 0 0); }
          100% { clip-path: inset(0 98% 0 0); }
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
      `}</style>

    </div>

  );
}

import React, { useEffect, useState } from "react";

export default function Dashboard() {
  const [rows, setRows] = useState([]);
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");

  const login = async () => {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ password })
    });

    const data = await res.json();

    if (data.success) setAuthorized(true);
    else alert("Wrong password");
  };

  useEffect(() => {
    if (!authorized) return;

    const loadChats = () => {
      fetch("/api/chats")
        .then((res) => res.json())
        .then((data) => setRows(data));
    };

    loadChats();

    const interval = setInterval(loadChats, 3000);

    return () => clearInterval(interval);
  }, [authorized]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="bg-white/10 p-6 rounded-2xl w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-4">
            Dashboard Login
          </h1>

          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-xl bg-black/30 mb-3"
          />

          <button
            onClick={login}
            className="w-full bg-cyan-400 text-black font-bold py-3 rounded-xl"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">
        Dashboard
      </h1>

      <div className="space-y-4">

        {rows.map((chat) => {
          const isHuman =
            chat.user_message === "HUMAN SUPPORT REQUEST";

          let preview = chat.bot_reply;

          if (isHuman) {
            try {
              const parsed = JSON.parse(chat.bot_reply);

              preview = parsed
                .map((m) => m.text)
                .join(" | ");
            } catch {}
          }

          return (
            <div
              key={chat.id}
              className={`p-4 rounded-2xl border ${
                isHuman
                  ? "bg-red-500/10 border-red-400"
                  : "bg-white/10 border-white/10"
              }`}
            >
              {isHuman ? (
                <p className="text-red-400 font-bold mb-2">
                  🚨 HUMAN SUPPORT REQUEST
                </p>
              ) : (
                <p>
                  <strong>
                    {chat.user_name || "User"}:
                  </strong>{" "}
                  {chat.user_message}
                </p>
              )}

              <p className="mt-2">
                <strong>
                  {isHuman ? "Conversation:" : "AI:"}
                </strong>{" "}
                {preview}
              </p>

              {/* Reply System */}
              <div className="mt-4 flex flex-col gap-2">

                <textarea
                  placeholder="Reply to customer..."
                  onChange={(e) => {
                    chat.tempReply = e.target.value;
                  }}
                  className="w-full p-3 rounded-xl bg-white/10 text-white outline-none"
                />

                <button
                  onClick={async () => {
                    await fetch("/api/reply", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json"
                      },
                      body: JSON.stringify({
                        id: chat.id,
                        reply: chat.tempReply
                      })
                    });

                    alert("Reply sent successfully.");
                  }}
                  className="bg-cyan-400 text-black px-4 py-2 rounded-xl font-bold"
                >
                  Send Reply
                </button>

                {chat.admin_reply && (
                  <div className="bg-cyan-400/20 border border-cyan-400 p-3 rounded-xl">
                    <strong>Admin Reply:</strong>{" "}
                    {chat.admin_reply}
                  </div>
                )}

              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}
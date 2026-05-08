import React, { useEffect, useState } from "react";

export default function Dashboard() {

  const [rows, setRows] = useState([]);
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [selectedChat, setSelectedChat] =
    useState(null);

  const login = async () => {

    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json"
      },
      body: JSON.stringify({
        password
      })
    });

    const data = await res.json();

    if (data.success) {
      setAuthorized(true);
    } else {
      alert("Wrong password");
    }
  };

  useEffect(() => {

    if (!authorized) return;

    const loadChats = () => {

      fetch("/api/chats")
        .then((res) => res.json())
        .then((data) => {

          setRows(data);

          // auto select first chat
          if (
            data.length > 0 &&
            !selectedChat
          ) {
            setSelectedChat(data[0]);
          }
        });
    };

    loadChats();

    const interval =
      setInterval(loadChats, 3000);

    return () =>
      clearInterval(interval);

  }, [authorized, selectedChat]);

  // LOGIN PAGE
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
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
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

  // MAIN DASHBOARD
  return (

    <div className="min-h-screen bg-slate-950 text-white p-6">

      <h1 className="text-3xl font-bold mb-6">
        Dashboard
      </h1>

      <div className="flex gap-4 h-[85vh]">

        {/* SIDEBAR */}
        <div className="w-[320px] bg-white/10 rounded-2xl p-4 overflow-y-auto">

          <h2 className="text-2xl font-bold mb-4">
            Conversations
          </h2>

          <div className="space-y-2">

            {rows.map((chat) => (

              <button
                key={chat.id}
                onClick={() =>
                  setSelectedChat(chat)
                }
                className={`w-full text-left p-4 rounded-2xl transition ${
                  selectedChat?.id ===
                  chat.id
                    ? "bg-cyan-400 text-black"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >

                <div className="flex items-center justify-between">

                  <h3 className="font-bold">

                    {chat.user_name ||
                      "Unknown User"}

                  </h3>

                  {chat.user_message ===
                    "HUMAN SUPPORT REQUEST" && (

                    <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                      HUMAN
                    </span>

                  )}

                </div>

                <p className="text-sm opacity-70 truncate mt-1">

                  {chat.user_message}

                </p>

              </button>

            ))}

          </div>

        </div>

        {/* CHAT PANEL */}
        <div className="flex-1 bg-white/10 rounded-2xl p-4 flex flex-col">

          {selectedChat ? (

            <>

              {/* CHAT HEADER */}
              <div className="border-b border-white/10 pb-4 mb-4">

                <h2 className="text-2xl font-bold">

                  {selectedChat.user_name}

                </h2>

              </div>

              {/* CHAT CONTENT */}
              <div className="flex-1 overflow-y-auto space-y-4">

                {/* USER */}
                <div className="flex justify-end">

                  <div className="bg-cyan-400 text-black px-4 py-3 rounded-2xl max-w-[75%]">

                    {selectedChat.user_message}

                  </div>

                </div>

                {/* AI */}
                <div className="flex justify-start">

                  <div className="bg-white/10 px-4 py-3 rounded-2xl max-w-[75%]">

                    {selectedChat.bot_reply}

                  </div>

                </div>

                {/* ADMIN */}
                {selectedChat.admin_reply && (

                  <div className="flex justify-start">

                    <div className="bg-yellow-400 text-black px-4 py-3 rounded-2xl max-w-[75%]">

                      {selectedChat.admin_reply}

                    </div>

                  </div>

                )}

              </div>

              {/* REPLY BOX */}
              <div className="mt-4 flex gap-2">

                <input
                  placeholder="Reply..."
                  onChange={(e) => {
                    selectedChat.tempReply =
                      e.target.value;
                  }}
                  className="flex-1 p-3 rounded-xl bg-black/20 outline-none"
                />

                <button
                  onClick={async () => {

                    await fetch(
                      "/api/reply",
                      {
                        method: "POST",
                        headers: {
                          "Content-Type":
                            "application/json"
                        },
                        body: JSON.stringify({
                          user_name:
                            selectedChat.user_name,
                          reply:
                            selectedChat.tempReply
                        })
                      }
                    );

                    alert(
                      "Reply sent."
                    );

                  }}
                  className="bg-cyan-400 text-black px-6 rounded-xl font-bold"
                >
                  Send
                </button>

              </div>

            </>

          ) : (

            <div className="flex-1 flex items-center justify-center text-white/50 text-xl">

              Select a conversation

            </div>

          )}

        </div>

      </div>

    </div>
  );
}
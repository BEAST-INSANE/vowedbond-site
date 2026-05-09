import React, { useEffect, useState, useRef } from "react";

export default function Dashboard() {

  const [rows, setRows] = useState([]);
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [selectedUser, setSelectedUser] =
  useState(null);

  const [replyText, setReplyText] =
    useState("");

  const chatRef = useRef(null);

  // LOGIN
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

  // LOAD CHATS
  useEffect(() => {

    if (!authorized) return;

    const loadChats = () => {

      fetch("/api/chats")
        .then((res) => res.json())
        .then((data) => {

          setRows(data);

          // auto select first user
          if (!selectedChat && data.length > 0) {

  setSelectedChat(data[0]);

}

if (selectedChat) {

  const updatedChat = data.find(
    (chat) =>
      chat.user_name ===
      selectedChat.user_name
  );

  if (updatedChat) {
    setSelectedChat(updatedChat);
  }

}

        });
    };

    loadChats();

    const interval =
      setInterval(loadChats, 2000);

    return () =>
      clearInterval(interval);

  }, [authorized]);

  // AUTO SCROLL
  useEffect(() => {

    if (chatRef.current) {
      chatRef.current.scrollTop =
        chatRef.current.scrollHeight;
    }

  }, [rows, selectedChat]);

  // UNIQUE CONVERSATIONS
  const uniqueChats = [];

  rows.forEach((chat) => {

    const alreadyExists =
      uniqueChats.find(
        (c) =>
          c.user_name ===
          chat.user_name
      );

    if (!alreadyExists) {
      uniqueChats.push(chat);
    }

  });

  // FULL CONVERSATION
  const conversation = rows.filter(
    (msg) =>
      msg.user_name ===
      selectedUser
  );

  // LOGIN SCREEN
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
            className="w-full p-3 rounded-xl bg-black/30 mb-3 outline-none"
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

    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-6">

      <h1 className="text-3xl font-bold mb-6">
        Dashboard
      </h1>

      <div className="flex flex-col md:flex-row gap-4 h-auto md:h-[85vh]">

        {/* SIDEBAR */}
        <div className="w-full md:w-[320px] h-[300px] md:h-auto bg-white/10 rounded-2xl p-4 overflow-y-auto flex-shrink-0">

          <h2 className="text-2xl font-bold mb-4">
            Conversations
          </h2>

          <div className="space-y-2">

          {[...uniqueChats].reverse().map((chat) => {

              const latestMessage =
                rows
                  .filter(
                    (m) =>
                      m.user_name ===
                      chat.user_name
                  )
                  .slice(-1)[0];

              return (

                <button
                  key={chat.user_name}
                  onClick={() =>
                    setSelectedUser(chat.user_name)
                  }
                  className={`w-full text-left p-4 rounded-2xl transition ${
                    selectedChat?.user_name ===
                    chat.user_name
                      ? "bg-cyan-400 text-black"
                      : "bg-white/5 hover:bg-white/10"
                  }`}
                >

                  <div className="flex items-center justify-between">

                    <h3 className="font-bold">

                      {chat.user_name}

                    </h3>

                    {rows.some(
                      (m) =>
                        m.user_name ===
                          chat.user_name &&
                        m.message ===
                          "HUMAN SUPPORT REQUEST"
                    ) && (

                      <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                        HUMAN
                      </span>

                    )}

                  </div>

                  <p className="text-sm opacity-70 truncate mt-1">

                    {latestMessage?.message}

                  </p>

                </button>

              );
            })}

          </div>

        </div>

        {/* CHAT PANEL */}
        <div className="w-full flex-1 bg-white/10 rounded-2xl flex flex-col min-h-[70vh] overflow-hidden">

          {selectedChat ? (

            <>

              {/* HEADER */}
              <div className="p-4 border-b border-white/10">

                <h2 className="text-2xl font-bold">

                  {selectedChat.user_name}

                </h2>

              </div>

              {/* CHAT AREA */}
              <div
                ref={chatRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >

             {conversation.map((msg) => (

  <div
    key={msg.id}
    className={`flex ${
      msg.sender === "user"
        ? "justify-end"
        : "justify-start"
    }`}
  >

    <div
      className={`px-4 py-3 rounded-2xl max-w-[75%] ${
        msg.sender === "user"
          ? "bg-cyan-400 text-black"
          : msg.sender === "admin"
          ? "bg-yellow-400 text-black"
          : "bg-white/10"
      }`}
    >

      {msg.message}

    </div>

  </div>

))}

              </div>

              {/* INPUT */}
              <div className="p-4 border-t border-white/10 flex gap-2">

                <input
                  value={replyText}
                  onChange={(e) =>
                    setReplyText(
                      e.target.value
                    )
                  }
                  placeholder="Reply..."
                  className="flex-1 p-3 rounded-xl bg-black/20 outline-none"
                />

                <button
                  onClick={async () => {

                    if (!replyText.trim())
                      return;

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
                          reply: replyText
                        })
                      }
                    );

                    setReplyText("");

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
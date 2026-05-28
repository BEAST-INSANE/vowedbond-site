import React, {
  useEffect,
  useState,
  useRef
} from "react";

export default function Dashboard() {

  const [rows, setRows] =
    useState([]);

  const [authorized, setAuthorized] =
    useState(false);

  const [password, setPassword] =
    useState("");

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [replyText, setReplyText] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [unreadCounts, setUnreadCounts] =
    useState(() => {

      const saved =
        localStorage.getItem(
          "unreadCounts"
        );

      return saved
        ? JSON.parse(saved)
        : {};

    });

  const [seenMessages, setSeenMessages] =
    useState(() => {

      const saved =
        localStorage.getItem(
          "seenMessages"
        );

      return saved
        ? JSON.parse(saved)
        : {};

    });

  const chatRef = useRef(null);

  // LOGIN
  const login = async () => {

    const res = await fetch(
      "/api/login",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          password
        })
      }
    );

    const data =
      await res.json();

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
        .then((res) =>
          res.json()
        )
        .then((data) => {

          setRows(data);

          if (
            !selectedUser &&
            data.length > 0
          ) {

            setSelectedUser(
              data[0]
                .conversation_id
            );

          }

          setUnreadCounts((prev) => {

            const updated = {
              ...prev
            };

            const seen = {
              ...seenMessages
            };

            data.forEach((msg) => {

              if (
                msg.sender ===
                  "user" &&
                msg.conversation_id !==
                  selectedUser
              ) {

                if (
                  !seen[msg.id]
                ) {

                  updated[
                    msg.conversation_id
                  ] =
                    (updated[
                      msg.conversation_id
                    ] || 0) + 1;

                  seen[msg.id] =
                    true;

                }

              }

            });

            localStorage.setItem(
              "unreadCounts",
              JSON.stringify(
                updated
              )
            );

            localStorage.setItem(
              "seenMessages",
              JSON.stringify(
                seen
              )
            );

            setSeenMessages(
              seen
            );

            return updated;

          });

        });

    };

    loadChats();

    const interval =
      setInterval(
        loadChats,
        2000
      );

    return () =>
      clearInterval(
        interval
      );

  }, [
    authorized,
    selectedUser,
    seenMessages
  ]);

  // AUTO SCROLL
  useEffect(() => {

    if (chatRef.current) {

      chatRef.current.scrollTop =
        chatRef.current
          .scrollHeight;

    }

  }, [
    rows,
    selectedUser
  ]);

  // UNIQUE CHATS
  const uniqueChats = [];

  rows.forEach((chat) => {

    const exists =
      uniqueChats.find(
        (c) =>
          c.conversation_id ===
          chat.conversation_id
      );

    if (!exists) {

      uniqueChats.push(chat);

    }

  });

  // FILTERED CHATS
  const filteredChats =
    uniqueChats.filter((chat) =>
      chat.user_name
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

  // CONVERSATION
  const conversation =
    rows
      .filter((msg) => {

        return (
          msg.conversation_id ===
            selectedUser &&
          msg.sender &&
          msg.message
        );

      })
      .sort(
        (a, b) =>
          new Date(
            a.created_at
          ) -
          new Date(
            b.created_at
          )
      );

  // LOGIN PAGE
  if (!authorized) {

    return (

      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-6 text-white">

        <div className="w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-[0_0_40px_rgba(0,0,0,0.6)]">

          <h1 className="text-4xl font-bold mb-2">

            Dashboard

          </h1>

          <p className="text-slate-400 mb-6">

            Vowed Bond Admin Panel

          </p>

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 outline-none"
          />

          <button
            onClick={login}
            className="w-full mt-4 bg-cyan-400 hover:bg-cyan-300 transition text-black font-bold py-4 rounded-2xl"
          >

            Login

          </button>

        </div>

      </div>

    );

  }

  return (

    <div className="min-h-screen bg-gradient-to-br from-[#030712] via-[#07111f] to-[#0b1220] text-white p-4 md:p-6 overflow-hidden">

      {/* TOP HEADER */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>

          <h1 className="text-4xl font-bold">

            Dashboard

          </h1>

          <p className="text-slate-400 mt-1">

            Vowed Bond Support Center

          </p>

        </div>

        <div className="flex items-center gap-3">

          <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>

          <span className="text-slate-300">

            Live

          </span>

          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">

            {uniqueChats.length} Chats

          </div>

        </div>

      </div>

      {/* MAIN */}
      <div className="flex flex-col md:flex-row gap-4 h-[88vh]">

        {/* SIDEBAR */}
        <div className="w-full md:w-[360px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.4)]">

          {/* SEARCH */}
          <div className="p-4 border-b border-white/10">

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search conversations..."
              className="w-full px-5 py-4 rounded-2xl bg-black/20 border border-white/10 outline-none"
            />

          </div>

          {/* CHAT LIST */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">

            {[...filteredChats]
              .reverse()
              .map((chat) => {

                const latestMessage =
                  rows
                    .filter(
                      (m) =>
                        m.conversation_id ===
                        chat.conversation_id
                    )
                    .slice(-1)[0];

                return (

                  <button
                    key={
                      chat.conversation_id
                    }
                    onClick={() => {

                      setSelectedUser(
                        chat.conversation_id
                      );

                      setUnreadCounts((prev) => {

                        const updated = {
                          ...prev,
                          [chat.conversation_id]:
                            0
                        };

                        localStorage.setItem(
                          "unreadCounts",
                          JSON.stringify(
                            updated
                          )
                        );

                        return updated;

                      });

                    }}
                    className={`w-full text-left p-4 rounded-3xl transition-all duration-300 border ${
                      selectedUser ===
                      chat.conversation_id
                        ? "bg-cyan-400 text-black border-cyan-300 scale-[1.02]"
                        : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06]"
                    }`}
                  >

                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-3">

                        {/* AVATAR */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                          selectedUser ===
                          chat.conversation_id
                            ? "bg-black/20"
                            : "bg-cyan-400 text-black"
                        }`}>

                          {chat.user_name
                            ?.charAt(0)
                            ?.toUpperCase()}

                        </div>

                        <div>

                          <h3 className="font-bold text-[15px]">

                            {chat.user_name}

                          </h3>

                          <p className="text-xs opacity-70 truncate w-[170px] mt-1">

                            {
                              latestMessage?.message
                            }

                          </p>

                        </div>

                      </div>

                      <div className="flex flex-col items-end gap-2">

                        {unreadCounts[
                          chat.conversation_id
                        ] > 0 && (

                          <span className="bg-red-500 text-white text-xs min-w-[26px] h-[26px] flex items-center justify-center rounded-full animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]">

                            {
                              unreadCounts[
                                chat.conversation_id
                              ]
                            }

                          </span>

                        )}

                        {rows.some(
                          (m) =>
                            m.conversation_id ===
                              chat.conversation_id &&
                            m.message ===
                              "HUMAN SUPPORT REQUEST"
                        ) && (

                          <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-400 text-black font-bold">

                            HUMAN

                          </span>

                        )}

                      </div>

                    </div>

                  </button>

                );

              })}

          </div>

        </div>

        {/* CHAT PANEL */}
        <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.4)]">

          {selectedUser ? (

            <>

              {/* CHAT HEADER */}
              <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">

                <div className="flex items-center gap-4">

                  <div className="w-14 h-14 rounded-full bg-cyan-400 text-black flex items-center justify-center font-bold text-xl">

                    {
                      conversation[0]
                        ?.user_name
                        ?.charAt(0)
                    }

                  </div>

                  <div>

                    <h2 className="text-2xl font-bold">

                      {
                        conversation[0]
                          ?.user_name
                      }

                    </h2>

                    <p className="text-slate-400 text-sm">

                      Active conversation

                    </p>

                  </div>

                </div>

                {/* DELETE BUTTON */}
<div>

  <button
    onClick={async () => {

      const confirmed =
        confirm(
          "Delete this conversation permanently?"
        );

      if (!confirmed)
        return;

      await fetch(
        "/api/deleteChat",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            conversation_id:
              selectedUser
          })
        }
      );

      setRows((prev) =>
        prev.filter(
          (msg) =>
            msg.conversation_id !==
            selectedUser
        )
      );

      setSelectedUser(null);

    }}
    className="px-5 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition"
  >

    Delete Chat

  </button>
</div>
</div>

              {/* CHAT AREA */}
              <div
                ref={chatRef}
                className="flex-1 overflow-y-auto px-5 py-6 space-y-6"
              >

                {conversation.map(
                  (msg) => (

                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender ===
                        "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >

                      <div
                        className={`max-w-[80%] px-5 py-4 rounded-[28px] text-[15px] leading-relaxed shadow-lg ${
                          msg.sender ===
                          "user"
                            ? "bg-cyan-400 text-black rounded-br-md"
                            : msg.sender ===
                              "admin"
                            ? "bg-yellow-400 text-black rounded-bl-md"
                            : msg.sender ===
                              "system"
                            ? "bg-red-500 text-white rounded-bl-md"
                            : "bg-white/10 text-white rounded-bl-md"
                        }`}
                      >

                        {msg.message}

                        <p className={`text-[11px] mt-2 ${
                          msg.sender ===
                          "user"
                            ? "text-black/60"
                            : "text-white/40"
                        }`}>

                          {new Date(
                            msg.created_at
                          ).toLocaleTimeString([], {
                            hour:
                              "2-digit",
                            minute:
                              "2-digit"
                          })}

                        </p>

                      </div>

                    </div>

                  )
                )}

              </div>

              {/* INPUT */}
              <div className="p-5 border-t border-white/10 bg-white/[0.02]">

                <div className="flex gap-3">

                  <input
                    value={replyText}
                    onChange={(e) =>
                      setReplyText(
                        e.target.value
                      )
                    }
                    placeholder="Type your reply..."
                    className="flex-1 px-5 py-4 rounded-full bg-black/20 border border-white/10 outline-none"
                  />

                  <button
                    onClick={async () => {

                      if (
                        !replyText.trim()
                      )
                        return;

                      await fetch(
                        "/api/reply",
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
                                conversation_id:
                                  selectedUser,
                                reply:
                                  replyText
                              }
                            )
                        }
                      );

                      setReplyText("");

                    }}
                    className="px-8 py-4 rounded-full bg-cyan-400 hover:bg-cyan-300 transition text-black font-bold shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                  >

                    Send

                  </button>

                </div>

              </div>

            </>

          ) : (

            <div className="flex-1 flex flex-col items-center justify-center text-center">

              <div className="w-28 h-28 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-5xl mb-6">

                💬

              </div>

              <h2 className="text-3xl font-bold">

                No Conversation Selected

              </h2>

              <p className="text-slate-400 mt-3">

                Choose a conversation from the sidebar.

              </p>

            </div>

          )}

        </div>

      </div>

    </div>

  );

}
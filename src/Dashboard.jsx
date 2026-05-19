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

          // AUTO SELECT FIRST CHAT
          if (
            !selectedUser &&
            data.length > 0
          ) {

            setSelectedUser(
              data[0]
                .conversation_id
            );

          }

          // UNREAD SYSTEM
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

  // FULL CONVERSATION
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

            {[...uniqueChats]
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

                      setSeenMessages((prev) => {

                        const updated = {
                          ...prev
                        };

                        rows.forEach((msg) => {

                          if (
                            msg.conversation_id ===
                            chat.conversation_id
                          ) {

                            updated[
                              msg.id
                            ] = true;

                          }

                        });

                        localStorage.setItem(
                          "seenMessages",
                          JSON.stringify(
                            updated
                          )
                        );

                        return updated;

                      });

                    }}
                    className={`w-full text-left p-4 rounded-2xl transition ${
                      selectedUser ===
                      chat.conversation_id
                        ? "bg-cyan-400 text-black"
                        : "bg-white/5 hover:bg-white/10"
                    }`}
                  >

                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-2">

                        <h3 className="font-bold">

                          {chat.user_name}

                        </h3>

                        {unreadCounts[
                          chat.conversation_id
                        ] > 0 && (

                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[24px] text-center">

                            {
                              unreadCounts[
                                chat.conversation_id
                              ]
                            }

                          </span>

                        )}

                      </div>

                      {rows.some(
                        (m) =>
                          m.conversation_id ===
                            chat.conversation_id &&
                          m.message ===
                            "HUMAN SUPPORT REQUEST"
                      ) && (

                        <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">

                          HUMAN

                        </span>

                      )}

                    </div>

                    <p className="text-sm opacity-70 truncate mt-1">

                      {
                        latestMessage?.message
                      }

                    </p>

                  </button>

                );

              })}

          </div>

        </div>

        {/* CHAT PANEL */}
        <div className="w-full flex-1 bg-white/10 rounded-2xl flex flex-col min-h-[70vh] overflow-hidden">

          {selectedUser ? (

            <>

              {/* HEADER */}
              <div className="p-4 border-b border-white/10">

                <h2 className="text-2xl font-bold">

                  {
                    conversation[0]
                      ?.user_name
                  }

                </h2>

              </div>

              {/* CHAT AREA */}
              <div
                ref={chatRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
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
                        className={`px-4 py-3 rounded-2xl max-w-[75%] ${
                          msg.sender ===
                          "user"
                            ? "bg-cyan-400 text-black"
                            : msg.sender ===
                              "admin"
                            ? "bg-yellow-400 text-black"
                            : msg.sender ===
                              "system"
                            ? "bg-red-500 text-white"
                            : "bg-white/10"
                        }`}
                      >

                        {msg.message}

                      </div>

                    </div>

                  )
                )}

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
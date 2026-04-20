import React, { useEffect, useState } from "react";

export default function Dashboard() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetch("/api/chats")
      .then((res) => res.json())
      .then((data) => setRows(data));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="space-y-4">
        {rows.map((chat) => (
          <div
            key={chat.id}
            className="bg-white/10 p-4 rounded-2xl border border-white/10"
          >
            <p><strong>User:</strong> {chat.user_message}</p>
            <p className="mt-2"><strong>AI:</strong> {chat.bot_reply}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

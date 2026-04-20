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
    if (authorized) {
      fetch("/api/chats")
        .then((res) => res.json())
        .then((data) => setRows(data));
    }
  }, [authorized]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="bg-white/10 p-6 rounded-2xl w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-4">Dashboard Login</h1>
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
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="space-y-4">
        {rows.map((chat) => (
          <div key={chat.id} className="bg-white/10 p-4 rounded-2xl">
            <p><strong>User:</strong> {chat.user_message}</p>
            <p className="mt-2"><strong>AI:</strong> {chat.bot_reply}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

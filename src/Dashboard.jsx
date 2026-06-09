import React, { useEffect, useMemo, useRef, useState } from "react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "🏠" },
  { id: "conversations", label: "Conversations", icon: "💬" },
  { id: "leads", label: "Leads", icon: "🎯" },
  { id: "knowledge", label: "Knowledge Base", icon: "🧠" },
  { id: "settings", label: "Settings", icon: "⚙️" }
];

const PAGE_META = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Overview of your AI support system"
  },
  conversations: {
    title: "Conversations",
    subtitle: "Review chats and manage support"
  },
  leads: {
    title: "Leads",
    subtitle: "Track interested customers and captured contacts"
  },
  knowledge: {
    title: "Knowledge Base",
    subtitle: "Review topics learned from real conversations"
  },
  settings: {
    title: "Settings",
    subtitle: "Configure your chatbot and support flow"
  }
};

const CONVERSATION_FILTERS = [
  { id: "all", label: "All Chats" },
  { id: "needs-human", label: "Needs Human" },
  { id: "ai-active", label: "AI Active" },
  { id: "human-active", label: "Human Active" },
  { id: "resolved-ai", label: "Resolved By AI" },
  { id: "resolved-human", label: "Resolved By Human" }
];

const LEAD_FILTERS = [
  { id: "all", label: "All Leads" },
  { id: "high", label: "High Interest" },
  { id: "medium", label: "Medium Interest" },
  { id: "low", label: "Low Interest" }
];

const KNOWLEDGE_GROUPS = {
  approved: [
    {
      title: "Reservations",
      count: 31,
      sample: "Customers ask about booking tables and availability."
    },
    {
      title: "Delivery",
      count: 24,
      sample: "Questions about delivery area, timings, and cost."
    },
    {
      title: "Opening Hours",
      count: 17,
      sample: "Common question about when the business is open."
    },
    {
      title: "Pricing",
      count: 12,
      sample: "Visitors want a quick answer about rates and plans."
    }
  ],
  pending: [
    {
      title: "Vegetarian Options",
      count: 8,
      sample: "AI detected repeated questions about veg menu items."
    },
    {
      title: "Membership Plans",
      count: 6,
      sample: "Potential FAQ from repeated interest in plans."
    },
    {
      title: "Discounts",
      count: 4,
      sample: "Users keep asking about offers and promo codes."
    }
  ],
  disabled: [
    {
      title: "Old Pricing",
      count: 2,
      sample: "Archived after the business updated its prices."
    }
  ]
};

const DEFAULT_SETTINGS = {
  businessName: "Vowed Bond",
  greetingMessage: "Hey! How can I help your customers today?",
  themeColor: "#22d3ee",
  collectEmails: true,
  collectPhones: true,
  humanHandoff: true,
  autoLearnFAQ: true
};

function formatTime(dateValue) {
  try {
    return new Date(dateValue).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "";
  }
}

function hasHumanSupportRequest(messages) {
  return messages.some((msg) => msg.message === "HUMAN SUPPORT REQUEST");
}

function getConversationStatus(messages) {
  if (!messages || messages.length === 0) return "Active";

  const latest = messages[messages.length - 1];
  const humanRequested = hasHumanSupportRequest(messages);

  if (humanRequested && (latest?.sender === "admin" || latest?.sender === "human")) {
    return "Resolved By Human";
  }

  if (humanRequested) {
    return "Needs Human";
  }

  if (latest?.sender === "user") {
    return "AI Active";
  }

  if (latest?.sender === "admin" || latest?.sender === "human") {
    return "Human Active";
  }

  return "Resolved By AI";
}

function getLeadInterest(messages) {
  const text = messages
    .map((msg) => msg.message || "")
    .join(" ")
    .toLowerCase();

  if (
    /book|reserve|reservation|appointment|call me|contact me|email|phone|join/.test(
      text
    )
  ) {
    return {
      label: "High",
      badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
    };
  }

  if (/price|cost|delivery|opening hours|hours|menu|service|plan/.test(text)) {
    return {
      label: "Medium",
      badgeClass: "bg-yellow-400/10 text-yellow-300 border-yellow-400/20"
    };
  }

  return {
    label: "Low",
    badgeClass: "bg-slate-500/10 text-slate-300 border-white/10"
  };
}

function generateConversationSummary(messages) {
  const text = messages.map((msg) => msg.message || "").join(" ").toLowerCase();

  const topics = [];
  if (/book|reserve|reservation|appointment/.test(text)) topics.push("reservations");
  if (/price|cost|pricing|fee/.test(text)) topics.push("pricing");
  if (/delivery|deliver|shipping/.test(text)) topics.push("delivery");
  if (/veg|vegetarian|menu/.test(text)) topics.push("vegetarian options");
  if (/open|hours|timing/.test(text)) topics.push("opening hours");
  if (topics.length === 0) topics.push("general support");

  const outcome = hasHumanSupportRequest(messages)
    ? "Human support was requested during this conversation."
    : "The conversation appears to have been handled by AI.";

  const leadPotential =
    topics.some((topic) =>
      ["reservations", "pricing", "delivery", "opening hours"].includes(topic)
    ) || /book|reserve|appointment/.test(text)
      ? "High"
      : "Medium";

  const sentiment =
    /thanks|thank you|great|perfect|awesome/.test(text) ? "Positive" : "Neutral";

  return {
    summary: `Customer asked about ${topics.join(", ")}. ${outcome}`,
    topics,
    sentiment,
    leadPotential
  };
}

export default function Dashboard() {
  const [rows, setRows] = useState([]);

  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [search, setSearch] = useState("");

  const [activePage, setActivePage] = useState("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileConversationView, setMobileConversationView] = useState("list");

  const [conversationFilter, setConversationFilter] = useState("all");
  const [leadFilter, setLeadFilter] = useState("all");
  const [knowledgeTab, setKnowledgeTab] = useState("approved");

  const [unreadCounts, setUnreadCounts] = useState(() => {
    try {
      const saved = localStorage.getItem("unreadCounts");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [seenMessages, setSeenMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("seenMessages");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryData, setSummaryData] = useState(null);

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("vowedBondDashboardSettings");
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const chatRef = useRef(null);
  const initialSeenRef = useRef(false);
  const selectedUserRef = useRef(selectedUser);
  const seenMessagesRef = useRef(seenMessages);
  const unreadCountsRef = useRef(unreadCounts);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    seenMessagesRef.current = seenMessages;
  }, [seenMessages]);

  useEffect(() => {
    unreadCountsRef.current = unreadCounts;
  }, [unreadCounts]);

  useEffect(() => {
    localStorage.setItem("vowedBondDashboardSettings", JSON.stringify(settings));
  }, [settings]);

  // LOGIN
  const login = async () => {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
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

    let mounted = true;

    const loadChats = async () => {
      try {
        const res = await fetch("/api/chats");
        const data = await res.json();

        if (!mounted) return;

        setRows(data);

        if (!selectedUserRef.current && data.length > 0) {
          const firstId = data[0].conversation_id;
          setSelectedUser(firstId);
          selectedUserRef.current = firstId;
        }

        let nextSeen = { ...seenMessagesRef.current };
        let nextUnread = { ...unreadCountsRef.current };

        if (!initialSeenRef.current && Object.keys(nextSeen).length === 0) {
          data.forEach((msg) => {
            if (msg.id) {
              nextSeen[msg.id] = true;
            }
          });

          initialSeenRef.current = true;
        }

        data.forEach((msg) => {
          if (!msg?.id) return;

          if (!nextSeen[msg.id]) {
            if (
              msg.sender === "user" &&
              msg.conversation_id !== selectedUserRef.current
            ) {
              nextUnread[msg.conversation_id] =
                (nextUnread[msg.conversation_id] || 0) + 1;
            }

            nextSeen[msg.id] = true;
          }
        });

        setSeenMessages(nextSeen);
        setUnreadCounts(nextUnread);

        seenMessagesRef.current = nextSeen;
        unreadCountsRef.current = nextUnread;

        localStorage.setItem("seenMessages", JSON.stringify(nextSeen));
        localStorage.setItem("unreadCounts", JSON.stringify(nextUnread));
      } catch (err) {
        console.log(err);
      }
    };

    loadChats();

    const interval = setInterval(loadChats, 2500);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [authorized]);

  // AUTO SCROLL
  useEffect(() => {
    if (chatRef.current) {
      setTimeout(() => {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }, 100);
    }
  }, [selectedUser, activePage, mobileConversationView, rows.length]);

  const groupedConversations = useMemo(() => {
    const map = {};

    rows.forEach((msg) => {
      if (!msg?.conversation_id) return;
      if (!map[msg.conversation_id]) map[msg.conversation_id] = [];
      map[msg.conversation_id].push(msg);
    });
    
    Object.values(map).forEach((messages) => {
      messages.sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
    });

    return map;
  }, [rows]);

  const uniqueChats = useMemo(() => {
    return Object.entries(groupedConversations)
      .map(([conversation_id, messages]) => {
        const first = messages[0];
        const latestMessage = messages[messages.length - 1];

        return {
          ...first,
          conversation_id,
          latestMessage,
          conversationMessages: messages
        };
      })
      .sort((a, b) => {
        const aTime = new Date(a.latestMessage?.created_at || 0);
        const bTime = new Date(b.latestMessage?.created_at || 0);
        return bTime - aTime;
      });
  }, [groupedConversations]);

  const conversation = groupedConversations[selectedUser] || [];
  const selectedChat =
    uniqueChats.find((chat) => chat.conversation_id === selectedUser) || null;

    const selectedConversationStatus = getConversationStatus(conversation);
  const selectedConversationInterest = getLeadInterest(conversation);
  const selectedConversationStart = conversation[0]?.created_at;
  const selectedConversationLast =
    conversation[conversation.length - 1]?.created_at;
  const currentSelectedHumanRequest = hasHumanSupportRequest(conversation);
const totalUnread = useMemo(() => {
    return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  }, [unreadCounts]);

  const humanRequestsCount = useMemo(() => {
    return uniqueChats.filter((chat) =>
      hasHumanSupportRequest(groupedConversations[chat.conversation_id] || [])
    ).length;
  }, [uniqueChats, groupedConversations]);

  const resolvedByHumanCount = useMemo(() => {
    return uniqueChats.filter((chat) => {
      const msgs = groupedConversations[chat.conversation_id] || [];
      return getConversationStatus(msgs) === "Resolved By Human";
    }).length;
  }, [uniqueChats, groupedConversations]);

  const resolvedByAiCount = useMemo(() => {
    return uniqueChats.filter((chat) => {
      const msgs = groupedConversations[chat.conversation_id] || [];
      return getConversationStatus(msgs) === "Resolved By AI";
    }).length;
  }, [uniqueChats, groupedConversations]);

  const approvedTopics = KNOWLEDGE_GROUPS.approved.length;
  const pendingTopics = KNOWLEDGE_GROUPS.pending.length;

  const notificationCount = totalUnread + humanRequestsCount + pendingTopics;

  const notifications = useMemo(() => {
    const items = [];

    if (humanRequestsCount > 0) {
      items.push({
        title: `${humanRequestsCount} human request${humanRequestsCount > 1 ? "s" : ""}`,
        subtitle: "Need attention in Conversations"
      });
    }

    if (totalUnread > 0) {
      items.push({
        title: `${totalUnread} unread message${totalUnread > 1 ? "s" : ""}`,
        subtitle: "Open chats are waiting"
      });
    }

    if (pendingTopics > 0) {
      items.push({
        title: `${pendingTopics} topics awaiting review`,
        subtitle: "Knowledge Base has new suggestions"
      });
    }

    if (items.length === 0) {
      items.push({
        title: "All caught up",
        subtitle: "No urgent notifications right now"
      });
    }

    return items;
  }, [humanRequestsCount, totalUnread, pendingTopics]);

  const filteredChats = useMemo(() => {
    return uniqueChats.filter((chat) => {
      const nameMatch = chat.user_name
        ?.toLowerCase()
        .includes(search.toLowerCase());

      if (!nameMatch) return false;

      const status = getConversationStatus(
        groupedConversations[chat.conversation_id] || []
      );

      if (conversationFilter === "all") return true;
      if (conversationFilter === "needs-human") return status === "Needs Human";
      if (conversationFilter === "ai-active") return status === "AI Active";
      if (conversationFilter === "human-active") return status === "Human Active";
      if (conversationFilter === "resolved-ai") return status === "Resolved By AI";
      if (conversationFilter === "resolved-human")
        return status === "Resolved By Human";

      return true;
    });
  }, [uniqueChats, search, conversationFilter, groupedConversations]);

  const filteredLeads = useMemo(() => {
    return uniqueChats.filter((chat) => {
      const msgs = groupedConversations[chat.conversation_id] || [];
      const interest = getLeadInterest(msgs).label;

      if (leadFilter === "all") return true;
      return interest.toLowerCase() === leadFilter;
    });
  }, [uniqueChats, groupedConversations, leadFilter]);

  const dashboardMetrics = useMemo(() => {
    return [
      {
        label: "Conversations",
        value: uniqueChats.length,
        accent: "emerald"
      },
      {
        label: "Leads",
        value: uniqueChats.length,
        accent: "cyan"
      },
      {
        label: "Human Requests",
        value: humanRequestsCount,
        accent: "yellow"
      },
      {
        label: "AI Resolved",
        value: resolvedByAiCount,
        accent: "blue"
      }
    ];
  }, [uniqueChats.length, humanRequestsCount, resolvedByAiCount]);

  const dashboardQuickActions = [
    {
      label: "Open Conversations",
      action: () => setActivePage("conversations")
    },
    {
      label: "Review Leads",
      action: () => setActivePage("leads")
    },
    {
      label: "View Knowledge Base",
      action: () => setActivePage("knowledge")
    }
  ];

  const openConversation = (conversationId) => {
    setSelectedUser(conversationId);
    selectedUserRef.current = conversationId;
    setActivePage("conversations");
    setMobileConversationView("chat");
    setMobileSidebarOpen(false);
    setNotificationOpen(false);
  };

  const openSummary = () => {
    if (!conversation.length) return;
    setSummaryData(generateConversationSummary(conversation));
    setSummaryOpen(true);
  };

  const saveSettingsNow = () => {
    localStorage.setItem("vowedBondDashboardSettings", JSON.stringify(settings));
    alert("Settings saved locally.");
  };

  // LOGIN PAGE
  if (!authorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#030712] via-[#07111f] to-[#0b1220] flex items-center justify-center p-6 text-white">
        <div className="w-full max-w-md rounded-[32px] bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-[0_0_40px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-3 mb-5">
            <img src="/logo.png" alt="Vowed Bond" className="h-10 w-auto object-contain" />
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-slate-400">Vowed Bond Support Center</p>
            </div>
          </div>

          <p className="text-slate-400 mb-6">
            Enter the dashboard password to manage chats, leads, and knowledge.
          </p>

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-emerald-400/60 transition"
          />

          <button
            onClick={login}
            className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 transition text-black font-bold py-4 rounded-2xl"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  const currentMeta = PAGE_META[activePage] || PAGE_META.dashboard;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030712] via-[#07111f] to-[#0b1220] text-white overflow-x-hidden relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700;800&display=swap');

        .display-font {
          font-family: 'Space Grotesk', sans-serif;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.14);
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
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-emerald-500/8 blur-[180px]" />
        <div className="absolute top-[800px] right-0 w-[700px] h-[700px] rounded-full bg-cyan-500/8 blur-[180px]" />
      </div>

      {/* MOBILE SIDEBAR */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden transition ${
          mobileSidebarOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/70 transition-opacity ${
            mobileSidebarOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileSidebarOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-[82vw] max-w-sm bg-gradient-to-b from-[#101827] to-[#050816] border-r border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.6)] transition-transform duration-300 ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Vowed Bond" className="h-9 w-auto object-contain" />
              <div>
                <div className="font-bold text-lg">Vowed Bond</div>
                <div className="text-xs text-slate-400">AI Support Platform</div>
              </div>
            </div>
          </div>

          <div className="p-3 space-y-2">
            {NAV_ITEMS.map((item) => {
              const active = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id);
                    setMobileSidebarOpen(false);
                    setNotificationOpen(false);
                    if (item.id !== "conversations") {
                      setMobileConversationView("list");
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition text-left ${
                    active
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
                      : "bg-white/[0.02] border-white/10 text-slate-300 hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="px-4 mt-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <div className="flex items-center justify-between min-w-0">
                <div>
                  <div className="text-sm font-semibold">Ask Vowed Bond</div>
                  <div className="text-xs text-slate-400">Coming soon</div>
                </div>
                <div className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Soon
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="relative min-h-screen lg:pl-[320px] w-full overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[320px] bg-gradient-to-b from-[#101827] to-[#050816] border-r border-white/10 shadow-[inset_-1px_0_0_rgba(16,185,129,0.12)] flex-col z-40">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Vowed Bond" className="h-10 w-auto object-contain" />
              <div>
                <div className="text-lg font-bold">Vowed Bond</div>
                <div className="text-xs text-slate-400">AI Support Platform</div>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
            {NAV_ITEMS.map((item) => {
              const active = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id);
                    setNotificationOpen(false);
                    if (item.id !== "conversations") {
                      setMobileConversationView("list");
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition text-left ${
                    active
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200 shadow-[inset_2px_0_0_rgba(16,185,129,0.65)]"
                      : "bg-white/[0.02] border-white/10 text-slate-300 hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-white/10">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Ask Vowed Bond</div>
                  <div className="text-xs text-slate-400">Coming soon</div>
                </div>
                <div className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Soon
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className="p-4 md:p-6 w-full max-w-full overflow-hidden">
          {/* TOP HEADER */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden w-12 h-12 rounded-2xl border border-white/10 bg-white/[0.04] text-white"
              >
                ☰
              </button>

              <div>
                <h1 className="text-3xl md:text-4xl font-bold">{currentMeta.title}</h1>
                <p className="text-slate-400 mt-1">{currentMeta.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-between sm:justify-end">
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300">Live</span>
                <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                  {uniqueChats.length} Chats
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setNotificationOpen((prev) => !prev)}
                  className="relative w-12 h-12 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.06] transition flex items-center justify-center"
                >
                  🔔
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-[11px] leading-5 text-white font-bold flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.8)]">
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </span>
                  )}
                </button>

                {notificationOpen && (
                  <div className="absolute right-0 mt-3 w-[320px] max-w-[90vw] rounded-[24px] border border-white/10 bg-[#0b1220] shadow-[0_20px_60px_rgba(0,0,0,0.45)] overflow-hidden z-30">
                    <div className="px-4 py-3 border-b border-white/10">
                      <div className="font-semibold">Notifications</div>
                      <div className="text-xs text-slate-400">Important dashboard updates</div>
                    </div>

                    <div className="p-2 space-y-2">
                      {notifications.map((item, index) => (
                        <div
                          key={index}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                        >
                          <div className="font-medium text-sm">{item.title}</div>
                          <div className="text-xs text-slate-400 mt-1">{item.subtitle}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PAGE CONTENT */}
          <div className="pb-10 overflow-x-hidden">
            {activePage === "dashboard" && (
              <div className="grid gap-4 grid-cols-1 xl:grid-cols-[1.55fr_0.9fr] min-w-0">
                <div className="space-y-4">
                  <div className="rounded-[32px] max-w-full border border-white/10 bg-white/[0.04] p-5 md:p-6 shadow-[0_0_30px_rgba(0,0,0,0.2)]">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 min-w-0 overflow-hidden">
                      <div>
                        <div className="text-xs uppercase tracking-[0.25em] text-emerald-400">
                          Overview
                        </div>
                        <h2 className="mt-3 text-xl font-bold display-font break-words">
                          Good to see you, Jaipreet 👋
                        </h2>
                        <p className="mt-2 text-sm md:text-base text-slate-400 max-w-2xl">
                          Conversations, leads, and knowledge are all in one place. Keep an eye on active chats, human requests, and what customers need most.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 min-w-0">
                        <span className="px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-xs">
                          {uniqueChats.length} chats
                        </span>
                        <span className="px-3 py-1 rounded-full border border-yellow-400/20 bg-yellow-400/10 text-yellow-300 text-xs">
                          {humanRequestsCount} human requests
                        </span>
                        <span className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-slate-300 text-xs">
                          {approvedTopics + pendingTopics} knowledge topics
                        </span>
                      </div>
                    </div>                 

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {dashboardQuickActions.map((action) => (
                        <button
                          key={action.label}
                          onClick={action.action}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left hover:bg-white/[0.06] transition"
                        >
                          <div className="text-sm font-medium">{action.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
  <div className="text-xs uppercase tracking-[0.2em] text-emerald-400">
    Priority Alerts
  </div>

  <div className="mt-4 space-y-3">
    <div className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
      <span>🔥</span>
      <span className="text-sm">
        {uniqueChats.length} lead{uniqueChats.length !== 1 ? "s" : ""}
      </span>
    </div>

    <div className="flex items-center gap-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-4 py-3">
      <span>🟡</span>
      <span className="text-sm">
        {humanRequestsCount} human support request{humanRequestsCount !== 1 ? "s" : ""}
      </span>
    </div>

    <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
      <span>🟢</span>
      <span className="text-sm">
        AI resolved {resolvedByAiCount} conversation{resolvedByAiCount !== 1 ? "s" : ""}
      </span>
    </div>

    <div className="flex items-center gap-3 rounded-xl bg-sky-500/10 border border-sky-500/20 px-4 py-3">
      <span>🔵</span>
      <span className="text-sm">
        {approvedTopics + pendingTopics} knowledge topics available
      </span>
    </div>
  </div>
</div>

                  <div className="grid grid-cols-2 gap-3">
  {dashboardMetrics.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_30px_rgba(0,0,0,0.2)]"
                      >
                        <div className="text-sm text-slate-400">{item.label}</div>
                        <div className="mt-2 text-3xl font-bold display-font">
                          {item.value}
                        </div>
                        <div
                          className={`mt-4 h-1 rounded-full ${
                            item.accent === "emerald"
                              ? "bg-emerald-400/60"
                              : item.accent === "cyan"
                              ? "bg-cyan-400/60"
                              : item.accent === "yellow"
                              ? "bg-yellow-400/60"
                              : "bg-blue-400/60"
                          }`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-white/[0.04] overflow-hidden">
                    <div className="px-5 md:px-6 py-4 border-b border-white/10 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-lg">Recent Conversations</div>
                        <div className="text-sm text-slate-400">Live support activity</div>
                      </div>
                      <button
                        onClick={() => setActivePage("conversations")}
                        className="text-sm px-4 py-2 rounded-2xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      >
                        Open All
                      </button>
                    </div>

                    <div className="divide-y divide-white/10">
                      {uniqueChats.slice(0, 5).map((chat) => {
                        const msgs = groupedConversations[chat.conversation_id] || [];
                        const status = getConversationStatus(msgs);
                        const interest = getLeadInterest(msgs);

                        return (
                          <button
                            key={chat.conversation_id}
                            onClick={() => openConversation(chat.conversation_id)}
                            className="w-full px-5 md:px-6 py-4 flex items-center justify-between text-left hover:bg-white/[0.03] transition"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-300">
                                {chat.user_name?.charAt(0)?.toUpperCase() || "?"}
                              </div>

                              <div className="min-w-0">
                                <div className="font-semibold text-white truncate">
                                  {chat.user_name || "Unnamed"}
                                </div>
                                <div className="text-sm text-slate-400 truncate max-w-[260px]">
                                  {chat.latestMessage?.message || "No message yet"}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <span
                                className={`text-[11px] px-2 py-1 rounded-full border ${
                                  status === "Needs Human"
                                    ? "bg-yellow-400/10 text-yellow-300 border-yellow-400/20"
                                    : status === "Human Active" || status === "Resolved By Human"
                                    ? "bg-orange-400/10 text-orange-300 border-orange-400/20"
                                    : status === "AI Active"
                                    ? "bg-cyan-400/10 text-cyan-300 border-cyan-400/20"
                                    : "bg-emerald-400/10 text-emerald-300 border-emerald-400/20"
                                }`}
                              >
                                {status}
                              </span>
                              <span
                                className={`text-[11px] px-2 py-1 rounded-full border ${interest.badgeClass}`}
                              >
                                Lead: {interest.label}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                    <div className="flex items-center justify-between min-w-0">
                      <div>
                        <div className="font-semibold text-lg">Today's Insights</div>
                        <div className="text-sm text-slate-400">What the dashboard is seeing</div>
                      </div>
                      <div className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                        Live
                      </div>
                    </div>

                    <div className="mt-4 space-y-3 text-sm">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <div className="text-slate-400">Human Requests</div>
                        <div className="mt-1 text-lg font-semibold text-white">
                          {humanRequestsCount}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <div className="text-slate-400">Unread Conversations</div>
                        <div className="mt-1 text-lg font-semibold text-white">
                          {totalUnread}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <div className="text-slate-400">Knowledge Topics</div>
                        <div className="mt-1 text-lg font-semibold text-white">
                          {approvedTopics + pendingTopics}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                    <div className="font-semibold text-lg">Chatbot Status</div>
                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <span className="text-slate-400">Knowledge Topics</span>
                        <span className="font-semibold">{approvedTopics + pendingTopics}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <span className="text-slate-400">Pending Reviews</span>
                        <span className="font-semibold text-yellow-300">{pendingTopics}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <span className="text-slate-400">Auto-Learn</span>
                        <span
                          className={`font-semibold ${
                            settings.autoLearnFAQ ? "text-emerald-300" : "text-slate-400"
                          }`}
                        >
                          {settings.autoLearnFAQ ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <span className="text-slate-400">Human Handoff</span>
                        <span
                          className={`font-semibold ${
                            settings.humanHandoff ? "text-emerald-300" : "text-slate-400"
                          }`}
                        >
                          {settings.humanHandoff ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePage === "conversations" && (
              <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
                {/* CHAT LIST */}
                <div
                  className={`rounded-[32px] border border-white/10 bg-white/[0.04] overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.25)] ${
                    mobileConversationView === "chat" ? "hidden lg:flex" : "flex"
                  } flex-col`}
                >
                  <div className="p-4 border-b border-white/10 space-y-3">
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search conversations..."
                      className="w-full px-5 py-4 rounded-2xl bg-black/20 border border-white/10 outline-none focus:border-emerald-400/60 transition"
                    />

                    <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                      {CONVERSATION_FILTERS.map((filter) => {
                        const active = conversationFilter === filter.id;
                        return (
                          <button
                            key={filter.id}
                            onClick={() => setConversationFilter(filter.id)}
                            className={`whitespace-nowrap px-3 py-2 rounded-full text-xs border transition ${
                              active
                                ? "bg-emerald-500 text-black border-emerald-400"
                                : "bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.05]"
                            }`}
                          >
                            {filter.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                    {filteredChats.map((chat) => {
                      const msgs = groupedConversations[chat.conversation_id] || [];
                      const latestMessage = msgs[msgs.length - 1];
                      const status = getConversationStatus(msgs);
                      const unread = unreadCounts[chat.conversation_id] || 0;
                      const interest = getLeadInterest(msgs);
                      const isSelected = selectedUser === chat.conversation_id;

                      return (
                        <button
                          key={chat.conversation_id}
                          onClick={() => {
                            setSelectedUser(chat.conversation_id);
                            selectedUserRef.current = chat.conversation_id;
                            setActivePage("conversations");
                            setMobileConversationView("chat");
                            setMobileSidebarOpen(false);
                            setNotificationOpen(false);

                            setUnreadCounts((prev) => {
                              const updated = { ...prev, [chat.conversation_id]: 0 };
                              unreadCountsRef.current = updated;
                              localStorage.setItem("unreadCounts", JSON.stringify(updated));
                              return updated;
                            });
                          }}
                          className={`w-full text-left p-4 rounded-3xl transition-all duration-300 border ${
                            isSelected
                              ? "bg-emerald-500/10 text-white border-emerald-500/20 shadow-[inset_2px_0_0_rgba(16,185,129,0.65)]"
                              : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                                  isSelected
                                    ? "bg-emerald-500 text-black"
                                    : "bg-white/10 text-emerald-300"
                                }`}
                              >
                                {chat.user_name?.charAt(0)?.toUpperCase() || "?"}
                              </div>

                              <div className="min-w-0">
                                <h3 className="font-bold text-[15px] truncate">
                                  {chat.user_name || "Unnamed"}
                                </h3>
                                <p className="text-xs text-slate-400 truncate w-[180px] mt-1">
                                  {latestMessage?.message || "No message yet"}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              {unread > 0 && (
                                <span className="bg-red-500 text-white text-xs min-w-[26px] h-[26px] flex items-center justify-center rounded-full animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]">
                                  {unread}
                                </span>
                              )}

                              <span
                                className={`text-[10px] px-2 py-1 rounded-full border ${
                                  status === "Needs Human"
                                    ? "bg-yellow-400/10 text-yellow-300 border-yellow-400/20"
                                    : status === "Human Active"
                                    ? "bg-orange-400/10 text-orange-300 border-orange-400/20"
                                    : status === "Resolved By Human"
                                    ? "bg-emerald-400/10 text-emerald-300 border-emerald-400/20"
                                    : status === "AI Active"
                                    ? "bg-cyan-400/10 text-cyan-300 border-cyan-400/20"
                                    : "bg-slate-500/10 text-slate-300 border-white/10"
                                }`}
                              >
                                {status}
                              </span>

                              <span
                                className={`text-[10px] px-2 py-1 rounded-full border ${interest.badgeClass}`}
                              >
                                {interest.label} Lead
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* CHAT PANEL */}
                <div
                  className={`rounded-[32px] border border-white/10 bg-white/[0.04] overflow-hidden flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.25)] ${
                    mobileConversationView === "list" ? "hidden lg:flex" : "flex"
                  }`}
                >
                  {selectedUser ? (
                    <>
                      {currentSelectedHumanRequest && (
                        <div className="px-5 md:px-6 py-3 border-b border-yellow-400/20 bg-yellow-400/10 text-yellow-100 text-sm font-medium">
                          ⚠ Human support requested in this conversation.
                        </div>
                      )}

                      <div className="px-5 md:px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02] gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <button
                            onClick={() => setMobileConversationView("list")}
                            className="lg:hidden w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.04] text-white"
                          >
                            ←
                          </button>

                          <div className="w-14 h-14 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold text-xl">
                            {selectedChat?.user_name?.charAt(0)?.toUpperCase() || "?"}
                          </div>

                          <div className="min-w-0">
                            <h2 className="text-xl md:text-2xl font-bold truncate">
                              {selectedChat?.user_name || "Conversation"}
                            </h2>
                            <p className="text-slate-400 text-sm">
                              Active conversation
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <span
                                className={`text-[10px] px-2 py-1 rounded-full border ${
                                  selectedConversationStatus === "Needs Human"
                                    ? "bg-yellow-400/10 text-yellow-300 border-yellow-400/20"
                                    : selectedConversationStatus === "Human Active"
                                    ? "bg-orange-400/10 text-orange-300 border-orange-400/20"
                                    : selectedConversationStatus === "Resolved By Human"
                                    ? "bg-emerald-400/10 text-emerald-300 border-emerald-400/20"
                                    : selectedConversationStatus === "AI Active"
                                    ? "bg-cyan-400/10 text-cyan-300 border-cyan-400/20"
                                    : "bg-slate-500/10 text-slate-300 border-white/10"
                                }`}
                              >
                                {selectedConversationStatus}
                              </span>

                              <span
                                className={`text-[10px] px-2 py-1 rounded-full border ${selectedConversationInterest.badgeClass}`}
                              >
                                {selectedConversationInterest.label} Lead
                              </span>

                              {currentSelectedHumanRequest && (
                                <span className="text-[10px] px-2 py-1 rounded-full border border-yellow-400/20 bg-yellow-400/10 text-yellow-300">
                                  Human Request
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            onClick={openSummary}
                            className="px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 transition text-sm font-medium"
                          >
                            🧠 AI Summary
                          </button>

                          <button
                            onClick={() => {
                              setActivePage("leads");
                              setNotificationOpen(false);
                            }}
                            className="px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-slate-200 hover:bg-white/[0.06] transition text-sm font-medium"
                          >
                            Review Lead
                          </button>

                          <button
                            onClick={async () => {
                              const confirmed = confirm(
                                "Delete this conversation permanently?"
                              );

                              if (!confirmed) return;

                              await fetch("/api/deleteChat", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                  conversation_id: selectedUser
                                })
                              });

                              setRows((prev) =>
                                prev.filter(
                                  (msg) => msg.conversation_id !== selectedUser
                                )
                              );

                              setSelectedUser(null);
                              setMobileConversationView("list");
                            }}
                            className="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition text-sm"
                          >
                            Delete Chat
                          </button>
                        </div>
                      </div>

                      <div className="px-5 md:px-6 py-4 border-b border-white/10 bg-white/[0.02]">
                        <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Started</div>
                            <div className="mt-1 text-sm font-medium">
                              {selectedConversationStart
                                ? new Date(selectedConversationStart).toLocaleDateString([], {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric"
                                  })
                                : "—"}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Messages</div>
                            <div className="mt-1 text-sm font-medium">{conversation.length}</div>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Last Activity</div>
                            <div className="mt-1 text-sm font-medium">
                              {selectedConversationLast ? formatTime(selectedConversationLast) : "—"}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Lead</div>
                            <div className="mt-1 text-sm font-medium">
                              {selectedConversationInterest.label}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        ref={chatRef}
                        className="flex-1 overflow-y-auto px-4 md:px-5 py-6 space-y-6 custom-scrollbar"
                      >
                        {conversation.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${
                              msg.sender === "user" ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[85%] px-5 py-4 rounded-[28px] text-[15px] leading-relaxed shadow-lg ${
                                msg.sender === "user"
                                  ? "bg-emerald-500 text-black rounded-br-md"
                                  : msg.sender === "admin"
                                  ? "bg-yellow-400 text-black rounded-bl-md"
                                  : msg.sender === "system"
                                  ? "bg-red-500 text-white rounded-bl-md"
                                  : "bg-white/10 text-white rounded-bl-md"
                              }`}
                            >
                              {msg.message}

                              <p
                                className={`text-[11px] mt-2 ${
                                  msg.sender === "user"
                                    ? "text-black/60"
                                    : "text-white/40"
                                }`}
                              >
                                {formatTime(msg.created_at)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 md:p-5 border-t border-white/10 bg-white/[0.02]">
                        <div className="flex gap-3">
                          <input
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Type your reply..."
                            className="flex-1 px-5 py-4 rounded-full bg-black/20 border border-white/10 outline-none focus:border-emerald-400/60 transition"
                          />

                          <button
                            onClick={async () => {
                              if (!replyText.trim()) return;

                              await fetch("/api/reply", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                  conversation_id: selectedUser,
                                  reply: replyText
                                })
                              });

                              setReplyText("");
                            }}
                            className="px-8 py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 transition text-black font-bold shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                      <div className="w-28 h-28 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-5xl mb-6">
                        💬
                      </div>
                      <h2 className="text-3xl font-bold">No Conversation Selected</h2>
                      <p className="text-slate-400 mt-3">
                        Choose a conversation from the sidebar.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activePage === "leads" && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "Total Leads", value: uniqueChats.length },
                    {
                      label: "High Interest",
                      value: filteredLeads.filter((chat) =>
                        getLeadInterest(groupedConversations[chat.conversation_id] || []).label ===
                        "High"
                      ).length
                    },
                    {
                      label: "Medium Interest",
                      value: filteredLeads.filter((chat) =>
                        getLeadInterest(groupedConversations[chat.conversation_id] || []).label ===
                        "Medium"
                      ).length
                    },
                    {
                      label: "Low Interest",
                      value: filteredLeads.filter((chat) =>
                        getLeadInterest(groupedConversations[chat.conversation_id] || []).label ===
                        "Low"
                      ).length
                    }
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5"
                    >
                      <div className="text-sm text-slate-400">{item.label}</div>
                      <div className="mt-2 text-3xl font-bold display-font">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-4 md:p-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="font-semibold text-lg">Lead Filters</div>
                      <div className="text-sm text-slate-400">
                        Prioritize the most promising leads
                      </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                      {LEAD_FILTERS.map((filter) => (
                        <button
                          key={filter.id}
                          onClick={() => setLeadFilter(filter.id)}
                          className={`whitespace-nowrap px-3 py-2 rounded-full text-xs border transition ${
                            leadFilter === filter.id
                              ? "bg-emerald-500 text-black border-emerald-400"
                              : "bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.05]"
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 xl:grid-cols-2">
                    {filteredLeads.map((chat) => {
                      const msgs = groupedConversations[chat.conversation_id] || [];
                      const latest = msgs[msgs.length - 1];
                      const interest = getLeadInterest(msgs);
                      const status = getConversationStatus(msgs);

                      return (
                        <button
                          key={chat.conversation_id}
                          onClick={() => openConversation(chat.conversation_id)}
                          className="text-left rounded-[28px] border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06] transition"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 min-w-0">
                              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-300">
                                {chat.user_name?.charAt(0)?.toUpperCase() || "?"}
                              </div>

                              <div className="min-w-0">
                                <h3 className="text-xl font-bold truncate">
                                  {chat.user_name || "Unnamed Lead"}
                                </h3>
                                <p className="text-sm text-slate-400 mt-1 truncate max-w-[320px]">
                                  {latest?.message || "No message yet"}
                                </p>

                                <div className="mt-4 flex flex-wrap gap-2">
                                  <span
                                    className={`text-xs px-3 py-1 rounded-full border ${interest.badgeClass}`}
                                  >
                                    Interest: {interest.label}
                                  </span>

                                  <span
                                    className={`text-xs px-3 py-1 rounded-full border ${
                                      status === "Needs Human"
                                        ? "bg-yellow-400/10 text-yellow-300 border-yellow-400/20"
                                        : status === "Resolved By Human"
                                        ? "bg-emerald-400/10 text-emerald-300 border-emerald-400/20"
                                        : "bg-white/5 text-slate-300 border-white/10"
                                    }`}
                                  >
                                    {status}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-xs text-slate-500">Source</div>
                              <div className="text-sm font-medium text-slate-300 mt-1">
                                Website Chat
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activePage === "knowledge" && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "Approved", value: approvedTopics },
                    { label: "Pending Review", value: pendingTopics },
                    { label: "Disabled", value: KNOWLEDGE_GROUPS.disabled.length },
                    { label: "Total Topics", value: approvedTopics + pendingTopics + KNOWLEDGE_GROUPS.disabled.length }
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5"
                    >
                      <div className="text-sm text-slate-400">{item.label}</div>
                      <div className="mt-2 text-3xl font-bold display-font">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-4 md:p-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="font-semibold text-lg">Knowledge Topics</div>
                      <div className="text-sm text-slate-400">
                        Topics grow from real conversations
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {Object.keys(KNOWLEDGE_GROUPS).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setKnowledgeTab(tab)}
                          className={`px-3 py-2 rounded-full text-xs border transition capitalize ${
                            knowledgeTab === tab
                              ? "bg-emerald-500 text-black border-emerald-400"
                              : "bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.05]"
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    {KNOWLEDGE_GROUPS[knowledgeTab].map((topic) => (
                      <div
                        key={topic.title}
                        className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-xs uppercase tracking-[0.25em] text-emerald-400">
                              {knowledgeTab}
                            </div>
                            <h3 className="mt-2 text-xl font-bold">
                              {topic.title} ({topic.count})
                            </h3>
                          </div>
                          <span
                            className={`text-xs px-3 py-1 rounded-full border ${
                              knowledgeTab === "approved"
                                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                                : knowledgeTab === "pending"
                                ? "bg-yellow-400/10 text-yellow-300 border-yellow-400/20"
                                : "bg-slate-500/10 text-slate-300 border-white/10"
                            }`}
                          >
                            {knowledgeTab === "approved"
                              ? "Approved"
                              : knowledgeTab === "pending"
                              ? "Pending"
                              : "Disabled"}
                          </span>
                        </div>

                        <p className="mt-4 text-sm text-slate-400 leading-relaxed">
                          {topic.sample}
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2">
                          {knowledgeTab === "approved" && (
                            <>
                              <button
                                onClick={() => alert("Edit knowledge topic later")}
                                className="px-3 py-2 rounded-full text-xs border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => alert("Disable later")}
                                className="px-3 py-2 rounded-full text-xs border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition"
                              >
                                Disable
                              </button>
                            </>
                          )}

                          {knowledgeTab === "pending" && (
                            <>
                              <button
                                onClick={() => alert("Approved and added to chatbot")}
                                className="px-3 py-2 rounded-full text-xs bg-emerald-500 text-black hover:bg-emerald-400 transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => alert("Edit suggestion later")}
                                className="px-3 py-2 rounded-full text-xs border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => alert("Reject suggestion later")}
                                className="px-3 py-2 rounded-full text-xs border border-red-500/20 text-red-300 bg-red-500/10 hover:bg-red-500/20 transition"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {knowledgeTab === "disabled" && (
                            <>
                              <button
                                onClick={() => alert("Restore later")}
                                className="px-3 py-2 rounded-full text-xs border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition"
                              >
                                Restore
                              </button>
                              <button
                                onClick={() => alert("Delete archived topic later")}
                                className="px-3 py-2 rounded-full text-xs border border-red-500/20 text-red-300 bg-red-500/10 hover:bg-red-500/20 transition"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activePage === "settings" && (
              <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-5 md:p-6">
                    <div className="font-semibold text-lg">Chatbot Settings</div>
                    <div className="mt-5 space-y-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">
                          Business Name
                        </label>
                        <input
                          value={settings.businessName}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              businessName: e.target.value
                            }))
                          }
                          className="w-full px-4 py-3 rounded-2xl bg-black/20 border border-white/10 outline-none focus:border-emerald-400/60 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-slate-400 mb-2">
                          Greeting Message
                        </label>
                        <textarea
                          rows={4}
                          value={settings.greetingMessage}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              greetingMessage: e.target.value
                            }))
                          }
                          className="w-full px-4 py-3 rounded-2xl bg-black/20 border border-white/10 outline-none focus:border-emerald-400/60 transition resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-slate-400 mb-2">
                          Theme Color
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={settings.themeColor}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                themeColor: e.target.value
                              }))
                            }
                            className="w-16 h-12 rounded-2xl bg-transparent border border-white/10 p-1"
                          />
                          <div className="text-sm text-slate-400">
                            Accent color for buttons, badges, and highlights
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-5 md:p-6">
                    <div className="font-semibold text-lg">Lead Collection</div>
                    <div className="mt-5 space-y-3">
                      {[
                        {
                          label: "Collect Emails",
                          key: "collectEmails"
                        },
                        {
                          label: "Collect Phone Numbers",
                          key: "collectPhones"
                        }
                      ].map((item) => (
                        <button
                          key={item.key}
                          onClick={() =>
                            setSettings((prev) => ({
                              ...prev,
                              [item.key]: !prev[item.key]
                            }))
                          }
                          className="w-full flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                        >
                          <span>{item.label}</span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs border ${
                              settings[item.key]
                                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                                : "bg-white/[0.03] text-slate-400 border-white/10"
                            }`}
                          >
                            {settings[item.key] ? "ON" : "OFF"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-5 md:p-6">
                    <div className="font-semibold text-lg">Human Support</div>
                    <div className="mt-5 space-y-3">
                      {[
                        {
                          label: "Human Handoff",
                          key: "humanHandoff"
                        },
                        {
                          label: "Auto-Learn FAQ",
                          key: "autoLearnFAQ"
                        }
                      ].map((item) => (
                        <button
                          key={item.key}
                          onClick={() =>
                            setSettings((prev) => ({
                              ...prev,
                              [item.key]: !prev[item.key]
                            }))
                          }
                          className="w-full flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                        >
                          <span>{item.label}</span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs border ${
                              settings[item.key]
                                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                                : "bg-white/[0.03] text-slate-400 border-white/10"
                            }`}
                          >
                            {settings[item.key] ? "ON" : "OFF"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-5 md:p-6">
                    <div className="font-semibold text-lg">Chatbot Status</div>
                    <div className="mt-5 space-y-3 text-sm">
                      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <span className="text-slate-400">Knowledge Topics</span>
                        <span className="font-semibold">
                          {approvedTopics + pendingTopics}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <span className="text-slate-400">Pending Reviews</span>
                        <span className="font-semibold text-yellow-300">
                          {pendingTopics}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <span className="text-slate-400">Last Update</span>
                        <span className="font-semibold text-white">
                          Auto-save
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <span className="text-slate-400">Status</span>
                        <span className="font-semibold text-emerald-300">
                          Healthy
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={saveSettingsNow}
                      className="mt-5 w-full px-5 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI SUMMARY MODAL */}
      {summaryOpen && summaryData && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-xl rounded-[32px] bg-[#0b1220] border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.55)] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <div className="text-xl font-bold">AI Summary</div>
                <div className="text-sm text-slate-400">
                  {selectedChat?.user_name || "Conversation"}
                </div>
              </div>
              <button
                onClick={() => setSummaryOpen(false)}
                className="w-10 h-10 rounded-2xl border border-white/10 bg-white/[0.04]"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.25em] text-emerald-400">
                  Summary
                </div>
                <p className="mt-2 text-slate-200 leading-relaxed">
                  {summaryData.summary}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs text-slate-400">Sentiment</div>
                  <div className="mt-1 font-semibold">{summaryData.sentiment}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs text-slate-400">Lead Potential</div>
                  <div className="mt-1 font-semibold">{summaryData.leadPotential}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs text-slate-400">Topics</div>
                  <div className="mt-1 font-semibold">
                    {summaryData.topics.join(", ")}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSummaryOpen(false)}
                  className="px-5 py-3 rounded-2xl bg-emerald-500 text-black font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

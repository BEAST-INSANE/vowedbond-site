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
  const [dashboardRange, setDashboardRange] = useState(7);

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


  const dashboardRangeData = useMemo(() => {
    const days = Math.max(1, dashboardRange);
    const now = new Date();
    const buckets = Array.from({ length: days }, (_, index) => {
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (days - 1 - index));
      return {
        key: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString([], { month: "short", day: "numeric" }),
        incoming: 0,
        resolved: 0,
        escalated: 0
      };
    });

    const byKey = Object.fromEntries(buckets.map((bucket) => [bucket.key, bucket]));

    uniqueChats.forEach((chat) => {
      const messages = groupedConversations[chat.conversation_id] || [];
      const latest = messages[messages.length - 1];
      if (!latest?.created_at) return;

      const date = new Date(latest.created_at);
      const key = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        .toISOString()
        .slice(0, 10);
      const bucket = byKey[key];
      if (!bucket) return;

      bucket.incoming += 1;
      const status = getConversationStatus(messages);
      if (status === "Resolved By AI" || status === "Resolved By Human") {
        bucket.resolved += 1;
      }
      if (hasHumanSupportRequest(messages)) bucket.escalated += 1;
    });

    return buckets;
  }, [dashboardRange, uniqueChats, groupedConversations]);

  const dashboardStats = useMemo(() => {
    const activeChats = uniqueChats.filter((chat) => {
      const status = getConversationStatus(groupedConversations[chat.conversation_id] || []);
      return ["AI Active", "Human Active", "Needs Human"].includes(status);
    }).length;

    const waitingChats = uniqueChats.filter((chat) =>
      getConversationStatus(groupedConversations[chat.conversation_id] || []) === "Needs Human"
    ).length;

    const resolvedTotal = resolvedByAiCount + resolvedByHumanCount;
    const aiResolutionRate = resolvedTotal
      ? Math.round((resolvedByAiCount / resolvedTotal) * 100)
      : 0;

    const leadCount = uniqueChats.filter((chat) => {
      const interest = getLeadInterest(groupedConversations[chat.conversation_id] || []).label;
      return interest === "High" || interest === "Medium";
    }).length;

    const handoffRate = uniqueChats.length
      ? Math.round((humanRequestsCount / uniqueChats.length) * 100)
      : 0;

    return {
      activeChats,
      waitingChats,
      leadCount,
      aiResolutionRate,
      handoffRate
    };
  }, [uniqueChats, groupedConversations, resolvedByAiCount, resolvedByHumanCount, humanRequestsCount]);

  const conversationTrend = useMemo(() => {
    const current = dashboardRangeData.reduce((sum, item) => sum + item.incoming, 0);
    const previousStart = new Date();
    previousStart.setHours(0, 0, 0, 0);
    previousStart.setDate(previousStart.getDate() - dashboardRange * 2 + 1);
    const previousEnd = new Date();
    previousEnd.setHours(23, 59, 59, 999);
    previousEnd.setDate(previousEnd.getDate() - dashboardRange);

    const previous = uniqueChats.filter((chat) => {
      const date = new Date(chat.latestMessage?.created_at || 0);
      return date >= previousStart && date <= previousEnd;
    }).length;

    if (!previous) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }, [dashboardRangeData, uniqueChats, dashboardRange]);

  const formatRelativeTime = (dateValue) => {
    if (!dateValue) return "";
    const diff = Math.max(0, Date.now() - new Date(dateValue).getTime());
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  };

  const getDashboardStatus = (status) => {
    const map = {
      "AI Active": { label: "AI Handling", className: "bg-cyan-400/10 text-cyan-300 border-cyan-400/20", dot: "bg-cyan-400" },
      "Human Active": { label: "Human Handling", className: "bg-blue-400/10 text-blue-300 border-blue-400/20", dot: "bg-blue-400" },
      "Needs Human": { label: "Waiting for Human", className: "bg-yellow-400/10 text-yellow-300 border-yellow-400/20", dot: "bg-yellow-400" },
      "Resolved By AI": { label: "Resolved by AI", className: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20", dot: "bg-emerald-400" },
      "Resolved By Human": { label: "Resolved by Human", className: "bg-slate-400/10 text-slate-300 border-white/10", dot: "bg-slate-400" },
      Active: { label: "Active", className: "bg-white/5 text-slate-300 border-white/10", dot: "bg-slate-400" }
    };
    return map[status] || map.Active;
  };

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

        .dashboard-content {
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }

        .dashboard-content * {
          max-width: 100%;
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
            <div className="flex items-center justify-center">
              <img src="/logo.png" alt="Vowed Bond" className="h-14 w-auto max-w-[190px] object-contain" />
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

      <div className="relative min-h-screen lg:pl-[320px] w-full">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[320px] bg-gradient-to-b from-[#101827] to-[#050816] border-r border-white/10 shadow-[inset_-1px_0_0_rgba(16,185,129,0.12)] flex-col z-40">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-center">
              <img src="/logo.png" alt="Vowed Bond" className="h-16 w-auto max-w-[210px] object-contain" />
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
        <div className="dashboard-content p-4 sm:p-5 md:p-6 w-full max-w-full">
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
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-2xl">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-300 text-sm font-semibold">System Live</span>
                </div>
                <div className="hidden sm:block bg-white/5 border border-white/10 px-3 py-2 rounded-2xl text-sm">
                  {dashboardStats.activeChats} Active Chat{dashboardStats.activeChats === 1 ? "" : "s"}
                </div>
                <div className="hidden md:block bg-white/5 border border-white/10 px-3 py-2 rounded-2xl text-sm">
                  {dashboardStats.waitingChats} Waiting
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
                  <div className="absolute right-0 top-full mt-3 w-[320px] max-w-[calc(100vw-2rem)] rounded-[24px] border border-white/10 bg-[#0b1220] shadow-[0_20px_60px_rgba(0,0,0,0.45)] overflow-hidden z-30">
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
<div className="min-h-0 min-w-0 w-full max-w-full">

  {activePage === "dashboard" && (
    <div className="max-w-7xl mx-auto space-y-6">
      <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="text-sm uppercase tracking-[0.25em] text-emerald-400">Dashboard</div>
          <h2 className="mt-2 text-4xl md:text-5xl font-bold display-font">
            {(() => {
              const hour = new Date().getHours();
              if (hour < 5) return "Good night";
              if (hour < 12) return "Good morning";
              if (hour < 18) return "Good afternoon";
              if (hour < 22) return "Good evening";
              return "Good night";
            })()}, Jaipreet
          </h2>
          <p className="mt-2 text-slate-400">
            {humanRequestsCount > 0
              ? `${humanRequestsCount} conversation${humanRequestsCount !== 1 ? "s" : ""} need your attention.`
              : "Your AI assistant is running smoothly."}
          </p>
        </div>

        <button
          onClick={() => setActivePage("conversations")}
          className="self-start md:self-auto px-4 py-3 rounded-2xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition"
        >
          Open Conversations →
        </button>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: "Conversations",
            value: uniqueChats.length,
            note: `${conversationTrend >= 0 ? "↑" : "↓"} ${Math.abs(conversationTrend)}% vs previous ${dashboardRange} days`,
            accent: "text-cyan-300"
          },
          {
            label: "Active Chats",
            value: dashboardStats.activeChats,
            note: `${dashboardStats.waitingChats} waiting for human`,
            accent: "text-emerald-300"
          },
          {
            label: "Leads",
            value: dashboardStats.leadCount,
            note: "High + medium interest",
            accent: "text-violet-300"
          },
          {
            label: "AI Resolution",
            value: `${dashboardStats.aiResolutionRate}%`,
            note: `${resolvedByAiCount} resolved by AI`,
            accent: "text-amber-300"
          }
        ].map((stat) => (
          <div key={stat.label} className="rounded-[24px] border border-white/10 bg-white/[0.035] px-5 py-4 shadow-[0_14px_40px_rgba(0,0,0,0.12)] hover:bg-white/[0.05] transition">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-400">{stat.label}</span>
              <span className={`text-xs font-semibold ${stat.accent}`}>Live</span>
            </div>
            <div className="mt-2 text-3xl font-bold display-font">{stat.value}</div>
            <div className="mt-1 text-xs text-slate-500">{stat.note}</div>
          </div>
        ))}
      </section>

      <section className="grid xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.8fr)] gap-5">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] overflow-hidden">
          <div className="px-5 sm:px-6 py-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">Conversation Analytics</h3>
              <p className="text-sm text-slate-400 mt-1">Incoming, resolved and human escalations</p>
            </div>
            <div className="flex items-center gap-1 rounded-2xl bg-black/20 border border-white/10 p-1">
              {[7, 30].map((range) => (
                <button
                  key={range}
                  onClick={() => setDashboardRange(range)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${dashboardRange === range ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"}`}
                >
                  {range}D
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
              <div>
                <div className="text-3xl font-bold display-font">{dashboardRangeData.reduce((sum, item) => sum + item.incoming, 0)}</div>
                <div className="text-xs text-slate-500 mt-1">conversations in selected period</div>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-400" />Incoming</span>
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" />Resolved</span>
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-400" />Escalated</span>
              </div>
            </div>

            {(() => {
              const width = 760;
              const height = 250;
              const padX = 18;
              const padY = 22;
              const values = dashboardRangeData.flatMap((item) => [item.incoming, item.resolved, item.escalated]);
              const max = Math.max(1, ...values);
              const x = (index) => padX + (index * (width - padX * 2)) / Math.max(1, dashboardRangeData.length - 1);
              const y = (value) => height - padY - (value / max) * (height - padY * 2);
              const line = (key) => dashboardRangeData.map((item, index) => `${x(index)},${y(item[key])}`).join(" ");
              return (
                <div className="w-full overflow-hidden">
                  <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[250px]" preserveAspectRatio="none" role="img" aria-label="Conversation analytics graph">
                    {[0, 1, 2, 3].map((step) => {
                      const gy = padY + step * ((height - padY * 2) / 3);
                      return <line key={step} x1={padX} x2={width - padX} y1={gy} y2={gy} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />;
                    })}
                    <polyline points={line("incoming")} fill="none" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points={line("resolved")} fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points={line("escalated")} fill="none" stroke="#facc15" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 6" />
                  </svg>
                  <div className="grid grid-cols-7 gap-2 mt-2 text-[10px] text-slate-500">
                    {dashboardRangeData.filter((_, index) => dashboardRange === 7 || index % 5 === 0 || index === dashboardRangeData.length - 1).map((item) => (
                      <span key={item.key} className="text-center">{item.label}</span>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] overflow-hidden">
          <div className="px-5 py-5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <div>
                <h3 className="text-xl font-semibold">Attention Required</h3>
                <p className="text-sm text-slate-400 mt-1">Things worth checking right now</p>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {[
              { count: humanRequestsCount, label: "conversations waiting for human response", color: "red", action: () => setActivePage("conversations") },
              { count: pendingTopics, label: "knowledge topics waiting for review", color: "orange", action: () => setActivePage("knowledge") },
              { count: dashboardStats.waitingChats, label: "active chats currently waiting", color: "yellow", action: () => setActivePage("conversations") },
              { count: resolvedByHumanCount, label: "conversations transferred to human agents", color: "blue", action: () => setActivePage("conversations") }
            ].map((item, index) => {
              const colors = {
                red: "border-red-500/20 bg-red-500/10 text-red-300",
                orange: "border-orange-400/20 bg-orange-400/10 text-orange-300",
                yellow: "border-yellow-400/20 bg-yellow-400/10 text-yellow-300",
                blue: "border-blue-400/20 bg-blue-400/10 text-blue-300"
              };
              return (
                <button key={index} onClick={item.action} className={`w-full text-left rounded-2xl border px-4 py-3 ${colors[item.color]} hover:brightness-110 transition flex items-center gap-3`}>
                  <span className="text-2xl font-bold min-w-8">{item.count}</span>
                  <span className="text-sm leading-5">{item.label}</span>
                  <span className="ml-auto text-lg opacity-70">→</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)] gap-5">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] overflow-hidden">
          <div className="flex items-center justify-between px-5 sm:px-6 py-5 border-b border-white/10">
            <div>
              <h3 className="text-xl font-semibold">Recent Conversations</h3>
              <p className="text-sm text-slate-400 mt-1">Latest customer activity</p>
            </div>
            <button onClick={() => setActivePage("conversations")} className="text-sm text-emerald-400 hover:text-emerald-300 font-semibold">View all →</button>
          </div>

          <div className="divide-y divide-white/10">
            {uniqueChats.slice(0, 5).map((chat) => {
              const msgs = groupedConversations[chat.conversation_id] || [];
              const status = getConversationStatus(msgs);
              const badge = getDashboardStatus(status);
              const latestText = chat.latestMessage?.message || "No message content";
              const cleanPreview = latestText === "HUMAN SUPPORT REQUEST" ? "Customer requested human support" : latestText;
              return (
                <button key={chat.conversation_id} onClick={() => openConversation(chat.conversation_id)} className="w-full px-5 sm:px-6 py-4 flex items-center gap-4 text-left hover:bg-white/[0.03] transition">
                  <div className="w-11 h-11 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold shrink-0">
                    {chat.user_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold truncate">{chat.user_name || "Unknown customer"}</span>
                      <span className="text-xs text-slate-500 shrink-0">{formatRelativeTime(chat.latestMessage?.created_at)}</span>
                    </div>
                    <div className="text-sm text-slate-400 truncate mt-1">“{cleanPreview}”</div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[11px] font-semibold ${badge.className}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />{badge.label}
                      </span>
                      <span className="text-[11px] text-slate-500">{msgs.length} message{msgs.length === 1 ? "" : "s"}</span>
                    </div>
                  </div>
                  <span className="text-slate-500 shrink-0">→</span>
                </button>
              );
            })}
            {uniqueChats.length === 0 && <div className="px-6 py-12 text-center text-slate-500">No conversations yet.</div>}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] overflow-hidden">
          <div className="px-5 py-5 border-b border-white/10">
            <h3 className="text-xl font-semibold">AI Performance</h3>
            <p className="text-sm text-slate-400 mt-1">How your assistant is handling support</p>
          </div>
          <div className="p-5 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <div className="flex items-end justify-between gap-3"><span className="text-sm text-slate-400">AI Resolution Rate</span><span className="text-2xl font-bold text-emerald-300">{dashboardStats.aiResolutionRate}%</span></div>
              <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${dashboardStats.aiResolutionRate}%` }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <div className="text-xs text-slate-500">AI Conversations</div>
                <div className="mt-1 text-2xl font-bold">{resolvedByAiCount + uniqueChats.filter((chat) => getConversationStatus(groupedConversations[chat.conversation_id] || []) === "AI Active").length}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <div className="text-xs text-slate-500">Human Handoff</div>
                <div className="mt-1 text-2xl font-bold">{dashboardStats.handoffRate}%</div>
              </div>
            </div>
            <button onClick={() => setActivePage("conversations")} className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition text-sm font-semibold text-slate-200">Review AI conversations →</button>
          </div>
        </div>
      </section>
    </div>
  )}

  {activePage === "conversations" && (
              <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:h-[calc(100dvh-190px)] lg:min-h-[560px]">
                {/* CONVERSATION LIST */}
                <div
                  className={`rounded-[28px] border border-white/10 bg-white/[0.04] min-h-[70vh] lg:min-h-0 lg:h-full flex flex-col overflow-hidden ${
                    mobileConversationView === "chat" ? "hidden lg:flex" : "flex"
                  }`}
                >
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="font-bold text-lg">Conversations</h2>
                        <p className="text-xs text-slate-400 mt-1">
                          {uniqueChats.length} total chat{uniqueChats.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      {humanRequestsCount > 0 && (
                        <span className="px-2.5 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-300 text-xs font-semibold">
                          {humanRequestsCount} human
                        </span>
                      )}
                    </div>
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search conversations..."
                      className="mt-4 w-full px-4 py-3 rounded-2xl bg-black/20 border border-white/10 outline-none focus:border-emerald-400/50 transition text-sm"
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      {CONVERSATION_FILTERS.map((filter) => (
                        <button
                          key={filter.id}
                          onClick={() => setConversationFilter(filter.id)}
                          className={`px-3 py-2 rounded-full text-xs border transition ${
                            conversationFilter === filter.id
                              ? "bg-emerald-500 text-black border-emerald-400"
                              : "bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.06]"
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    {filteredChats.length === 0 ? (
                      <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center p-6">
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-2xl mb-4">
                          💬
                        </div>
                        <div className="font-semibold">No conversations found</div>
                        <p className="text-sm text-slate-500 mt-1">
                          Try another search or filter.
                        </p>
                      </div>
                    ) : (
                      filteredChats.map((chat) => {
                        const msgs = groupedConversations[chat.conversation_id] || [];
                        const status = getConversationStatus(msgs);
                        const unread = unreadCounts[chat.conversation_id] || 0;
                        const human = hasHumanSupportRequest(msgs);
                        return (
                          <button
                            key={chat.conversation_id}
                            onClick={() => openConversation(chat.conversation_id)}
                            className={`w-full text-left rounded-2xl border p-3 transition ${
                              selectedUser === chat.conversation_id
                                ? "bg-emerald-500/10 border-emerald-500/30"
                                : "bg-white/[0.02] border-white/10 hover:bg-white/[0.05]"
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-11 h-11 shrink-0 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-300">
                                {chat.user_name?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold truncate">
                                    {chat.user_name || "Unnamed user"}
                                  </span>
                                  {unread > 0 && (
                                    <span className="shrink-0 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                                      {unread > 9 ? "9+" : unread}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 mt-1 truncate">
                                  {chat.latestMessage?.message || "No messages"}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  <span className="text-[10px] px-2 py-1 rounded-full border border-white/10 bg-white/[0.03] text-slate-400">
                                    {status}
                                  </span>
                                  {human && (
                                    <span className="text-[10px] px-2 py-1 rounded-full border border-yellow-400/20 bg-yellow-400/10 text-yellow-300">
                                      HUMAN
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* CHAT PANEL */}
                <div
                  className={`rounded-[32px] border border-white/10 bg-white/[0.04] min-h-[70vh] lg:min-h-0 lg:h-full overflow-hidden flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.25)] ${
                    mobileConversationView === "list" ? "hidden lg:flex" : "flex"
                  }`}
                >
                  {selectedUser ? (
                    <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
                      {currentSelectedHumanRequest && (
                        <div className="px-5 md:px-6 py-3 border-b border-yellow-400/20 bg-yellow-400/10 text-yellow-100 text-sm font-medium">
                          ⚠ Human support requested in this conversation.
                        </div>
                      )}

                      <div className="px-4 sm:px-5 md:px-6 py-4 sm:py-5 border-b border-white/10 bg-white/[0.02]">
                        {/* Conversation identity */}
                        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                          <button
                            onClick={() => setMobileConversationView("list")}
                            className="lg:hidden shrink-0 w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.04] text-white flex items-center justify-center"
                            aria-label="Back to conversations"
                          >
                            ←
                          </button>

                          <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold text-lg sm:text-xl">
                            {selectedChat?.user_name?.charAt(0)?.toUpperCase() || "?"}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h2 className="text-xl sm:text-2xl font-bold leading-tight break-words whitespace-normal">
                              {selectedChat?.user_name || "Conversation"}
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">
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

                        {/* AI Summary gets its own full-width row */}
                        <button
                          onClick={openSummary}
                          className="mt-4 w-full min-w-0 px-4 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 transition text-sm font-medium flex items-center justify-between gap-3 text-left"
                        >
                          <span className="flex items-center gap-3 min-w-0">
                            <span className="text-xl shrink-0">🧠</span>
                            <span className="min-w-0">
                              <span className="block font-semibold text-base">AI Summary</span>
                              <span className="block text-xs text-emerald-200/60 mt-0.5">
                                Get an AI-generated overview of this conversation
                              </span>
                            </span>
                          </span>
                          <span className="text-emerald-300 text-lg shrink-0">→</span>
                        </button>

                        {/* Secondary actions stay together underneath */}
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <button
                            onClick={() => {
                              setActivePage("leads");
                              setNotificationOpen(false);
                            }}
                            className="min-w-0 px-3 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-slate-200 hover:bg-white/[0.06] transition text-sm font-medium"
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
                            className="min-w-0 px-3 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition text-sm font-medium"
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
                        className="flex-1 min-h-0 overflow-y-auto px-4 md:px-5 py-6 space-y-6 custom-scrollbar"
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

                      <div className="shrink-0 p-3 sm:p-4 md:p-5 border-t border-white/10 bg-white/[0.02]">
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
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
                          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:gap-3 w-full min-w-0"
                        >
                          <input
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Type your reply..."
                            className="min-w-0 w-full px-4 sm:px-5 py-3.5 sm:py-4 rounded-full bg-black/20 border border-white/10 outline-none focus:border-emerald-400/60 transition"
                          />

                          <button
                            type="submit"
                            className="shrink-0 w-[78px] sm:w-auto sm:min-w-[92px] px-4 sm:px-6 py-3.5 sm:py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 transition text-black font-bold shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                          >
                            Send
                          </button>
                        </form>
                      </div>
                    </div>
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
                

                <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-4 md:p-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="font-semibold text-lg">Lead Filters</div>
                      <div className="text-sm text-slate-400">
                        Prioritize the most promising leads
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
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

                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
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
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
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

                            <div className="text-left sm:text-right">
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
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
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

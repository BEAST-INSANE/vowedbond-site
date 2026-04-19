import React, { useState } from "react";

export default function App() {
  const GlowCard = ({
    title,
    text,
    color = "34,211,238",
    titleClass = "",
    textClass = "",
  }) => {
    const [pos, setPos] = useState({ x: 50, y: 50 });

    return (
      <div
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
        }}
        className="relative overflow-hidden min-h-[140px] p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 shadow-2xl hover:scale-105 transition duration-300"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(220px circle at ${pos.x}px ${pos.y}px, rgba(${color},0.75), rgba(${color},0.25) 35%, transparent 70%)`,
          }}
        />
        <div className="relative z-10">
          <h2 className={`font-semibold ${titleClass}`}>{title}</h2>
          <p className={textClass}>{text}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen px-8 pt-0 pb-8 font-sans bg-gradient-to-br from-black via-slate-900 to-blue-950 text-white">
      
      {/* Logo + Subtitle */}
<div className="h-24 md:h-28 overflow-hidden -mt-1 mb-2 flex items-center">
  <img
    src="/logo.png"
    alt="Vowed Bond Logo"
    className="w-48 md:w-64 object-contain translate-y-3"
  />
</div>

<p className="text-slate-300 text-lg max-w-2xl mb-4">
  Professional AI chatbots for business websites.
</p>

      {/* Cards */}
      <section className="grid gap-4 md:grid-cols-3">
        <GlowCard
          title="Custom Bots"
          text="Trained on your business data."
        />
        <GlowCard
          title="24/7 Support"
          text="Instant replies for customers."
        />
        <GlowCard
          title="Lead Generation"
          text="Capture and qualify leads automatically."
        />
      </section>

      {/* Founders */}
      <div className="mt-8 rounded-3xl border border-yellow-300 shadow-[0_0_10px_rgba(253,224,71,0.8)]">
        <GlowCard
          title="Founders"
          text="Built by Jaipreet & Moksh — helping businesses grow with smart AI chatbots."
          color="192,132,252"
          titleClass="text-2xl font-bold"
          textClass="text-lg"
        />
      </div>

      {/* Demo */}
      <div className="mt-10">
        <GlowCard
          title="Demo Bot"
          text= "Chatbot widget placeholder ready for integration."
          titleClass="text-2xl font-bold"
          textClass="text-lg"
        />
      </div>
    </div>
  );
}

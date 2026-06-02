import React from "react";

export default function RestaurantDemo() {
  return (
    <div
      style={{
        background: "#ffffff",
        minHeight: "100vh",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Navbar */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "100px",
        }}
      >
        <h2
          style={{
            margin: 0,
            lineHeight: "1.05",
            fontSize: "22px",
            fontWeight: "bold",
          }}
        >
          Bella
          <br />
          Italia
        </h2>

        <div
          style={{
            display: "flex",
            gap: "22px",
            fontSize: "14px",
          }}
        >
          <span>Home</span>
          <span>Menu</span>
          <span>Reservations</span>
          <span>Contact</span>
        </div>
      </nav>

      {/* Hero */}
      <img
  src="/hero-screenshot.png"
  alt="Bella Italia Hero"
  style={{
    width: "100%",
    display: "block"
  }}
/>
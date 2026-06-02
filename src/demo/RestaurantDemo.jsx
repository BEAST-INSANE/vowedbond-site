import React from "react";

export default function RestaurantDemo() {
  return (
    <div
      style={{
        background: "#ffffff",
        minHeight: "100vh",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Navbar */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "80px",
        }}
      >
        <h2 style={{ margin: 0 }}>Bella Italia</h2>

        <div style={{ display: "flex", gap: "24px" }}>
          <span>Home</span>
          <span>Menu</span>
          <span>Reservations</span>
          <span>Contact</span>
        </div>
      </nav>

      {/* Hero */}
<div
  style={{
    maxWidth: "700px",
    position: "relative",
  }}
>

  {/* Background Pizza */}
  <img
    src="/pizza.jpg"
    alt="Pizza"
    style={{
      position: "absolute",
      top: "-20px",
      right: "-120px",
      width: "450px",
      opacity: "0.18",
      zIndex: 0,
      pointerEvents: "none",
    }}
  />

  {/* Content */}
  <div
    style={{
      position: "relative",
      zIndex: 1,
    }}
  >
    <p
      style={{
        color: "#dc2626",
        letterSpacing: "3px",
        textTransform: "uppercase",
        fontSize: "14px",
      }}
    >
      Authentic Italian Cuisine
    </p>

    <h1
      style={{
        fontSize: "56px",
        lineHeight: "1",
        marginTop: "20px",
        marginBottom: "20px",
      }}
    >
      Fresh Italian Food
      <br />
      Made Every Day
    </h1>

    <p
      style={{
        color: "#666",
        fontSize: "20px",
        maxWidth: "600px",
      }}
    >
      Authentic pizzas, pasta and desserts crafted with traditional
      recipes and fresh ingredients.
    </p>

    <button
      style={{
        marginTop: "30px",
        background: "#dc2626",
        color: "white",
        border: "none",

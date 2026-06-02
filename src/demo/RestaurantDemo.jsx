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
      <div
        style={{
          maxWidth: "700px",
          position: "relative",
        }}
      >
        {/* Background Image */}
        <img
          src="/pizza.jpg"
          alt="Chef preparing pizza"
          style={{
            position: "absolute",
            top: "120px",
            right: "-180px",
            width: "600px",
            opacity: "0.08",
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
              letterSpacing: "4px",
              textTransform: "uppercase",
              fontSize: "14px",
              marginBottom: "30px",
            }}
          >
            Authentic Italian Cuisine
          </p>

          <h1
            style={{
              fontSize: "78px",
              lineHeight: "0.95",
              margin: 0,
              marginBottom: "35px",
              fontWeight: "700",
            }}
          >
            Fresh
            <br />
            Italian Food
            <br />
            Made Every Day
          </h1>

          <p
            style={{
              color: "#666",
              fontSize: "22px",
              lineHeight: "1.8",
              maxWidth: "580px",
              marginBottom: "40px",
            }}
          >
            Authentic pizzas, pasta and desserts crafted with traditional
            recipes and fresh ingredients.
          </p>

          <button
            style={{
              background: "#e11d28",
              color: "white",
              border: "none",
              padding: "18px 34px",
              borderRadius: "999px",
              fontSize: "18px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Reserve a Table
          </button>
        </div>
      </div>
    </div>
  );
}
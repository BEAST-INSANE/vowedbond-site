import React from "react";

export default function RestaurantDemo() {
  return (
    <div
      style={{
        background: "white",
        minHeight: "100vh",
        padding: "40px",
      }}
    >
      <h1>Bell Italia</h1>

      <img
        src="https://images.unsplash.com/photo-1513104890138-7c749659a591"
        alt="Pizza"
        style={{
          width: "100%",
          maxWidth: "500px",
          borderRadius: "12px",
        }}
      />
    </div>
  );
}

import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App.jsx";
import Dashboard from "./Dashboard.jsx";
import RestaurantDemo from "./demo/RestaurantDemo.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/restaurant-demo" element={<RestaurantDemo />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

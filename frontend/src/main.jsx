import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Wake up Render backend immediately when app loads
// Free tier sleeps after 15 min — this ping wakes it up in background
fetch("https://feastly-backend-z8bu.onrender.com/")
  .catch(() => {}); // silent — user never sees this

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);
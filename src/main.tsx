import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { initializeRecoveryStorage } from "./utils/recoveryStorage";
import { ThemeProvider } from "./theme/ThemeProvider";

const root = document.getElementById("root") as HTMLElement;
async function start() {
  try {
    await initializeRecoveryStorage();
  } catch {
    root.textContent = "RhymePage could not open device recovery storage. Retry before editing so your recovered writing stays protected. ";
    const retry = document.createElement("button");
    retry.className = "rp-btn rp-btn--ink";
    retry.textContent = "Retry";
    retry.onclick = () => { void start(); };
    root.append(retry);
    return;
  }
  ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
}
void start();

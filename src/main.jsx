import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// 注：StrictModeは使用していません（Gemini API呼び出しが開発中に2重発火するのを防ぐため）
ReactDOM.createRoot(document.getElementById("root")).render(<App />);

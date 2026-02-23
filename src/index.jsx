import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/tailwind.css";
import "./styles/index.css";
import { AuthProvider } from './contexts/AuthContext';
import { CandidatesProvider } from './contexts/CandidatesContext';

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <CandidatesProvider>
        <App />
      </CandidatesProvider>
    </AuthProvider>
  </React.StrictMode>
);

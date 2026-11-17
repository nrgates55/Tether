import { useState } from "react";
import PeoplePage from "./pages/PeoplePage";
import "./App.css";

type Tab = "home" | "people" | "calendar" | "settings";

const navigation: { id: Tab; label: string; symbol: string }[] = [
  { id: "home", label: "Home", symbol: "⌂" },
  { id: "people", label: "People", symbol: "◎" },
  { id: "calendar", label: "Calendar", symbol: "▦" },
  { id: "settings", label: "Settings", symbol: "⚙" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("people");

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-mark" aria-hidden="true">t</div>
        <div>
          <div className="brand-name">tether<span>.</span></div>
          <div className="brand-subtitle">Your connections, your space.</div>
        </div>
        <span className="local-indicator" title="Data saved on this device">
          <span aria-hidden="true" className="status-dot" /> Local
        </span>
      </header>

      <main className="app-main" id="main-content">
        {activeTab === "people" ? (
          <PeoplePage />
        ) : (
          <section className="coming-soon">
            <div className="coming-soon-icon" aria-hidden="true">✦</div>
            <p className="eyebrow">COMING SOON</p>
            <h1>{navigation.find((tab) => tab.id === activeTab)?.label}</h1>
            <p>We're building the People section first. The rest of Tether will grow from there.</p>
            <button className="button button-primary" onClick={() => setActiveTab("people")}>Go to People</button>
          </section>
        )}
      </main>

      <nav className="bottom-nav" aria-label="Main navigation">
        {navigation.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`nav-item ${activeTab === tab.id ? "active" : ""}`}
            aria-current={activeTab === tab.id ? "page" : undefined}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="nav-icon" aria-hidden="true">{tab.symbol}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

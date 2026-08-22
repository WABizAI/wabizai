import React from "react";

function App() {
  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>WABizAI</h1>
          <p>AI-powered business assistant</p>
        </div>
        <button className="profile">👤</button>
      </header>

      <main className="container">
        <section className="welcome">
          <h2>Welcome to WABizAI 👋</h2>
          <p>Manage your business smarter with AI.</p>
        </section>

        <div className="cards">
          <div className="card">
            <span>💬</span>
            <h3>AI Assistant</h3>
            <p>Ask AI for help with your business.</p>
            <button>Open Assistant</button>
          </div>

          <div className="card">
            <span>📊</span>
            <h3>Business Analytics</h3>
            <p>View your business performance.</p>
            <button>View Analytics</button>
          </div>

          <div className="card">
            <span>📱</span>
            <h3>WhatsApp Tools</h3>
            <p>Create messages and manage customers.</p>
            <button>Open Tools</button>
          </div>

          <div className="card">
            <span>⚙️</span>
            <h3>Business Settings</h3>
            <p>Manage your WABizAI business.</p>
            <button>Settings</button>
          </div>
        </div>
      </main>

      <nav className="bottom-nav">
        <button>🏠<small>Home</small></button>
        <button>💬<small>AI</small></button>
        <button>📊<small>Stats</small></button>
        <button>⚙️<small>Settings</small></button>
      </nav>
    </div>
  );
}

export default App;

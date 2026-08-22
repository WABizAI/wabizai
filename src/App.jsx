import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleAuth(e) {
    e.preventDefault();
    setMessage("");
    setBusy(true);

    try {
      if (signup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });

        if (error) throw error;

        if (!data.session) {
          setMessage(
            "Account created! Please check your email to confirm your account."
          );
        } else {
          setMessage("Account created successfully!");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return <div className="loading">Loading WABizAI...</div>;
  }

  if (!session) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="logo">W</div>

          <h1>WABizAI</h1>
          <p className="subtitle">
            AI-powered business management platform
          </p>

          <h2>{signup ? "Create your account" : "Welcome back"}</h2>

          <form onSubmit={handleAuth}>
            {signup && (
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength="6"
              required
            />

            <button className="primary-btn" disabled={busy}>
              {busy
                ? "Please wait..."
                : signup
                ? "Create Account"
                : "Login"}
            </button>
          </form>

          {message && <div className="message">{message}</div>}

          <button
            className="switch-btn"
            onClick={() => {
              setSignup(!signup);
              setMessage("");
            }}
          >
            {signup
              ? "Already have an account? Login"
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>WABizAI</h1>
          <p>AI-powered business assistant</p>
        </div>

        <button className="profile">
          👤
        </button>
      </header>

      <main className="container">
        <section className="welcome">
          <h2>Welcome to WABizAI 👋</h2>
          <p>{session.user.email}</p>
        </section>

        <div className="cards">
          <div className="card">
            <span>🤖</span>
            <h3>AI Assistant</h3>
            <p>Get AI-powered help for your business.</p>
            <button>Open Assistant</button>
          </div>

          <div className="card">
            <span>👥</span>
            <h3>Customers</h3>
            <p>Manage customers and conversations.</p>
            <button>Customers</button>
          </div>

          <div className="card">
            <span>📦</span>
            <h3>Products</h3>
            <p>Manage products, prices and inventory.</p>
            <button>Products</button>
          </div>

          <div className="card">
            <span>📊</span>
            <h3>Analytics</h3>
            <p>Track your business performance.</p>
            <button>View Analytics</button>
          </div>
        </div>

        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </main>

      <nav className="bottom-nav">
        <button>🏠<small>Home</small></button>
        <button>🤖<small>AI</small></button>
        <button>📊<small>Stats</small></button>
        <button>⚙️<small>Settings</small></button>
      </nav>
    </div>
  );
}

export default App;

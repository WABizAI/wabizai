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
  const [showPassword, setShowPassword] = useState(false);

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
            "Account created! Please check your email to verify your account."
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
    return (
      <div className="loading-screen">
        <div className="loading-logo">W</div>
        <div className="loading-spinner"></div>
        <p>Loading WABizAI...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="auth-page">
        <div className="auth-glow glow-one"></div>
        <div className="auth-glow glow-two"></div>

        <div className="auth-layout">
          {/* LEFT BRANDING */}
          <div className="brand-panel">
            <div className="brand-logo">
              <span>W</span>
            </div>

            <div className="brand-content">
              <div className="brand-badge">
                <span className="status-dot"></span>
                AI BUSINESS PLATFORM
              </div>

              <h1>
                Grow your business
                <span> smarter with AI.</span>
              </h1>

              <p>
                WABizAI brings powerful AI tools, customer management and
                business insights together in one simple platform.
              </p>

              <div className="brand-features">
                <div className="brand-feature">
                  <div className="feature-icon">✦</div>
                  <div>
                    <strong>AI Business Assistant</strong>
                    <small>Get intelligent help anytime</small>
                  </div>
                </div>

                <div className="brand-feature">
                  <div className="feature-icon">⌁</div>
                  <div>
                    <strong>Smart Analytics</strong>
                    <small>Understand your business better</small>
                  </div>
                </div>

                <div className="brand-feature">
                  <div className="feature-icon">✓</div>
                  <div>
                    <strong>Everything in one place</strong>
                    <small>Customers, products & insights</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="brand-footer">
              © 2026 WABizAI · Built for modern businesses
            </div>
          </div>

          {/* AUTH CARD */}
          <div className="auth-section">
            <div className="mobile-brand">
              <div className="brand-logo small">
                <span>W</span>
              </div>
              <strong>WABizAI</strong>
            </div>

            <div className="auth-card">
              <div className="auth-top">
                <div>
                  <p className="eyebrow">
                    {signup ? "GET STARTED" : "WELCOME BACK"}
                  </p>

                  <h2>
                    {signup ? "Create your account" : "Welcome back"}
                  </h2>

                  <p className="auth-description">
                    {signup
                      ? "Start managing your business smarter today."
                      : "Sign in to continue to your business workspace."}
                  </p>
                </div>
              </div>

              <div className="auth-tabs">
                <button
                  className={!signup ? "active" : ""}
                  onClick={() => {
                    setSignup(false);
                    setMessage("");
                  }}
                  type="button"
                >
                  Login
                </button>

                <button
                  className={signup ? "active" : ""}
                  onClick={() => {
                    setSignup(true);
                    setMessage("");
                  }}
                  type="button"
                >
                  Create account
                </button>
              </div>

              <form onSubmit={handleAuth} className="auth-form">
                {signup && (
                  <div className="input-group">
                    <label>Full name</label>
                    <div className="input-wrapper">
                      <span className="input-icon">♙</span>

                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="input-group">
                  <label>Email address</label>

                  <div className="input-wrapper">
                    <span className="input-icon">@</span>

                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <div className="password-label">
                    <label>Password</label>

                    {!signup && (
                      <button
                        type="button"
                        className="forgot-btn"
                        onClick={() =>
                          setMessage(
                            "Password reset will be available soon."
                          )
                        }
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>

                  <div className="input-wrapper">
                    <span className="input-icon">●</span>

                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={
                        signup ? "new-password" : "current-password"
                      }
                      minLength="6"
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {signup && (
                  <div className="terms">
                    <span>✓</span>
                    <p>
                      By creating an account, you agree to use WABizAI
                      responsibly.
                    </p>
                  </div>
                )}

                <button
                  className="primary-btn"
                  type="submit"
                  disabled={busy}
                >
                  {busy ? (
                    <>
                      <span className="button-spinner"></span>
                      Please wait...
                    </>
                  ) : (
                    <>
                      {signup ? "Create my account" : "Sign in"}
                      <span className="arrow">→</span>
                    </>
                  )}
                </button>
              </form>

              {message && (
                <div
                  className={`message ${
                    message.toLowerCase().includes("error") ||
                    message.toLowerCase().includes("invalid")
                      ? "error"
                      : "success"
                  }`}
                >
                  <span>
                    {message.toLowerCase().includes("error") ||
                    message.toLowerCase().includes("invalid")
                      ? "!"
                      : "✓"}
                  </span>

                  <p>{message}</p>
                </div>
              )}

              <div className="auth-divider">
                <span>Secure authentication</span>
              </div>

              <div className="security-note">
                <span>🔒</span>
                <p>Your account is protected with secure authentication.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const userName =
    session.user.user_metadata?.full_name ||
    session.user.email?.split("@")[0] ||
    "there";

  return (
    <div className="app">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <div className="brand-logo mini">
            <span>W</span>
          </div>

          <div>
            <strong>WABizAI</strong>
            <small>Business Intelligence</small>
          </div>
        </div>

        <div className="header-user">
          <div className="header-user-info">
            <strong>{userName}</strong>
            <small>{session.user.email}</small>
          </div>

          <div className="avatar">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <main className="dashboard-container">
        <section className="dashboard-welcome">
          <div>
            <span className="dashboard-badge">
              <span className="status-dot"></span>
              YOUR WORKSPACE
            </span>

            <h1>
              Welcome back, <span>{userName}</span> 👋
            </h1>

            <p>
              Your AI-powered business workspace is ready. What would you like
              to work on today?
            </p>
          </div>

          <div className="ai-orb">
            <div>✦</div>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="dashboard-card ai-card">
            <div className="card-icon">✦</div>
            <div className="card-content">
              <span>AI ASSISTANT</span>
              <h3>Your business copilot</h3>
              <p>
                Get instant AI help with ideas, content, customers and
                business decisions.
              </p>
              <button>Open Assistant <span>→</span></button>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">♙</div>
            <div className="card-content">
              <span>CUSTOMERS</span>
              <h3>Manage customers</h3>
              <p>Keep your customer information organized in one place.</p>
              <button>Open Customers <span>→</span></button>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">▦</div>
            <div className="card-content">
              <span>PRODUCTS</span>
              <h3>Products & inventory</h3>
              <p>Manage products, pricing and your business inventory.</p>
              <button>Open Products <span>→</span></button>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">⌁</div>
            <div className="card-content">
              <span>ANALYTICS</span>
              <h3>Business insights</h3>
              <p>Understand your performance with smart business analytics.</p>
              <button>View Analytics <span>→</span></button>
            </div>
          </div>
        </section>

        <button className="logout-btn" onClick={logout}>
          Sign out
        </button>
      </main>

      <nav className="bottom-nav">
        <button className="active">
          <span>⌂</span>
          <small>Home</small>
        </button>

        <button>
          <span>✦</span>
          <small>AI</small>
        </button>

        <button>
          <span>⌁</span>
          <small>Stats</small>
        </button>

        <button>
          <span>⚙</span>
          <small>Settings</small>
        </button>
      </nav>
    </div>
  );
}

export default App;

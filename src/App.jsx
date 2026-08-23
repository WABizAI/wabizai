import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";
import AIChat from "./AIChat";
import PremiumPlans from "./PremiumPlans";
import Customers from "./Customers";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const [signup, setSignup] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [showCustomers, setShowCustomers] = useState(false);

  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetPassword, setResetPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");

  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);

      if (event === "PASSWORD_RECOVERY") {
        setResetPassword(true);
        setForgotPassword(false);
        setSignup(false);
        setMessage("");
      }
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

  async function handleForgotPassword(e) {
    e.preventDefault();
    setMessage("");
    setBusy(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://wabizai.vercel.app/",
      });

      if (error) throw error;

      setMessage(
        "Password reset link sent! Please check your email and follow the link."
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdatePassword(e) {
    e.preventDefault();
    setMessage("");

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      await supabase.auth.signOut();

      setResetPassword(false);
      setSignup(false);
      setForgotPassword(false);

      setPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setMessage(
        "Password updated successfully! You can now login with your new password."
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();

    setShowAI(false);
    setShowPremium(false);
    setShowCustomers(false);
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

  /*
   * AUTH SCREEN
   */
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

          {/* AUTH SECTION */}
          <div className="auth-section">

            <div className="mobile-brand">

              <div className="brand-logo small">
                <span>W</span>
              </div>

              <strong>WABizAI</strong>

            </div>

            <div className="auth-card">

              {/* RESET PASSWORD */}
              {resetPassword ? (
                <>
                  <div className="auth-top">

                    <p className="eyebrow">
                      SECURITY
                    </p>

                    <h2>
                      Create new password
                    </h2>

                    <p className="auth-description">
                      Choose a strong new password for your WABizAI account.
                    </p>

                  </div>

                  <form
                    onSubmit={handleUpdatePassword}
                    className="auth-form"
                  >

                    <div className="input-group">

                      <label>
                        New password
                      </label>

                      <div className="input-wrapper">

                        <span className="input-icon">
                          ●
                        </span>

                        <input
                          type={
                            showNewPassword
                              ? "text"
                              : "password"
                          }
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) =>
                            setNewPassword(e.target.value)
                          }
                          minLength="6"
                          required
                        />

                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() =>
                            setShowNewPassword(
                              !showNewPassword
                            )
                          }
                        >
                          {showNewPassword
                            ? "Hide"
                            : "Show"}
                        </button>

                      </div>

                    </div>

                    <div className="input-group">

                      <label>
                        Confirm new password
                      </label>

                      <div className="input-wrapper">

                        <span className="input-icon">
                          ●
                        </span>

                        <input
                          type={
                            showConfirmPassword
                              ? "text"
                              : "password"
                          }
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) =>
                            setConfirmPassword(
                              e.target.value
                            )
                          }
                          minLength="6"
                          required
                        />

                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() =>
                            setShowConfirmPassword(
                              !showConfirmPassword
                            )
                          }
                        >
                          {showConfirmPassword
                            ? "Hide"
                            : "Show"}
                        </button>

                      </div>

                    </div>

                    <button
                      className="primary-btn"
                      type="submit"
                      disabled={busy}
                    >
                      {busy ? (
                        <>
                          <span className="button-spinner"></span>
                          Updating password...
                        </>
                      ) : (
                        <>
                          Update password
                          <span className="arrow">
                            →
                          </span>
                        </>
                      )}
                    </button>

                  </form>

                  {message && (
                    <div className="message success">
                      <span>✓</span>
                      <p>{message}</p>
                    </div>
                  )}

                  <div className="auth-divider">
                    <span>
                      Secure password recovery
                    </span>
                  </div>

                  <div className="security-note">
                    <span>🔒</span>

                    <p>
                      Never share your password with anyone.
                    </p>
                  </div>
                </>

              ) : forgotPassword ? (

                /* FORGOT PASSWORD */
                <>
                  <div className="auth-top">

                    <p className="eyebrow">
                      PASSWORD RECOVERY
                    </p>

                    <h2>
                      Reset your password
                    </h2>

                    <p className="auth-description">
                      Enter your email and we'll send you a secure
                      password reset link.
                    </p>

                  </div>

                  <form
                    onSubmit={handleForgotPassword}
                    className="auth-form"
                  >

                    <div className="input-group">

                      <label>
                        Email address
                      </label>

                      <div className="input-wrapper">

                        <span className="input-icon">
                          @
                        </span>

                        <input
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) =>
                            setEmail(e.target.value)
                          }
                          autoComplete="email"
                          required
                        />

                      </div>

                    </div>

                    <button
                      className="primary-btn"
                      type="submit"
                      disabled={busy}
                    >
                      {busy ? (
                        <>
                          <span className="button-spinner"></span>
                          Sending...
                        </>
                      ) : (
                        <>
                          Send reset link
                          <span className="arrow">
                            →
                          </span>
                        </>
                      )}
                    </button>

                  </form>

                  {message && (
                    <div className="message success">
                      <span>✓</span>
                      <p>{message}</p>
                    </div>
                  )}

                  <button
                    type="button"
                    className="forgot-btn"
                    style={{
                      display: "block",
                      margin: "22px auto 0",
                    }}
                    onClick={() => {
                      setForgotPassword(false);
                      setMessage("");
                    }}
                  >
                    ← Back to Login
                  </button>

                  <div className="auth-divider">
                    <span>
                      Secure authentication
                    </span>
                  </div>

                  <div className="security-note">
                    <span>🔒</span>

                    <p>
                      Your account remains protected during recovery.
                    </p>
                  </div>
                </>

              ) : (

                /* LOGIN / SIGNUP */
                <>
                  <div className="auth-top">

                    <div>

                      <p className="eyebrow">
                        {signup
                          ? "GET STARTED"
                          : "WELCOME BACK"}
                      </p>

                      <h2>
                        {signup
                          ? "Create your account"
                          : "Welcome back"}
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
                      className={
                        !signup
                          ? "active"
                          : ""
                      }
                      onClick={() => {
                        setSignup(false);
                        setMessage("");
                      }}
                      type="button"
                    >
                      Login
                    </button>

                    <button
                      className={
                        signup
                          ? "active"
                          : ""
                      }
                      onClick={() => {
                        setSignup(true);
                        setMessage("");
                      }}
                      type="button"
                    >
                      Create account
                    </button>

                  </div>

                  <form
                    onSubmit={handleAuth}
                    className="auth-form"
                  >

                    {signup && (
                      <div className="input-group">

                        <label>
                          Full name
                        </label>

                        <div className="input-wrapper">

                          <span className="input-icon">
                            ♙
                          </span>

                          <input
                            type="text"
                            placeholder="Enter your full name"
                            value={name}
                            onChange={(e) =>
                              setName(e.target.value)
                            }
                            autoComplete="name"
                            required
                          />

                        </div>

                      </div>
                    )}

                    <div className="input-group">

                      <label>
                        Email address
                      </label>

                      <div className="input-wrapper">

                        <span className="input-icon">
                          @
                        </span>

                        <input
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) =>
                            setEmail(e.target.value)
                          }
                          autoComplete="email"
                          required
                        />

                      </div>

                    </div>

                    <div className="input-group">

                      <div className="password-label">

                        <label>
                          Password
                        </label>

                        {!signup && (
                          <button
                            type="button"
                            className="forgot-btn"
                            onClick={() => {
                              setForgotPassword(true);
                              setMessage("");
                            }}
                          >
                            Forgot password?
                          </button>
                        )}

                      </div>

                      <div className="input-wrapper">

                        <span className="input-icon">
                          ●
                        </span>

                        <input
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) =>
                            setPassword(e.target.value)
                          }
                          autoComplete={
                            signup
                              ? "new-password"
                              : "current-password"
                          }
                          minLength="6"
                          required
                        />

                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() =>
                            setShowPassword(
                              !showPassword
                            )
                          }
                        >
                          {showPassword
                            ? "Hide"
                            : "Show"}
                        </button>

                      </div>

                    </div>

                    {signup && (
                      <div className="terms">

                        <span>✓</span>

                        <p>
                          By creating an account, you agree to use
                          WABizAI responsibly.
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
                          {signup
                            ? "Create my account"
                            : "Sign in"}

                          <span className="arrow">
                            →
                          </span>
                        </>
                      )}
                    </button>

                  </form>

                  {message && (
                    <div className="message success">
                      <span>✓</span>
                      <p>{message}</p>
                    </div>
                  )}

                  <div className="auth-divider">
                    <span>
                      Secure authentication
                    </span>
                  </div>

                  <div className="security-note">
                    <span>🔒</span>

                    <p>
                      Your account is protected with secure
                      authentication.
                    </p>
                  </div>

                </>
              )}

            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
   * AI CHAT
   */
  if (showAI) {
    return (
      <AIChat
        user={session.user}
        onBack={() => setShowAI(false)}
      />
    );
  }

  /*
   * PREMIUM PLANS
   */
  if (showPremium) {
    return (
      <PremiumPlans
        user={session.user}
        onBack={() => setShowPremium(false)}
      />
    );
  }

  /*
   * CUSTOMERS
   */
  if (showCustomers) {
    return (
      <Customers
        user={session.user}
        onBack={() => setShowCustomers(false)}
      />
    );
  }

  /*
   * USER NAME
   */
  const userName =
    session.user.user_metadata?.full_name ||
    session.user.email?.split("@")[0] ||
    "there";

  /*
   * DASHBOARD
   */
  return (
    <div className="app">

      {/* HEADER */}
      <header className="dashboard-header">

        <div className="dashboard-brand">

          <div className="brand-logo mini">
            <span>W</span>
          </div>

          <div>
            <strong>
              WABizAI
            </strong>

            <small>
              Business Intelligence
            </small>
          </div>

        </div>

        <div className="header-user">

          <div className="header-user-info">

            <strong>
              {userName}
            </strong>

            <small>
              {session.user.email}
            </small>

          </div>

          <div className="avatar">
            {userName
              .charAt(0)
              .toUpperCase()}
          </div>

        </div>

      </header>

      {/* MAIN DASHBOARD */}
      <main className="dashboard-container">

        {/* WELCOME */}
        <section className="dashboard-welcome">

          <div>

            <span className="dashboard-badge">
              <span className="status-dot"></span>
              YOUR WORKSPACE
            </span>

            <h1>
              Welcome back,{" "}
              <span>
                {userName}
              </span>{" "}
              👋
            </h1>

            <p>
              Your AI-powered business workspace is ready. What
              would you like to work on today?
            </p>

          </div>

          <div className="ai-orb">
            <div>
              ✦
            </div>
          </div>

        </section>

        {/* DASHBOARD CARDS */}
        <section className="dashboard-grid">

          {/* AI */}
          <div className="dashboard-card ai-card">

            <div className="card-icon">
              ✦
            </div>

            <div className="card-content">

              <span>
                AI ASSISTANT
              </span>

              <h3>
                Your business copilot
              </h3>

              <p>
                Get instant AI help with ideas, content, customers
                and business decisions.
              </p>

              <button
                onClick={() =>
                  setShowAI(true)
                }
              >
                Open Assistant{" "}
                <span>
                  →
                </span>
              </button>

            </div>

          </div>

          {/* CUSTOMERS */}
          <div className="dashboard-card">

            <div className="card-icon">
              ♙
            </div>

            <div className="card-content">

              <span>
                CUSTOMERS
              </span>

              <h3>
                Manage customers
              </h3>

              <p>
                Keep your customer information organized in one
                place.
              </p>

              <button
                onClick={() =>
                  setShowCustomers(true)
                }
              >
                Open Customers{" "}
                <span>
                  →
                </span>
              </button>

            </div>

          </div>

          {/* PRODUCTS */}
          <div className="dashboard-card">

            <div className="card-icon">
              ▦
            </div>

            <div className="card-content">

              <span>
                PRODUCTS
              </span>

              <h3>
                Products & inventory
              </h3>

              <p>
                Manage products, pricing and your business
                inventory.
              </p>

              <button>
                Open Products{" "}
                <span>
                  →
                </span>
              </button>

            </div>

          </div>

          {/* ANALYTICS */}
          <div className="dashboard-card">

            <div className="card-icon">
              ⌁
            </div>

            <div className="card-content">

              <span>
                ANALYTICS
              </span>

              <h3>
                Business insights
              </h3>

              <p>
                Understand your performance with smart business
                analytics.
              </p>

              <button>
                View Analytics{" "}
                <span>
                  →
                </span>
              </button>

            </div>

          </div>

          {/* PREMIUM */}
          <div className="dashboard-card premium-card">

            <div className="card-icon">
              💎
            </div>

            <div className="card-content">

              <span>
                WABIZAI PREMIUM
              </span>

              <h3>
                Unlock more AI power
              </h3>

              <p>
                Get higher AI limits, advanced business tools and
                premium features for your business.
              </p>

              <button
                onClick={() =>
                  setShowPremium(true)
                }
              >
                Explore Premium{" "}
                <span>
                  →
                </span>
              </button>

            </div>

          </div>

        </section>

        {/* LOGOUT */}
        <button
          className="logout-btn"
          onClick={logout}
        >
          Sign out
        </button>

      </main>

      {/* BOTTOM NAV */}
      <nav className="bottom-nav">

        <button className="active">
          <span>
            ⌂
          </span>

          <small>
            Home
          </small>
        </button>

        <button
          onClick={() =>
            setShowAI(true)
          }
        >
          <span>
            ✦
          </span>

          <small>
            AI
          </small>
        </button>

        <button>
          <span>
            ⌁
          </span>

          <small>
            Stats
          </small>
        </button>

        <button>
          <span>
            ⚙
          </span>

          <small>
            Settings
          </small>
        </button>

      </nav>

    </div>
  );
}

export default App;

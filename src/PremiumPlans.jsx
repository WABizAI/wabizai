import React from "react";
import "./PremiumPlans.css";

function PremiumPlans({ profile, onBack }) {
  const currentPlan = profile?.plan || "free";
  const credits = profile?.credits ?? 0;

  const plans = [
    {
      id: "free",
      name: "Free",
      icon: "✦",
      price: "Rs. 0",
      period: "forever",
      description: "Start exploring WABizAI",
      features: [
        "10 AI messages / day",
        "50 AI credits",
        "Basic business assistance",
        "Chat history",
        "Standard AI responses",
      ],
      button: "Current plan",
    },
    {
      id: "pro",
      name: "Pro",
      icon: "⭐",
      price: "Rs. 999",
      period: "/ month",
      description: "For growing businesses",
      popular: true,
      features: [
        "200 AI messages / day",
        "2,000 AI credits / month",
        "Advanced business AI",
        "Marketing & content tools",
        "Customer reply generator",
        "Growth strategies",
        "Priority AI access",
        "No ads",
      ],
      button: "Upgrade to Pro",
    },
    {
      id: "business",
      name: "Business",
      icon: "💎",
      price: "Rs. 2,499",
      period: "/ month",
      description: "For serious business growth",
      features: [
        "1,000 AI messages / day",
        "7,000 AI credits / month",
        "All Pro features",
        "Advanced business tools",
        "Business analytics",
        "Team features",
        "Priority support",
        "Early access to new tools",
      ],
      button: "Choose Business",
    },
  ];

  function handleUpgrade(plan) {
    if (plan === currentPlan) return;

    alert(
      `WABizAI ${plan.toUpperCase()} payment will be available soon 🚀`
    );
  }

  return (
    <div className="premium-page">

      {/* HEADER */}
      <header className="premium-header">

        <div className="premium-header-left">

          <button
            className="premium-back-btn"
            onClick={onBack}
            aria-label="Go back"
          >
            ←
          </button>

          <div className="premium-logo">
            ✦
          </div>

          <div>
            <strong>WABizAI</strong>

            <span>
              Premium Plans
            </span>
          </div>

        </div>

        <div className="premium-usage">

          <span className="premium-plan-pill">
            {currentPlan === "free"
              ? "FREE"
              : currentPlan === "pro"
              ? "⭐ PRO"
              : "💎 BUSINESS"}
          </span>

          <span className="premium-credit-pill">
            ⚡ {credits}
          </span>

        </div>

      </header>

      {/* MAIN */}
      <main className="premium-main">

        <section className="premium-hero">

          <div className="premium-hero-icon">
            ✦
          </div>

          <div className="premium-eyebrow">
            WABizAI PREMIUM
          </div>

          <h1>
            Choose the plan
            <span> that fits your business.</span>
          </h1>

          <p>
            Unlock more AI power, smarter business
            tools and everything you need to grow.
          </p>

        </section>

        {/* CURRENT USAGE */}
        <section className="premium-status">

          <div className="premium-status-icon">
            ⚡
          </div>

          <div className="premium-status-info">

            <strong>
              Your current plan
            </strong>

            <span>
              {currentPlan === "free"
                ? "Free plan"
                : currentPlan === "pro"
                ? "WABizAI Pro"
                : "WABizAI Business"}
            </span>

          </div>

          <div className="premium-status-credits">
            <strong>
              {credits}
            </strong>
            <span>
              credits remaining
            </span>
          </div>

        </section>

        {/* PLANS */}
        <section className="premium-plans">

          {plans.map((plan) => {

            const isCurrent =
              currentPlan === plan.id;

            return (
              <article
                key={plan.id}
                className={`premium-card ${
                  plan.popular
                    ? "featured"
                    : ""
                } ${
                  isCurrent
                    ? "current"
                    : ""
                }`}
              >

                {plan.popular && (
                  <div className="premium-popular">
                    MOST POPULAR
                  </div>
                )}

                <div className="premium-card-top">

                  <div className="premium-plan-icon">
                    {plan.icon}
                  </div>

                  <div>
                    <h2>
                      {plan.name}
                    </h2>

                    <p>
                      {plan.description}
                    </p>
                  </div>

                </div>

                <div className="premium-price">

                  <strong>
                    {plan.price}
                  </strong>

                  <span>
                    {plan.period}
                  </span>

                </div>

                <div className="premium-divider" />

                <ul className="premium-features">

                  {plan.features.map(
                    (feature, index) => (
                      <li key={index}>
                        <span>✓</span>
                        {feature}
                      </li>
                    )
                  )}

                </ul>

                <button
                  className={`premium-plan-button ${
                    plan.popular
                      ? "primary"
                      : ""
                  } ${
                    isCurrent
                      ? "disabled"
                      : ""
                  }`}
                  disabled={isCurrent}
                  onClick={() =>
                    handleUpgrade(
                      plan.id
                    )
                  }
                >
                  {isCurrent
                    ? "✓ Current plan"
                    : plan.button}
                </button>

              </article>
            );
          })}

        </section>

        {/* BOTTOM NOTE */}
        <section className="premium-note">

          <span>🔒</span>

          <div>
            <strong>
              Your business data stays private.
            </strong>

            <p>
              WABizAI uses secure infrastructure
              to protect your conversations and
              account information.
            </p>
          </div>

        </section>

      </main>

    </div>
  );
}

export default PremiumPlans;

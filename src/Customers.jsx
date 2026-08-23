import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

function Customers({ user, onBack }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadCustomers();
  }, [user?.id]);

  async function loadCustomers() {
    if (!user?.id) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("customers")
      .select(
        "id, name, phone, email, notes, created_at, updated_at"
      )
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Customers loading error:", error);
      alert("Unable to load customers.");
    } else {
      setCustomers(data || []);
    }

    setLoading(false);
  }

  function resetForm() {
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
    setEditingId(null);
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(customer) {
    setEditingId(customer.id);
    setName(customer.name || "");
    setPhone(customer.phone || "");
    setEmail(customer.email || "");
    setNotes(customer.notes || "");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    resetForm();
  }

  async function saveCustomer(e) {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter customer name.");
      return;
    }

    setSaving(true);

    try {
      const customerData = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        notes: notes.trim(),
      };

      if (editingId) {
        const { data, error } = await supabase
          .from("customers")
          .update({
            ...customerData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingId)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;

        setCustomers((prev) =>
          prev.map((customer) =>
            customer.id === editingId
              ? data
              : customer
          )
        );
      } else {
        const { data, error } = await supabase
          .from("customers")
          .insert({
            ...customerData,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        setCustomers((prev) => [data, ...prev]);
      }

      closeForm();
    } catch (error) {
      console.error("Customer save error:", error);

      alert(
        error?.message ||
          "Unable to save customer."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteCustomer(customer) {
    const confirmed = window.confirm(
      `Delete ${customer.name}?`
    );

    if (!confirmed) return;

    setDeletingId(customer.id);

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", customer.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Delete error:", error);

      alert("Unable to delete customer.");
      setDeletingId(null);
      return;
    }

    setCustomers((prev) =>
      prev.filter(
        (item) => item.id !== customer.id
      )
    );

    setDeletingId(null);
  }

  const filteredCustomers = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return customers;

    return customers.filter((customer) => {
      return (
        customer.name
          ?.toLowerCase()
          .includes(value) ||
        customer.phone
          ?.toLowerCase()
          .includes(value) ||
        customer.email
          ?.toLowerCase()
          .includes(value) ||
        customer.notes
          ?.toLowerCase()
          .includes(value)
      );
    });
  }, [customers, search]);

  const totalCustomers = customers.length;

  const withEmail = customers.filter(
    (customer) => customer.email
  ).length;

  const withPhone = customers.filter(
    (customer) => customer.phone
  ).length;

  function getInitial(name) {
    return (
      name?.trim()?.charAt(0)?.toUpperCase() || "?"
    );
  }

  function formatDate(date) {
    if (!date) return "";

    return new Date(date).toLocaleDateString(
      undefined,
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  return (
    <div className="customers-page">

      {/* TOP HEADER */}
      <header className="customers-header">

        <div className="customers-header-left">

          <button
            className="customers-back"
            onClick={onBack}
            aria-label="Go back"
          >
            ←
          </button>

          <div className="customers-brand-mark">
            <span>♙</span>
          </div>

          <div className="customers-brand-text">
            <strong>Customers</strong>
            <span>Customer management</span>
          </div>

        </div>

        <button
          className="customers-header-add"
          onClick={openAddForm}
        >
          <span>＋</span>
          <span>Add customer</span>
        </button>

      </header>

      {/* MAIN CONTENT */}
      <main className="customers-main">

        {/* HERO */}
        <section className="customers-hero">

          <div className="customers-hero-content">

            <div className="customers-eyebrow">
              <span className="customers-live-dot"></span>
              CUSTOMER MANAGEMENT
            </div>

            <h1>
              Build stronger
              <span> customer relationships.</span>
            </h1>

            <p>
              Keep your customers organized,
              accessible and ready to help your
              business grow.
            </p>

            <button
              className="customers-hero-button"
              onClick={openAddForm}
            >
              <span>＋</span>
              Add your first customer
              <span className="hero-arrow">→</span>
            </button>

          </div>

          <div className="customers-hero-orb">

            <div className="hero-orb-glow"></div>

            <div className="hero-orb-inner">
              <span>♙</span>
            </div>

            <div className="hero-floating-card hero-floating-one">
              <strong>{totalCustomers}</strong>
              <span>Customers</span>
            </div>

            <div className="hero-floating-card hero-floating-two">
              <span className="floating-check">✓</span>
              <span>Organized</span>
            </div>

          </div>

        </section>

        {/* STAT CARDS */}
        <section className="customers-stats">

          <div className="customer-stat-card">

            <div className="customer-stat-icon">
              ♙
            </div>

            <div>
              <span>Total customers</span>
              <strong>{totalCustomers}</strong>
            </div>

            <small className="stat-trend">
              Your contacts
            </small>

          </div>

          <div className="customer-stat-card">

            <div className="customer-stat-icon email">
              @
            </div>

            <div>
              <span>Email contacts</span>
              <strong>{withEmail}</strong>
            </div>

            <small className="stat-trend">
              Reachable
            </small>

          </div>

          <div className="customer-stat-card">

            <div className="customer-stat-icon phone">
              ☎
            </div>

            <div>
              <span>Phone contacts</span>
              <strong>{withPhone}</strong>
            </div>

            <small className="stat-trend">
              Direct contact
            </small>

          </div>

        </section>

        {/* TOOLBAR */}
        <section className="customers-toolbar">

          <div className="customers-toolbar-title">
            <div>
              <span>YOUR CONTACTS</span>
              <h2>
                {search
                  ? "Search results"
                  : "Customer directory"}
              </h2>
            </div>

            <small>
              {filteredCustomers.length}{" "}
              {filteredCustomers.length === 1
                ? "customer"
                : "customers"}
            </small>
          </div>

          <div className="customers-toolbar-actions">

            <div className="customers-search">

              <span className="search-icon">
                ⌕
              </span>

              <input
                type="text"
                placeholder="Search name, phone or email..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

              {search && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => setSearch("")}
                >
                  ×
                </button>
              )}

            </div>

            <button
              className="customers-add-button"
              onClick={openAddForm}
            >
              <span>＋</span>
              Add customer
            </button>

          </div>

        </section>

        {/* CUSTOMER LIST */}
        <section className="customers-list">

          {loading ? (

            <div className="customers-loading">

              <div className="customers-loading-orb">
                <span>✦</span>
              </div>

              <strong>
                Loading your customers
              </strong>

              <p>
                Getting everything ready...
              </p>

            </div>

          ) : filteredCustomers.length === 0 ? (

            <div className="customers-empty">

              <div className="customers-empty-illustration">

                <div className="empty-ring">
                  <span>♙</span>
                </div>

              </div>

              <span className="empty-eyebrow">
                {search
                  ? "NO RESULTS"
                  : "YOUR DIRECTORY"}
              </span>

              <h3>
                {search
                  ? "No customers found"
                  : "Your customer list is empty"}
              </h3>

              <p>
                {search
                  ? "Try a different name, phone number or email."
                  : "Add your first customer and start building your business directory."}
              </p>

              {!search && (
                <button
                  className="empty-add-button"
                  onClick={openAddForm}
                >
                  <span>＋</span>
                  Add first customer
                </button>
              )}

              {search && (
                <button
                  className="empty-clear-button"
                  onClick={() => setSearch("")}
                >
                  Clear search
                </button>
              )}

            </div>

          ) : (

            <div className="customer-grid">

              {filteredCustomers.map(
                (customer) => {

                  const initial =
                    getInitial(customer.name);

                  return (
                    <article
                      className="customer-card"
                      key={customer.id}
                    >

                      {/* CARD TOP */}
                      <div className="customer-card-top">

                        <div className="customer-avatar-wrap">

                          <div className="customer-avatar">
                            {initial}
                          </div>

                          <span className="customer-online-dot"></span>

                        </div>

                        <div className="customer-main-info">

                          <span className="customer-label">
                            CUSTOMER
                          </span>

                          <h3>
                            {customer.name}
                          </h3>

                          {customer.email ? (
                            <span className="customer-email">
                              {customer.email}
                            </span>
                          ) : (
                            <span className="customer-no-email">
                              No email added
                            </span>
                          )}

                        </div>

                        <div className="customer-actions">

                          <button
                            type="button"
                            className="customer-edit"
                            onClick={() =>
                              openEditForm(
                                customer
                              )
                            }
                            title="Edit customer"
                          >
                            ✎
                          </button>

                          <button
                            type="button"
                            className="customer-delete"
                            onClick={() =>
                              deleteCustomer(
                                customer
                              )
                            }
                            disabled={
                              deletingId ===
                              customer.id
                            }
                            title="Delete customer"
                          >
                            {deletingId ===
                            customer.id
                              ? "..."
                              : "⌫"}
                          </button>

                        </div>

                      </div>

                      {/* DETAILS */}
                      <div className="customer-details">

                        <div className="customer-detail">

                          <div className="detail-icon">
                            ☎
                          </div>

                          <div>
                            <span>Phone</span>

                            <strong>
                              {customer.phone ||
                                "Not provided"}
                            </strong>
                          </div>

                        </div>

                        <div className="customer-detail">

                          <div className="detail-icon email">
                            @
                          </div>

                          <div>
                            <span>Email</span>

                            <strong>
                              {customer.email ||
                                "Not provided"}
                            </strong>
                          </div>

                        </div>

                      </div>

                      {/* NOTES */}
                      {customer.notes && (
                        <div className="customer-notes">

                          <div className="notes-heading">
                            <span>✦</span>
                            <strong>Note</strong>
                          </div>

                          <p>
                            {customer.notes}
                          </p>

                        </div>
                      )}

                      {/* FOOTER */}
                      <div className="customer-card-footer">

                        <span>
                          Added{" "}
                          {formatDate(
                            customer.created_at
                          )}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(
                              customer
                            )
                          }
                        >
                          View & edit
                          <span>→</span>
                        </button>

                      </div>

                    </article>
                  );
                }
              )}

            </div>

          )}

        </section>

      </main>

      {/* ADD / EDIT MODAL */}
      {showForm && (
        <div
          className="customer-modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget
            ) {
              closeForm();
            }
          }}
        >

          <div className="customer-modal">

            {/* MODAL HEADER */}
            <div className="customer-modal-header">

              <div className="modal-title-area">

                <div className="modal-icon">
                  {editingId ? "✎" : "＋"}
                </div>

                <div>

                  <span>
                    {editingId
                      ? "EDIT CUSTOMER"
                      : "NEW CUSTOMER"}
                  </span>

                  <h2>
                    {editingId
                      ? "Update customer"
                      : "Add a customer"}
                  </h2>

                  <p>
                    {editingId
                      ? "Keep their information up to date."
                      : "Create a customer profile for your business."}
                  </p>

                </div>

              </div>

              <button
                type="button"
                className="customer-modal-close"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close"
              >
                ×
              </button>

            </div>

            {/* FORM */}
            <form
              onSubmit={saveCustomer}
              className="customer-form"
            >

              {/* NAME */}
              <div className="customer-form-group">

                <label>
                  Customer name
                  <span>*</span>
                </label>

                <div className="premium-input">

                  <span>♙</span>

                  <input
                    type="text"
                    placeholder="e.g. Ahmed Khan"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    required
                    autoFocus
                  />

                </div>

              </div>

              {/* PHONE + EMAIL */}
              <div className="customer-form-row">

                <div className="customer-form-group">

                  <label>
                    Phone number
                  </label>

                  <div className="premium-input">

                    <span>☎</span>

                    <input
                      type="tel"
                      placeholder="+92 300 1234567"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value)
                      }
                    />

                  </div>

                </div>

                <div className="customer-form-group">

                  <label>
                    Email address
                  </label>

                  <div className="premium-input">

                    <span>@</span>

                    <input
                      type="email"
                      placeholder="customer@example.com"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                    />

                  </div>

                </div>

              </div>

              {/* NOTES */}
              <div className="customer-form-group">

                <label>
                  Notes
                </label>

                <div className="premium-textarea">

                  <span>✦</span>

                  <textarea
                    placeholder="Add useful information about this customer..."
                    rows="4"
                    value={notes}
                    onChange={(e) =>
                      setNotes(e.target.value)
                    }
                  />

                </div>

                <small>
                  Optional — add preferences,
                  interests or other useful details.
                </small>

              </div>

              {/* FORM ACTIONS */}
              <div className="customer-form-actions">

                <button
                  type="button"
                  className="customer-cancel-button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="customer-save-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="save-spinner"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span>
                        {editingId
                          ? "Save changes"
                          : "Add customer"}
                      </span>

                      <b>→</b>
                    </>
                  )}
                </button>

              </div>

            </form>

            {/* MODAL FOOTER */}
            <div className="customer-modal-footer">
              <span>🔒</span>
              Your customer information is securely stored.
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Customers;

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

        setCustomers((prev) => [
          data,
          ...prev,
        ]);
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

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", customer.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Delete error:", error);

      alert(
        "Unable to delete customer."
      );

      return;
    }

    setCustomers((prev) =>
      prev.filter(
        (item) =>
          item.id !== customer.id
      )
    );
  }

  const filteredCustomers = useMemo(() => {
    const value =
      search.trim().toLowerCase();

    if (!value) {
      return customers;
    }

    return customers.filter(
      (customer) =>
        customer.name
          ?.toLowerCase()
          .includes(value) ||
        customer.phone
          ?.toLowerCase()
          .includes(value) ||
        customer.email
          ?.toLowerCase()
          .includes(value)
    );
  }, [customers, search]);

  return (
    <div className="customers-page">

      {/* HEADER */}
      <header className="customers-header">

        <div className="customers-header-left">

          <button
            className="customers-back"
            onClick={onBack}
          >
            ←
          </button>

          <div className="customers-logo">
            ♙
          </div>

          <div>
            <strong>
              Customers
            </strong>

            <span>
              Customer management
            </span>
          </div>

        </div>

        <button
          className="customers-add-top"
          onClick={openAddForm}
        >
          + <span>Add customer</span>
        </button>

      </header>

      {/* MAIN */}
      <main className="customers-main">

        {/* HERO */}
        <section className="customers-hero">

          <div>

            <span className="customers-eyebrow">
              CUSTOMER MANAGEMENT
            </span>

            <h1>
              Your customers,
              <span>
                all in one place.
              </span>
            </h1>

            <p>
              Keep customer information
              organized and easy to access.
            </p>

          </div>

          <div className="customers-stat">

            <strong>
              {customers.length}
            </strong>

            <span>
              Total customers
            </span>

          </div>

        </section>

        {/* TOOLBAR */}
        <section className="customers-toolbar">

          <div className="customers-search">

            <span>
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            {search && (
              <button
                onClick={() =>
                  setSearch("")
                }
              >
                ×
              </button>
            )}

          </div>

          <button
            className="customers-add-button"
            onClick={openAddForm}
          >
            + Add customer
          </button>

        </section>

        {/* LIST */}
        <section className="customers-list">

          {loading ? (
            <div className="customers-empty">

              <div className="customers-spinner"></div>

              <strong>
                Loading customers...
              </strong>

            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="customers-empty">

              <div className="customers-empty-icon">
                ♙
              </div>

              <h3>
                {search
                  ? "No customers found"
                  : "No customers yet"}
              </h3>

              <p>
                {search
                  ? "Try another search."
                  : "Add your first customer to get started."}
              </p>

              {!search && (
                <button
                  onClick={openAddForm}
                >
                  + Add your first customer
                </button>
              )}

            </div>
          ) : (
            <div className="customer-grid">

              {filteredCustomers.map(
                (customer) => {

                  const initial =
                    customer.name
                      ?.charAt(0)
                      .toUpperCase() ||
                    "?";

                  return (
                    <article
                      className="customer-card"
                      key={customer.id}
                    >

                      <div className="customer-card-top">

                        <div className="customer-avatar">
                          {initial}
                        </div>

                        <div className="customer-main-info">

                          <h3>
                            {customer.name}
                          </h3>

                          {customer.email && (
                            <span>
                              {customer.email}
                            </span>
                          )}

                        </div>

                        <div className="customer-actions">

                          <button
                            onClick={() =>
                              openEditForm(
                                customer
                              )
                            }
                            title="Edit"
                          >
                            ✎
                          </button>

                          <button
                            onClick={() =>
                              deleteCustomer(
                                customer
                              )
                            }
                            title="Delete"
                          >
                            🗑
                          </button>

                        </div>

                      </div>

                      <div className="customer-details">

                        {customer.phone && (
                          <div>
                            <span>
                              ☎
                            </span>

                            {customer.phone}
                          </div>
                        )}

                        {customer.email && (
                          <div>
                            <span>
                              @
                            </span>

                            {customer.email}
                          </div>
                        )}

                      </div>

                      {customer.notes && (
                        <div className="customer-notes">

                          <span>
                            Note
                          </span>

                          <p>
                            {customer.notes}
                          </p>

                        </div>
                      )}

                    </article>
                  );
                }
              )}

            </div>
          )}

        </section>

      </main>

      {/* FORM MODAL */}
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

            <div className="customer-modal-header">

              <div>

                <span>
                  {editingId
                    ? "EDIT CUSTOMER"
                    : "NEW CUSTOMER"}
                </span>

                <h2>
                  {editingId
                    ? "Update customer"
                    : "Add customer"}
                </h2>

              </div>

              <button
                onClick={closeForm}
                disabled={saving}
              >
                ×
              </button>

            </div>

            <form
              onSubmit={saveCustomer}
              className="customer-form"
            >

              <div className="customer-form-group">

                <label>
                  Customer name *
                </label>

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

              <div className="customer-form-row">

                <div className="customer-form-group">

                  <label>
                    Phone
                  </label>

                  <input
                    type="tel"
                    placeholder="+92 300 1234567"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value)
                    }
                  />

                </div>

                <div className="customer-form-group">

                  <label>
                    Email
                  </label>

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

              <div className="customer-form-group">

                <label>
                  Notes
                </label>

                <textarea
                  placeholder="Add any useful information..."
                  rows="4"
                  value={notes}
                  onChange={(e) =>
                    setNotes(e.target.value)
                  }
                />

              </div>

              <div className="customer-form-actions">

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Save changes"
                    : "Add customer"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default Customers;

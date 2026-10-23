// src/components/ContactForm.jsx
// Form to add a contact (name, phone, relation).
//
// Props:
//   onAdd - async function that saves the contact. It receives
//           { name, phone, relation } and throws an error if saving fails.

import { useState } from "react";
import Loader from "./Loader";

const emptyForm = { name: "", phone: "", relation: "" };

// Check the form and return an object with error messages (empty = all good)
function validate(form) {
  const errors = {};

  if (form.name.trim().length < 2) {
    errors.name = "Please enter the contact's name.";
  }

  if (!/^\d{10}$/.test(form.phone)) {
    errors.phone = "Phone number must be exactly 10 digits.";
  }

  return errors;
}

export default function ContactForm({ onAdd }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({}); // errors for each field
  const [apiError, setApiError] = useState(""); // error message from backend
  const [loading, setLoading] = useState(false);

  // Update the form when the user types
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Phone: keep digits only
    const cleaned = name === "phone" ? value.replace(/\D/g, "") : value;
    setForm((prev) => ({ ...prev, [name]: cleaned }));
    // Clear the error of this field while typing
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Submit the form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    // Check the inputs first
    const newErrors = validate(form);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await onAdd({
        name: form.name.trim(),
        phone: form.phone,
        relation: form.relation.trim(),
      });
      setForm(emptyForm); // clear the form after saving
    } catch (err) {
      // Show the message sent by the backend
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {apiError && (
        <div className="alert alert-error" role="alert">
          {apiError}
        </div>
      )}

      {/* Name */}
      <div className="form-group">
        <label htmlFor="contact-name">Name</label>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="off"
          value={form.name}
          onChange={handleChange}
          className={errors.name ? "input-error" : ""}
          aria-invalid={errors.name ? "true" : "false"}
        />
        {errors.name && <div className="field-error">{errors.name}</div>}
      </div>

      {/* Phone */}
      <div className="form-group">
        <label htmlFor="contact-phone">Phone number</label>
        <input
          id="contact-phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          autoComplete="off"
          placeholder="10 digit mobile number"
          value={form.phone}
          onChange={handleChange}
          className={errors.phone ? "input-error" : ""}
          aria-invalid={errors.phone ? "true" : "false"}
        />
        {errors.phone && <div className="field-error">{errors.phone}</div>}
      </div>

      {/* Relation (optional) */}
      <div className="form-group">
        <label htmlFor="contact-relation">Relation (optional)</label>
        <input
          id="contact-relation"
          name="relation"
          type="text"
          list="relation-options"
          autoComplete="off"
          placeholder="For example: Mother, Friend"
          value={form.relation}
          onChange={handleChange}
        />
        <datalist id="relation-options">
          <option value="Mother" />
          <option value="Father" />
          <option value="Sister" />
          <option value="Brother" />
          <option value="Husband" />
          <option value="Friend" />
          <option value="Relative" />
        </datalist>
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-block"
        disabled={loading}
      >
        {loading ? <Loader small text="Saving..." /> : "Add contact"}
      </button>
    </form>
  );
}
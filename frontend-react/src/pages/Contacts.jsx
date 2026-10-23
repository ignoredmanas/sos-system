// src/pages/Contacts.jsx
// List, add and delete trusted contacts (maximum 5).

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import ContactForm from "../components/ContactForm";
import ContactList from "../components/ContactList";
import Loader from "../components/Loader";
import { addContact, deleteContact, getContacts } from "../services/api";
import "../styles/Contacts.css";

const MAX_CONTACTS = 5;

export default function Contacts() {
  const { user } = useAuth();

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(""); // error while loading the list
  const [error, setError] = useState(""); // error while deleting
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0); // change it to load the list again

  // Load the contacts when the page opens (and when Retry is pressed)
  useEffect(() => {
    let cancelled = false;

    getContacts(user.id)
      .then((data) => {
        if (cancelled) return;
        setContacts(data.contacts || []);
        setLoadError("");
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user.id, reloadKey]);

  // Retry button
  const handleRetry = () => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  };

  // Called by the form. If it throws, the form shows the error.
  const handleAdd = async ({ name, phone, relation }) => {
    setError("");
    setSuccess("");

    const body = { user_id: user.id, name, phone };
    if (relation) body.relation = relation; // relation is optional

    const data = await addContact(body);
    setContacts((prev) => [...prev, data.contact]);
    setSuccess(`${data.contact.name} was added to your contacts.`);
  };

  // Delete one contact
  const handleDelete = async (contactId) => {
    setError("");
    setSuccess("");
    setDeletingId(contactId);

    try {
      await deleteContact(contactId);
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
      setSuccess("Contact removed.");
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const limitReached = contacts.length >= MAX_CONTACTS;

  return (
    <>
      <Navbar />

      <main className="container">
        <div className="contacts-header">
          <h1>Trusted contacts</h1>
          {!loading && !loadError && (
            <span className="contacts-count">
              {contacts.length} of {MAX_CONTACTS}
            </span>
          )}
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Loading, error or the list */}
        {loading ? (
          <Loader text="Loading contacts..." />
        ) : loadError ? (
          <div className="alert alert-error" role="alert">
            {loadError}
            <div className="contacts-retry">
              <button type="button" className="btn btn-outline" onClick={handleRetry}>
                Try again
              </button>
            </div>
          </div>
        ) : (
          <>
            <ContactList
              contacts={contacts}
              onDelete={handleDelete}
              deletingId={deletingId}
            />

            {/* Add form, or a message when the limit is reached */}
            {limitReached ? (
              <div className="alert alert-info">
                You have reached the limit of {MAX_CONTACTS} contacts. Delete one
                to add a new contact.
              </div>
            ) : (
              <section className="card">
                <h2>Add a contact</h2>
                <ContactForm onAdd={handleAdd} />
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
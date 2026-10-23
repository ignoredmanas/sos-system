// src/components/ContactList.jsx
// Shows the saved contacts, each with a Delete button.
//
// Props:
//   contacts   - array of contacts
//   onDelete   - function that receives the contact id
//   deletingId - id of the contact that is being deleted right now (or null)

import Loader from "./Loader";
import "../styles/ContactList.css";

export default function ContactList({ contacts, onDelete, deletingId }) {
  // No contacts yet
  if (contacts.length === 0) {
    return (
      <div className="card text-center">
        <p className="text-muted mb-0">
          No contacts yet. Add your first trusted contact below.
        </p>
      </div>
    );
  }

  // Ask before deleting
  const handleDelete = (contact) => {
    if (window.confirm(`Remove ${contact.name} from your contacts?`)) {
      onDelete(contact.id);
    }
  };

  return (
    <ul className="contact-list">
      {contacts.map((contact) => (
        <li key={contact.id} className="card contact-item">
          <div className="contact-info">
            <div className="contact-name">{contact.name}</div>
            <div className="contact-phone">{contact.phone}</div>
            {contact.relation && (
              <span className="contact-relation">{contact.relation}</span>
            )}
          </div>

          <button
            type="button"
            className="btn btn-outline contact-delete"
            onClick={() => handleDelete(contact)}
            disabled={deletingId !== null}
            aria-label={`Delete ${contact.name}`}
          >
            {deletingId === contact.id ? <Loader small text="" /> : "Delete"}
          </button>
        </li>
      ))}
    </ul>
  );
}
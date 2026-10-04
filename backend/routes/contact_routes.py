from flask import Blueprint, request, jsonify
from extensions import db
from models.user import User
from models.contact import Contact

contact_bp = Blueprint("contacts", __name__, url_prefix="/api/contacts")

MAX_CONTACTS = 5


@contact_bp.route("", methods=["POST"])
def add_contact():
    data = request.get_json() or {}

    user_id = data.get("user_id")
    name = (data.get("name") or "").strip()
    phone = (data.get("phone") or "").strip()
    relation = (data.get("relation") or "").strip() or None

    if not user_id or not name or not phone:
        return jsonify({"error": "user_id, name and phone are required"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404

    if Contact.query.filter_by(user_id=user_id).count() >= MAX_CONTACTS:
        return jsonify({"error": f"maximum {MAX_CONTACTS} contacts allowed"}), 400

    if Contact.query.filter_by(user_id=user_id, phone=phone).first():
        return jsonify({"error": "contact already added"}), 409

    contact = Contact(user_id=user_id, name=name, phone=phone, relation=relation)
    db.session.add(contact)
    db.session.commit()

    return jsonify({"message": "contact added", "contact": contact.to_dict()}), 201


@contact_bp.route("/<int:user_id>", methods=["GET"])
def get_contacts(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404

    contacts = Contact.query.filter_by(user_id=user_id).all()
    return jsonify({"contacts": [c.to_dict() for c in contacts]}), 200


@contact_bp.route("/<int:contact_id>", methods=["DELETE"])
def delete_contact(contact_id):
    contact = Contact.query.get(contact_id)
    if not contact:
        return jsonify({"error": "contact not found"}), 404

    db.session.delete(contact)
    db.session.commit()

    return jsonify({"message": "contact deleted"}), 200
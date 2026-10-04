from flask import Blueprint, request, jsonify
from extensions import db
from models.user import User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}

    name = (data.get("name") or "").strip()
    phone = (data.get("phone") or "").strip()
    email = (data.get("email") or "").strip() or None
    password = data.get("password") or ""

    if not name or not phone or not password:
        return jsonify({"error": "name, phone and password are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "password must be at least 6 characters"}), 400

    if User.query.filter_by(phone=phone).first():
        return jsonify({"error": "phone already registered"}), 409

    if email and User.query.filter_by(email=email).first():
        return jsonify({"error": "email already registered"}), 409

    user = User(name=name, phone=phone, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "registered successfully", "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}

    phone = (data.get("phone") or "").strip()
    password = data.get("password") or ""

    if not phone or not password:
        return jsonify({"error": "phone and password are required"}), 400

    user = User.query.filter_by(phone=phone).first()

    if not user or not user.check_password(password):
        return jsonify({"error": "invalid phone or password"}), 401

    return jsonify({"message": "login successful", "user": user.to_dict()}), 200
from datetime import datetime
from flask import Blueprint, request, jsonify
from extensions import db
from models.user import User
from models.contact import Contact
from models.location import Location
from models.sos_event import SOSEvent

sos_bp = Blueprint("sos", __name__, url_prefix="/api/sos")


def build_message(user, latitude, longitude):
    if latitude is not None and longitude is not None:
        maps_link = f"https://www.google.com/maps?q={latitude},{longitude}"
        return f"SOS! {user.name} needs help. Live location: {maps_link}"
    return f"SOS! {user.name} needs help. Location unavailable."


@sos_bp.route("/trigger", methods=["POST"])
def trigger_sos():
    data = request.get_json() or {}

    user_id = data.get("user_id")
    latitude = data.get("latitude")
    longitude = data.get("longitude")

    if user_id is None:
        return jsonify({"error": "user_id is required"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404

    active_event = SOSEvent.query.filter_by(user_id=user_id, status="active").first()
    if active_event:
        return jsonify({
            "message": "an SOS is already active",
            "sos_event": active_event.to_dict(),
        }), 200

    if latitude is None or longitude is None:
        last_location = (
            Location.query.filter_by(user_id=user_id)
            .order_by(Location.created_at.desc(), Location.id.desc())
            .first()
        )
        if last_location:
            latitude = last_location.latitude
            longitude = last_location.longitude
    else:
        try:
            latitude = float(latitude)
            longitude = float(longitude)
        except (TypeError, ValueError):
            return jsonify({"error": "latitude and longitude must be numbers"}), 400

    message = build_message(user, latitude, longitude)

    event = SOSEvent(
        user_id=user_id,
        latitude=latitude,
        longitude=longitude,
        message=message,
        status="active",
    )
    db.session.add(event)
    db.session.commit()

    contacts = Contact.query.filter_by(user_id=user_id).all()

    return jsonify({
        "message": "SOS triggered",
        "sos_event": event.to_dict(),
        "contacts_to_notify": [c.to_dict() for c in contacts],
    }), 201


@sos_bp.route("/<int:event_id>/resolve", methods=["POST"])
def resolve_sos(event_id):
    event = SOSEvent.query.get(event_id)
    if not event:
        return jsonify({"error": "SOS event not found"}), 404

    if event.status != "active":
        return jsonify({"error": "SOS event is already closed"}), 400

    event.status = "resolved"
    event.resolved_at = datetime.utcnow()
    db.session.commit()

    return jsonify({"message": "SOS resolved", "sos_event": event.to_dict()}), 200


@sos_bp.route("/<int:user_id>/history", methods=["GET"])
def sos_history(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404

    events = (
        SOSEvent.query.filter_by(user_id=user_id)
        .order_by(SOSEvent.created_at.desc(), SOSEvent.id.desc())
        .all()
    )

    return jsonify({"sos_events": [e.to_dict() for e in events]}), 200
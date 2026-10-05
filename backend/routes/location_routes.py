from flask import Blueprint, request, jsonify
from extensions import db
from models.user import User
from models.location import Location

location_bp = Blueprint("location", __name__, url_prefix="/api/location")


@location_bp.route("", methods=["POST"])
def save_location():
    data = request.get_json() or {}

    user_id = data.get("user_id")
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    accuracy = data.get("accuracy")

    if user_id is None or latitude is None or longitude is None:
        return jsonify({"error": "user_id, latitude and longitude are required"}), 400

    try:
        latitude = float(latitude)
        longitude = float(longitude)
        accuracy = float(accuracy) if accuracy is not None else None
    except (TypeError, ValueError):
        return jsonify({"error": "latitude, longitude and accuracy must be numbers"}), 400

    if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
        return jsonify({"error": "invalid coordinates"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404

    location = Location(
        user_id=user_id,
        latitude=latitude,
        longitude=longitude,
        accuracy=accuracy,
    )
    db.session.add(location)
    db.session.commit()

    return jsonify({"message": "location saved", "location": location.to_dict()}), 201


@location_bp.route("/<int:user_id>/latest", methods=["GET"])
def get_latest_location(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404

    location = (
        Location.query.filter_by(user_id=user_id)
        .order_by(Location.created_at.desc(), Location.id.desc())
        .first()
    )
    if not location:
        return jsonify({"error": "no location found"}), 404

    return jsonify({"location": location.to_dict()}), 200


@location_bp.route("/<int:user_id>/history", methods=["GET"])
def get_location_history(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404

    limit = request.args.get("limit", default=50, type=int)
    limit = max(1, min(limit, 200))

    locations = (
        Location.query.filter_by(user_id=user_id)
        .order_by(Location.created_at.desc(), Location.id.desc())
        .limit(limit)
        .all()
    )

    return jsonify({"locations": [l.to_dict() for l in locations]}), 200
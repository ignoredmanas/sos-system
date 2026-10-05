from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from extensions import db


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)
    db.init_app(app)

    from models.user import User
    from models.contact import Contact
    from models.location import Location
    from routes.auth_routes import auth_bp
    from routes.contact_routes import contact_bp
    from routes.location_routes import location_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(contact_bp)
    app.register_blueprint(location_bp)

    @app.route("/")
    def home():
        return jsonify({"message": "SOS system backend is running"})

    with app.app_context():
        db.create_all()

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
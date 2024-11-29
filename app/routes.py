from flask import Blueprint, jsonify, request
from app.models import User
from app import db

main = Blueprint('main', __name__)

@main.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"}), 200

@main.route('/login', methods=['POST'])
def login():
    # Simple login endpoint that just returns 200 OK
    return jsonify({
        "message": "Login successful",
        "status": "success"
    }), 200

@main.errorhandler(404)
def not_found_error(error):
    return jsonify({"error": "Not found"}), 404

@main.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({"error": "Internal server error"}), 500
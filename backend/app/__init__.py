import os
from flask import Flask, jsonify, send_from_directory
from .config import Config
from .extensions import db, cors

def create_app(config_class=Config, test_config=None):
    app = Flask(__name__)
    app.config.from_object(config_class)

    if test_config:
        app.config.update(test_config)

    # Ensure uploads directory exists
    os.makedirs(app.config.get('UPLOAD_FOLDER', 'uploads'), exist_ok=True)

    # Initialize extensions
    db.init_app(app)
    cors.init_app(
        app,
        resources={r"/*": {"origins": "*"}},
        supports_credentials=True
    )

    # Register blueprints
    from .routes.locations import locations_bp
    from .routes.complaints import complaints_bp
    from .routes.tracking import tracking_bp
    from .routes.admin import admin_bp

    app.register_blueprint(locations_bp)
    app.register_blueprint(complaints_bp)
    app.register_blueprint(tracking_bp)
    app.register_blueprint(admin_bp)

    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "success": True,
            "service": "SmartFix Backend",
            "status": "healthy"
        }), 200

    # Serve uploaded images
    @app.route('/uploads/<path:filename>', methods=['GET'])
    def uploaded_file(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    # Global Error Handlers
    @app.errorhandler(400)
    def bad_request(err):
        return jsonify({"success": False, "error": "Bad Request", "message": str(err)}), 400

    @app.errorhandler(404)
    def not_found(err):
        return jsonify({"success": False, "error": "Endpoint or resource not found"}), 404

    @app.errorhandler(500)
    def server_error(err):
        return jsonify({"success": False, "error": "Internal Server Error", "message": str(err)}), 500

    return app

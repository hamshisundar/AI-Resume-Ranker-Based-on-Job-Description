"""CVFilter Flask application factory."""

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

from cvfilter.auth.routes import auth_bp
from cvfilter.config import apply_flask_config, cors_origins
from cvfilter.extensions import db, limiter
from cvfilter.routes.history import bp as history_bp
from cvfilter.routes.main import bp as main_bp
from cvfilter.routes.rank import bp as rank_bp
from cvfilter.services import ranking as rank_svc

load_dotenv()


def create_app() -> Flask:
    app = Flask(__name__, instance_relative_config=True)
    apply_flask_config(app)

    db.init_app(app)
    limiter.init_app(app)

    CORS(
        app,
        supports_credentials=True,
        origins=cors_origins(),
        allow_headers=["Content-Type", "X-CSRF-Token", "Authorization"],
        methods=["GET", "POST", "OPTIONS", "DELETE"],
    )

    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(rank_bp)
    app.register_blueprint(history_bp)

    with app.app_context():
        import cvfilter.models  # noqa: F401

        db.create_all()
        rank_svc.load_models()

    return app

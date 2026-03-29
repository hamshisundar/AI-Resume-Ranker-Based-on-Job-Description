"""WSGI entry for production (e.g. gunicorn wsgi:app)."""

from cvfilter import create_app

app = create_app()

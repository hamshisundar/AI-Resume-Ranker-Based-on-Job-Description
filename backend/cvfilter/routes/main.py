from flask import Blueprint, Response

bp = Blueprint("main", __name__)


@bp.get("/")
def root():
    html = """<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>Resume Ranker API</title></head>
<body style="font-family:system-ui,Segoe UI,sans-serif;max-width:40rem;margin:2rem auto;padding:1.25rem;line-height:1.5">
<h1 style="font-size:1.25rem">Flask API is running</h1>
<p>This URL is the <strong>backend only</strong>. The dashboard is served by Vite.</p>
<ol>
<li>Open a terminal in the <code>frontend</code> folder (next to <code>backend</code>).</li>
<li>Run <code>npm run dev</code>.</li>
<li>Open the <strong>localhost</strong> URL Vite prints (e.g. <code>http://localhost:5173</code>), <em>not</em> this API port.</li>
</ol>
<p><a href="/health">GET /health</a> (JSON)</p>
</body></html>"""
    return Response(html, mimetype="text/html")


@bp.get("/health")
def health():
    from flask import jsonify

    return jsonify({"status": "ok"})

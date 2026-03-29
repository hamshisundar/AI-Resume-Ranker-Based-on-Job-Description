"""Local development entrypoint: `python run.py` from the `backend/` directory."""

import os

from cvfilter import create_app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5050)), debug=True)

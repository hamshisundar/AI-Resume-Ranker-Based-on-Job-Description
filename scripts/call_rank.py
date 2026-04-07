#!/usr/bin/env python3
"""Call POST /rank and print JSON (requires a running Uvicorn server)."""

from __future__ import annotations

import argparse
import json
import sys

import httpx


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--base-url", default="http://127.0.0.1:8000", help="API base URL")
    args = p.parse_args()
    payload = {
        "jd": "Python developer with machine learning",
        "cvs": [
            "Python and ML engineer with AWS",
            "Sales and marketing background",
        ],
    }
    r = httpx.post(f"{args.base_url.rstrip('/')}/rank", json=payload, timeout=30.0)
    print(json.dumps(r.json(), indent=2))
    return 0 if r.is_success else 1


if __name__ == "__main__":
    sys.exit(main())

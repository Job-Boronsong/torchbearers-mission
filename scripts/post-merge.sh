#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export PIP_DISABLE_PIP_VERSION_CHECK=1

python -m pip install --no-input --disable-pip-version-check -r requirements.txt
npm ci --prefix frontend

python manage.py migrate --noinput --skip-checks
python manage.py collectstatic --noinput --skip-checks

npm run build --prefix frontend
CI=1 npm run test:e2e --prefix frontend

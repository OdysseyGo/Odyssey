#!/bin/sh
set -e

echo "Mode: $ENV_MODE | DB: $DB_HOST"

# 1. Always run migrations (Safe for all environments)
echo "Applying migrations..."
mkdir -p /staticfiles
python manage.py migrate --noinput
python manage.py collectstatic --noinput --clear

# 2. Start Server Logic
if [ "$ENV_MODE" = "production" ]; then
    echo "Starting Production Server (Guvicorn)..."
    exec gunicorn config.asgi:application -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --log-level debug
else
    echo "Starting Development Server (Runserver)..."
    exec python manage.py runserver 0.0.0.0:8000
fi

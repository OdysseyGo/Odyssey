#!/bin/sh
set -e

echo "Mode: $ENV_MODE | Seed: $INITIAL_SEED | DB: $DB_HOST"

# 1. Always run migrations (Safe for all environments)
echo "Applying migrations..."
mkdir -p /staticfiles
python manage.py migrate --noinput
python manage.py collectstatic --noinput --clear

# 2. Conditional Seeding
if [ "$INITIAL_SEED" = "True" ]; then
    echo "Checking if local seeding is required..."
    # Check if a specific table exists or has data
    TOUR_COUNT=$(PGPASSWORD=$POSTGRES_PASSWORD psql -h $DB_HOST -U $POSTGRES_USER -d $POSTGRES_DB -t -c "SELECT COUNT(*) FROM tours_tour;" 2>/dev/null | xargs || echo 0)
    
    if [ "$TOUR_COUNT" = "0" ]; then
        echo "Database empty. Seeding from schema.sql..."
        PGPASSWORD=$POSTGRES_PASSWORD psql -h $DB_HOST -U $POSTGRES_USER -d $POSTGRES_DB -f /app/schema.sql
    else
        echo "Data already exists ($TOUR_COUNT tours). Skipping seed."
    fi
else
    echo "Skipping seeding (INITIAL_SEED is False or not set)."
fi

# 3. Start Server Logic
if [ "$ENV_MODE" = "production" ]; then
    echo "Starting Production Server (Guvicorn)..."
    exec gunicorn config.asgi:application -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --log-level debug
else
    echo "Starting Development Server (Runserver)..."
    exec python manage.py runserver 0.0.0.0:8000
fi
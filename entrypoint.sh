#!/bin/sh

echo "Waiting for PostgreSQL..."
until pg_isready -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER"; do
  >&2 echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is up - continuing..."

echo "Running migrations..."
npm run migrate:deploy

echo "Seeding database..."
npm run seed

exec "$@"

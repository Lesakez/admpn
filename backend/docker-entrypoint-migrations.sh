#!/bin/sh
set -e

echo "🔄 Waiting for MySQL to be ready..."
wait-port mysql:3306 -t 60000

echo "🔄 Waiting additional 10 seconds for MySQL to fully initialize..."
sleep 10

echo "🚀 Running database migrations..."
node migrate.js

echo "✅ Migrations completed successfully!"
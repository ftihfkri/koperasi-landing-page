#!/bin/sh
# Note: no `set -e` — we want nginx to start even if migrations fail,
# so healthchecks can succeed and we can see the error in the browser.

echo "[start.sh] === Boot $(date) ==="
echo "[start.sh] PORT=$PORT"
echo "[start.sh] DB_HOST=$DB_HOST"
echo "[start.sh] DB_DATABASE=$DB_DATABASE"
echo "[start.sh] APP_KEY is $([ -n "$APP_KEY" ] && echo SET || echo MISSING)"

cd /var/www/html

# Only seed .env from example when running locally (no Railway DB_HOST env var).
# In production, Laravel reads env vars directly from the container environment.
# Copying .env.example would clobber Railway's DB_HOST/DB_USERNAME/etc with localhost defaults.
if [ ! -f .env ] && [ -z "$DB_HOST" ]; then
  echo "[start.sh] No DB_HOST env var detected — seeding .env from .env.example (local mode)"
  cp .env.example .env
fi

# Artisan needs *some* .env file to exist, even if empty (it falls back to $_ENV).
if [ ! -f .env ]; then
  touch .env
fi

# Generate app key if missing — non-fatal
if [ -z "$APP_KEY" ]; then
  php artisan key:generate --force || echo "[start.sh] WARN: key:generate failed"
fi

# Cache config so Laravel reads env vars once at boot
php artisan config:cache || echo "[start.sh] WARN: config:cache failed"

# Run migrations — non-fatal. If DB isn't reachable yet, log it but keep going
# so nginx can start and the healthcheck can pass. The error page will show
# the actual DB connection problem, which is much easier to debug than
# "service unavailable".
php artisan migrate --force || echo "[start.sh] WARN: migrations failed — check DB env vars in Railway"

# Persistent storage prep.
# A Railway volume mounted at storage/app/public starts empty and
# root-owned, shadowing the build-time chown. Recreate the upload dirs
# and hand them to www-data (php-fpm) so uploads don't fail with EACCES.
mkdir -p storage/app/public/avatars storage/app/public/announcements
chown -R www-data:www-data storage bootstrap/cache || echo "[start.sh] WARN: chown storage failed"
chmod -R 775 storage bootstrap/cache || echo "[start.sh] WARN: chmod storage failed"
php artisan storage:link || echo "[start.sh] WARN: storage:link failed (served via PHP route anyway)"

# Volume mount diagnostic — grep the deploy logs for "[storage-check]" to
# see whether storage/app/public is backed by a real Railway volume or
# the ephemeral container filesystem.
echo "[storage-check] === Persistent storage status ==="
if mountpoint -q storage/app/public 2>/dev/null; then
  echo "[storage-check] storage/app/public IS a mountpoint — volume attached"
else
  echo "[storage-check] storage/app/public is NOT a mountpoint — files will VANISH on next deploy"
  echo "[storage-check] Attach a Railway volume to /var/www/html/storage/app/public"
fi
echo "[storage-check] Existing files in avatars/:       $(find storage/app/public/avatars -type f 2>/dev/null | wc -l)"
echo "[storage-check] Existing files in announcements/: $(find storage/app/public/announcements -type f 2>/dev/null | wc -l)"
df -h storage/app/public 2>/dev/null | sed 's/^/[storage-check] /' || true

# Substitute PORT into nginx config (default to 8080 if not set)
export PORT="${PORT:-8080}"
envsubst '$PORT' < /etc/nginx/http.d/default.conf.template > /etc/nginx/http.d/default.conf

# Start services (this is the foreground process — must run last)
exec /usr/bin/supervisord -n -c /etc/supervisor/conf.d/supervisord.conf

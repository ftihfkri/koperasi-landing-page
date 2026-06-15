FROM php:8.2-fpm-alpine AS base

RUN apk add --no-cache \
    git curl zip unzip \
    libpng-dev libjpeg-turbo-dev libwebp-dev libpq-dev \
    nginx supervisor nodejs npm gettext

RUN docker-php-ext-configure gd --with-jpeg --with-webp \
    && docker-php-ext-install pdo_mysql pdo_pgsql gd bcmath opcache

# Raise PHP upload limits (stock image defaults to 2M and silently
# rejects phone photos before Laravel validation runs).
COPY docker/php-uploads.ini /usr/local/etc/php/conf.d/zz-uploads.ini

# Move PHP-FPM off port 9000 (where Railway auto-detected from base image EXPOSE)
# to port 9001 internal-only. nginx will own the public port via $PORT.
RUN echo "[www]" > /usr/local/etc/php-fpm.d/zzz-port.conf \
    && echo "listen = 127.0.0.1:9001" >> /usr/local/etc/php-fpm.d/zzz-port.conf

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

RUN composer run-script post-autoload-dump || true \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache \
    && php artisan storage:link || true

COPY docker/nginx.conf /etc/nginx/http.d/default.conf.template
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

# Tell Railway to use port 8080 for the public-facing nginx (overrides the
# inherited EXPOSE 9000 from the php-fpm base image, which is PHP-FPM internal).
EXPOSE 8080

CMD ["/start.sh"]

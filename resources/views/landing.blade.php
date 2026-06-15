<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- SEO Meta Tags -->
    <title>Koperasi Kakitangan Sabah Softwoods</title>
    <meta name="description" content="" />
    <meta name="keywords" content="" />
    <meta name="robots" content="index, follow" />
    <meta name="theme-color" content="#141414" />

    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
    <link rel="icon" type="image/png" sizes="32x32" href="{{ asset('favicon-32x32.png') }}">
    <link rel="icon" type="image/png" sizes="16x16" href="{{ asset('favicon-16x16.png') }}">
    <link rel="apple-touch-icon" sizes="180x180" href="{{ asset('apple-touch-icon.png') }}">

    <!-- Landing Page assets (built by the project's Vite alongside the dashboards) -->
    @viteReactRefresh
    @vite(['resources/css/landing.css', 'resources/js/landing.tsx'])
  </head>
  <body>
    {{-- data-basename lets React Router work both at the root domain and under a
         Laravel sub-path (e.g. /koperasi-kakitangan/public). --}}
    <div id="root" data-basename="{{ parse_url(url('/'), PHP_URL_PATH) ?: '/' }}"></div>
  </body>
</html>

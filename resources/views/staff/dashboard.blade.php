<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Staff Dashboard – Koperasi Sabah Softwoods</title>
    @include('partials.favicon')
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/staff-dashboard.tsx'])
</head>
<body style="margin:0;padding:0;background:#f5faf4;">
    <script>
        window.LaravelCsrfToken = '{{ csrf_token() }}';
        window.LogoutUrl = '{{ route('logout') }}';
        window.AppBase   = '{{ rtrim(url(''), '/') }}';
        window.AuthUser = {
            id: {{ auth()->id() }},
            name: '{{ addslashes(auth()->user()->full_name ?? auth()->user()->name) }}',
            role: '{{ auth()->user()->role }}',
            member_id: '{{ auth()->user()->shareholder_id }}',
        };
    </script>
    <div id="staff-dashboard-root"></div>
</body>
</html>

<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'KOP-SSB') }}</title>

        @include('partials.favicon')

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=outfit:300,400,500,600,700|playfair+display:400,600,700&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @vite(['resources/css/app.css', 'resources/js/app.js'])

        <style>
            :root{
                --primary: oklch(0.36 0.10 145);
                --primary-glow: oklch(0.58 0.16 145);
                --leaf-deep:  oklch(0.32 0.10 145);
                --leaf:       oklch(0.52 0.14 145);
                --leaf-light: oklch(0.86 0.08 145);
                --leaf-wash:  oklch(0.96 0.03 145);
                --emerald-deep: oklch(0.22 0.06 150);
                --emerald-mid:  oklch(0.30 0.08 145);
            }
            *,*::before,*::after{box-sizing:border-box}
            html,body{margin:0;padding:0}
            body.luxe{
                min-height:100vh;
                font-family:'Outfit',system-ui,sans-serif;
                color:var(--leaf-deep);
                background:var(--leaf-wash);
            }
            .bg-luxe{
                position:fixed;inset:0;z-index:-3;
                background:
                    radial-gradient(ellipse at 18% 4%, oklch(0.94 0.06 145) 0%, transparent 55%),
                    radial-gradient(ellipse at 82% 96%, oklch(0.92 0.07 140) 0%, transparent 55%),
                    linear-gradient(160deg, oklch(0.97 0.03 145) 0%, oklch(0.93 0.05 145) 100%);
            }
            .glow{position:fixed;border-radius:50%;filter:blur(120px);pointer-events:none;z-index:-2;opacity:.45}
            .glow.g1{width:520px;height:520px;top:-160px;left:-160px;background:var(--leaf)}
            .glow.g2{width:480px;height:480px;bottom:-160px;right:-180px;background:var(--leaf-light);opacity:.55}

            .dotgrid{
                position:fixed;inset:0;z-index:-1;pointer-events:none;opacity:.22;
                background-image:radial-gradient(oklch(0.45 0.12 145 / 0.55) 1px, transparent 1px);
                background-size:22px 22px;
            }

            /* ── Petal silhouettes scattered around the card ─────────── */
            .petal{position:fixed;pointer-events:none;z-index:-1;color:var(--leaf);opacity:.11}
            .petal.p1{top:-40px;right:-30px;width:340px;transform:rotate(28deg)}
            .petal.p2{bottom:-60px;left:-40px;width:380px;transform:rotate(-18deg);opacity:.10}
            .petal.p3{top:42%;left:-90px;width:240px;transform:rotate(72deg);opacity:.09;color:var(--leaf-deep)}
            .petal.p4{top:8%;left:18%;width:180px;transform:rotate(-42deg);opacity:.08}
            .petal.p5{bottom:14%;right:6%;width:220px;transform:rotate(108deg);opacity:.10;color:var(--leaf-deep)}

            .shell{
                min-height:100vh;
                display:flex;flex-direction:column;align-items:center;justify-content:center;
                padding:48px 20px 80px;position:relative;
            }
            .logo-block{display:flex;flex-direction:column;align-items:center;margin-bottom:28px;animation:fade-in .6s ease both}
            .logo-card{
                position:relative;width:112px;height:112px;border-radius:24px;
                background:#fff;padding:12px;
                display:flex;align-items:center;justify-content:center;
                box-shadow:0 20px 50px -20px rgba(45,106,45,.35);
            }
            .logo-card::before{
                content:'';position:absolute;inset:-18px;border-radius:32px;z-index:-1;
                background:radial-gradient(circle, var(--leaf) 0%, transparent 70%);
                opacity:.30;filter:blur(20px);
            }
            .logo-card img{max-width:100%;max-height:100%;object-fit:contain;border-radius:14px}
            .logo-caption{
                margin-top:18px;
                font-size:11px;letter-spacing:.32em;font-weight:600;
                text-transform:uppercase;color:var(--leaf-deep);
                font-family:'JetBrains Mono','Outfit',monospace;
            }

            .glass{
                width:100%;max-width:440px;
                background:rgba(255,255,255,.72);
                border:1px solid rgba(45,106,45,.14);
                border-radius:24px;
                backdrop-filter:blur(18px) saturate(140%);
                -webkit-backdrop-filter:blur(18px) saturate(140%);
                box-shadow:
                    0 30px 80px -20px rgba(45,106,45,.25),
                    0 0 0 1px rgba(255,255,255,.5) inset,
                    0 30px 80px -40px var(--leaf);
                padding:36px 32px;
                animation:scale-in .55s cubic-bezier(.2,.9,.3,1.2) both;
            }
            .glass h1{
                font-family:'Playfair Display',serif;
                font-size:30px;font-weight:600;color:var(--leaf-deep);margin:0 0 6px;
                letter-spacing:-.5px;
            }
            .glass .sub{font-size:13px;color:rgba(26,46,26,.65);margin-bottom:18px}
            .hairline{height:1px;background:linear-gradient(90deg, transparent, rgba(45,106,45,.30), transparent);margin:0 0 22px}

            .field{margin-bottom:16px}
            .field label, .luxe-label{
                display:block;font-size:11px;font-weight:600;
                letter-spacing:.18em;text-transform:uppercase;
                color:rgba(26,46,26,.72);margin-bottom:8px;font-family:'JetBrains Mono','Outfit',monospace;
            }
            .field-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
            .field-row a{font-size:11px;color:var(--leaf-deep);text-decoration:none;letter-spacing:.05em;font-weight:600}
            .field-row a:hover{color:var(--leaf);text-decoration:underline}

            .luxe-input{
                width:100%;height:46px;
                background:rgba(255,255,255,.85);
                border:1px solid rgba(45,106,45,.20);
                border-radius:12px;
                padding:0 14px;
                color:var(--leaf-deep);font-size:14px;font-family:'Outfit',sans-serif;
                outline:none;transition:all .2s;
            }
            .luxe-input::placeholder{color:rgba(26,46,26,.42)}
            .luxe-input:focus{border-color:var(--leaf);background:#ffffff;box-shadow:0 0 0 3px oklch(0.58 0.16 145 / .18)}
            .luxe-input.error{border-color:#d04848}

            .luxe-error{font-size:12px;color:#c43030;margin-top:6px;display:block}
            .luxe-error p{margin:2px 0}

            .luxe-check{
                display:flex;align-items:center;gap:10px;font-size:13px;color:rgba(26,46,26,.85);
                cursor:pointer;user-select:none;margin:8px 0 22px;
            }
            .luxe-check input{
                width:18px;height:18px;border-radius:5px;
                accent-color:var(--leaf);cursor:pointer;
            }

            .luxe-btn{
                display:flex;align-items:center;justify-content:center;gap:10px;
                width:100%;height:48px;border:none;border-radius:12px;
                font-family:'Outfit',sans-serif;font-size:14px;font-weight:600;letter-spacing:.02em;
                cursor:pointer;color:#fff;text-decoration:none;
                background:linear-gradient(135deg, var(--leaf-deep) 0%, var(--leaf) 50%, var(--leaf-light) 100%);
                background-size:200% 200%;background-position:0% 50%;
                box-shadow:0 18px 40px -12px rgba(45,106,45,.45), 0 4px 12px rgba(45,106,45,.18);
                transition:background-position .35s ease, transform .15s ease, box-shadow .2s ease;
            }
            .luxe-btn:hover{background-position:100% 50%;box-shadow:0 22px 48px -10px rgba(45,106,45,.55)}
            .luxe-btn:active{transform:translateY(1px)}
            .luxe-btn.outline{
                background:#fff;color:var(--leaf-deep);
                border:1px solid rgba(45,106,45,.22);
                box-shadow:0 8px 20px -6px rgba(45,106,45,.18);
            }
            .luxe-btn.outline:hover{background:oklch(0.97 0.03 145)}

            .divider{display:flex;align-items:center;gap:12px;margin:20px 0 16px}
            .divider::before, .divider::after{content:'';flex:1;height:1px;background:rgba(45,106,45,.18)}
            .divider span{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:rgba(26,46,26,.6);font-family:'JetBrains Mono','Outfit',monospace}

            .footer-link{display:block;text-align:center;margin-top:20px;font-size:13px;color:rgba(26,46,26,.72);text-decoration:none}
            .footer-link a, .footer-link strong{color:var(--leaf-deep);font-weight:600;margin-left:4px}
            .footer-link:hover a{color:var(--leaf);text-decoration:underline}

            .alert{
                padding:12px 14px;border-radius:12px;font-size:12.5px;line-height:1.55;
                margin-bottom:18px;display:flex;gap:10px;align-items:flex-start;
                border:1px solid rgba(45,106,45,.15);
            }
            .alert.info{background:rgba(45,106,45,.06);color:rgba(26,46,26,.9)}
            .alert.success{background:oklch(0.92 0.05 150 / .6);border-color:oklch(0.58 0.16 145 / .4);color:#1a4a1a}
            .alert.warn{background:oklch(0.95 0.08 70 / .6);border-color:oklch(0.65 0.17 70 / .5);color:#7a4a10}
            .alert.danger{background:oklch(0.93 0.06 25 / .55);border-color:oklch(0.65 0.20 25 / .45);color:#8a2020}

            .page-footer{
                position:fixed;bottom:18px;left:0;right:0;text-align:center;
                font-size:10px;letter-spacing:.32em;text-transform:uppercase;
                color:var(--leaf-deep);opacity:.7;font-family:'JetBrains Mono','Outfit',monospace;
                pointer-events:none;z-index:1;
            }

            @keyframes fade-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
            @keyframes scale-in{from{opacity:0;transform:scale(.96) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}

            /* Hide stray Tailwind/Breeze hairlines on existing label/input components */
            .glass .block.font-medium.text-sm.text-gray-700{
                font-size:11px !important;font-weight:600 !important;letter-spacing:.18em !important;
                text-transform:uppercase !important;color:rgba(26,46,26,.72) !important;
                font-family:'JetBrains Mono','Outfit',monospace !important;
            }

            /* Responsive */
            @media (max-width:640px){
                .shell{padding:32px 16px 70px}
                .glass{padding:28px 22px;border-radius:20px}
                .glass h1{font-size:26px}
                .logo-card{width:96px;height:96px;border-radius:20px}
                .glow.g1{width:360px;height:360px}
                .glow.g2{width:340px;height:340px}
                .petal.p1{width:240px}
                .petal.p2{width:260px}
                .petal.p3{display:none}
                .petal.p4{width:130px}
                .petal.p5{width:160px}
                .page-footer{font-size:9px;letter-spacing:.25em}
            }
        </style>
    </head>
    <body class="luxe antialiased">
        <div class="bg-luxe"></div>
        <div class="glow g1"></div>
        <div class="glow g2"></div>
        <div class="dotgrid"></div>

        {{-- Soft petal silhouettes scattered behind the card --}}
        <svg class="petal p1" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
            <path d="M50 8 C28 28, 28 62, 50 92 C72 62, 72 28, 50 8 Z"/>
        </svg>
        <svg class="petal p2" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
            <path d="M50 8 C28 28, 28 62, 50 92 C72 62, 72 28, 50 8 Z"/>
        </svg>
        <svg class="petal p3" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
            <path d="M50 8 C28 28, 28 62, 50 92 C72 62, 72 28, 50 8 Z"/>
        </svg>
        <svg class="petal p4" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
            <path d="M50 8 C28 28, 28 62, 50 92 C72 62, 72 28, 50 8 Z"/>
        </svg>
        <svg class="petal p5" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
            <path d="M50 8 C28 28, 28 62, 50 92 C72 62, 72 28, 50 8 Z"/>
        </svg>

        <div class="shell">
            <div class="logo-block">
                <div class="logo-card">
                    <img src="{{ asset('logo-kopssb.jpeg') }}" alt="KOP-SSB" />
                </div>
                <div class="logo-caption">KOP-SSB · Shareholders Portal</div>
            </div>

            <div class="glass">
                {{ $slot }}
            </div>
        </div>

        <div class="page-footer">Koperasi Kakitangan Sabah Softwoods Berhad</div>
    </body>
</html>

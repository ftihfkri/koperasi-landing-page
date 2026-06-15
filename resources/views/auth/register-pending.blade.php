<x-guest-layout>
    <h1>Registration Submitted</h1>
    <p class="sub">Your account is awaiting staff verification</p>
    <div class="hairline"></div>

    <div class="alert success">
        <span>✅</span>
        <span>
            <strong>Account created successfully.</strong><br>
            Your account is now <strong>pending verification</strong> by our staff. Once approved, you'll be able to log in and access your deposit dashboard.
        </span>
    </div>

    @if(session('shareholder_id') || session('name'))
        <div style="background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:14px 16px;margin-bottom:18px;">
            <div class="luxe-label" style="margin-bottom:8px">Your Account Details</div>
            @if(session('name'))
                <div style="font-size:13.5px;color:#fff;margin-bottom:6px;">
                    <span style="color:rgba(255,255,255,.6);font-size:12px;">Name:</span>
                    <strong>{{ session('name') }}</strong>
                </div>
            @endif
            @if(session('shareholder_id'))
                <div style="font-size:13.5px;color:#fff;">
                    <span style="color:rgba(255,255,255,.6);font-size:12px;">Shareholder ID:</span>
                    <span style="font-family:'JetBrains Mono',monospace;color:var(--leaf-light);font-weight:600;letter-spacing:.05em">{{ session('shareholder_id') }}</span>
                </div>
            @endif
        </div>
    @endif

    <div class="luxe-label" style="margin-bottom:12px">What happens next?</div>
    <div style="margin-bottom:24px">
        @foreach([
            ['1', 'Staff reviews your registration'],
            ['2', 'Your account is verified and activated'],
            ['3', 'You can log in and view your deposit dashboard'],
        ] as [$num, $step])
            <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08);">
                <div style="width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--primary-glow));color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:'JetBrains Mono',monospace;">{{ $num }}</div>
                <div style="font-size:13px;color:rgba(255,255,255,.85)">{{ $step }}</div>
            </div>
        @endforeach
    </div>

    <a href="{{ route('login') }}" class="luxe-btn">← Back to Login</a>
</x-guest-layout>

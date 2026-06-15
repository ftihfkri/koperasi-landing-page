<x-guest-layout>
    <h1>Login</h1>
    <p class="sub">Koperasi Kakitangan Sabah Softwoods Berhad</p>
    <div class="hairline"></div>

    @if (session('status'))
        <div class="alert success">{{ session('status') }}</div>
    @endif

    @if (request('expired'))
        <div class="alert warn">⚠️ Your session expired. Please log in again to continue.</div>
    @endif

    @if ($errors->has('login'))
        <div class="alert warn">⚠️ {{ $errors->first('login') }}</div>
    @endif

    <form method="POST" action="{{ route('login') }}" novalidate>
        @csrf

        <div class="field">
            <label for="login">Email or Shareholder ID</label>
            <input id="login" name="login" type="text" required autofocus
                   class="luxe-input {{ $errors->has('email') ? 'error' : '' }}"
                   value="{{ old('login') }}"
                   placeholder="you@email.com or K001" />
            @if ($errors->has('email'))
                <span class="luxe-error">{{ $errors->first('email') }}</span>
            @endif
        </div>

        <div class="field">
            <div class="field-row">
                <label for="password" style="margin-bottom:0">Password</label>
                <a href="{{ route('password.request') }}">Forgot password?</a>
            </div>
            <input id="password" name="password" type="password" required autocomplete="current-password"
                   class="luxe-input {{ $errors->has('password') ? 'error' : '' }}"
                   placeholder="Enter your password" />
            @if ($errors->has('password'))
                <span class="luxe-error">{{ $errors->first('password') }}</span>
            @endif
        </div>

        <label class="luxe-check">
            <input id="remember_me" type="checkbox" name="remember">
            <span>Remember me</span>
        </label>

        <button type="submit" class="luxe-btn">Log in</button>
    </form>

    <div class="divider"><span>or continue with</span></div>

    <a href="{{ route('auth.google') }}" class="luxe-btn outline">
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.4 33.1 29.8 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l6-6C34.4 6.5 29.5 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5c11 0 20.5-8 20.5-20.5 0-1.4-.1-2.7-.5-5z"/>
            <path fill="#34A853" d="M6.3 14.7l7 5.1C15 16.2 19.1 13.5 24 13.5c3 0 5.7 1.1 7.8 2.9l6-6C34.4 6.5 29.5 4.5 24 4.5c-7.7 0-14.3 4.4-17.7 10.2z"/>
            <path fill="#FBBC05" d="M24 45.5c5.4 0 10.2-1.8 14-4.9l-6.5-5.3C29.6 36.8 26.9 37.5 24 37.5c-5.7 0-10.5-3.8-12.2-9l-7 5.4C8 40.8 15.4 45.5 24 45.5z"/>
            <path fill="#EA4335" d="M44.5 20H24v8.5h11.7c-.9 2.5-2.6 4.6-4.8 6l6.5 5.3c3.8-3.5 6.1-8.7 6.1-14.8 0-1.4-.1-2.7-.5-5z"/>
        </svg>
        Sign in with Google
    </a>

    <div class="footer-link">
        Don't have an account?<a href="{{ route('register') }}">Register</a>
    </div>
</x-guest-layout>

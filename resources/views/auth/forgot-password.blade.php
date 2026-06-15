<x-guest-layout>
    <h1>Forgot Password</h1>
    <p class="sub">We'll email you a link to reset it</p>
    <div class="hairline"></div>

    <div class="alert info">
        <span>📧</span>
        <span>Enter your email address and we'll send you a link to reset your password.</span>
    </div>

    @if (session('status'))
        <div class="alert success">{{ session('status') }}</div>
    @endif

    @if ($errors->any())
        <div class="alert danger">
            @foreach ($errors->all() as $error)
                <p>{{ $error }}</p>
            @endforeach
        </div>
    @endif

    <form method="POST" action="{{ route('password.email') }}" novalidate>
        @csrf

        <div class="field">
            <label for="email">Email</label>
            <input id="email" name="email" type="email" required autofocus
                   class="luxe-input" value="{{ old('email') }}"
                   placeholder="you@email.com" />
        </div>

        <button type="submit" class="luxe-btn">Send Reset Link</button>
    </form>

    <div class="footer-link">
        Remembered it?<a href="{{ route('login') }}">Back to Login</a>
    </div>
</x-guest-layout>

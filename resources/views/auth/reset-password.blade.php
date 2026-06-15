<x-guest-layout>
    <h1>Reset Password</h1>
    <p class="sub">Choose a new password for your account</p>
    <div class="hairline"></div>

    @if ($errors->any())
        <div class="alert danger">
            @foreach ($errors->all() as $error)
                <p>{{ $error }}</p>
            @endforeach
        </div>
    @endif

    <form method="POST" action="{{ route('password.store') }}" novalidate>
        @csrf
        <input type="hidden" name="token" value="{{ $request->route('token') }}">

        <div class="field">
            <label for="email">Email</label>
            <input id="email" name="email" type="email" required autofocus autocomplete="username"
                   class="luxe-input"
                   value="{{ old('email', $request->email) }}"
                   placeholder="you@email.com" />
        </div>

        <div class="field">
            <label for="password">New Password</label>
            <input id="password" name="password" type="password" required autocomplete="new-password"
                   class="luxe-input" placeholder="Min 8 characters" />
        </div>

        <div class="field">
            <label for="password_confirmation">Confirm Password</label>
            <input id="password_confirmation" name="password_confirmation" type="password" required autocomplete="new-password"
                   class="luxe-input" placeholder="Repeat your new password" />
        </div>

        <button type="submit" class="luxe-btn">Reset Password</button>
    </form>

    <div class="footer-link">
        <a href="{{ route('login') }}">← Back to Login</a>
    </div>
</x-guest-layout>

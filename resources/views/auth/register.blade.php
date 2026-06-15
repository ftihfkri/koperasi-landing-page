<x-guest-layout>
    <h1>Register</h1>
    <p class="sub">Create your Koperasi Sabah Softwoods account</p>
    <div class="hairline"></div>

    <div class="alert info">
        <span>ℹ️</span>
        <span>After registering, your account will be <strong>reviewed by staff</strong> before you can log in.</span>
    </div>

    @if ($errors->any())
        <div class="alert danger">
            @foreach ($errors->all() as $error)
                <p>{{ $error }}</p>
            @endforeach
        </div>
    @endif

    <form method="POST" action="{{ route('register') }}" novalidate>
        @csrf

        <div class="field">
            <label for="shareholder_id">Shareholder ID</label>
            <input id="shareholder_id" name="shareholder_id" type="text" required autofocus
                   class="luxe-input" value="{{ old('shareholder_id') }}"
                   placeholder="e.g. K001" />
        </div>

        <div class="field">
            <label for="full_name">Full Name</label>
            <input id="full_name" name="full_name" type="text" required
                   class="luxe-input" value="{{ old('full_name') }}"
                   placeholder="Your full name" />
        </div>

        <div class="field">
            <label for="email">Email</label>
            <input id="email" name="email" type="email" required
                   class="luxe-input" value="{{ old('email') }}"
                   placeholder="you@email.com" />
        </div>

        <div class="field">
            <label for="phone_number">Phone Number</label>
            <input id="phone_number" name="phone_number" type="tel"
                   class="luxe-input" value="{{ old('phone_number') }}"
                   placeholder="e.g. 011-12345678" />
        </div>

        <div class="field">
            <label for="password">Password</label>
            <input id="password" name="password" type="password" required autocomplete="new-password"
                   class="luxe-input" placeholder="Min 8 characters" />
        </div>

        <div class="field">
            <label for="password_confirmation">Confirm Password</label>
            <input id="password_confirmation" name="password_confirmation" type="password" required autocomplete="new-password"
                   class="luxe-input" placeholder="Repeat your password" />
        </div>

        <button type="submit" class="luxe-btn" style="margin-top:8px">Create Account</button>
    </form>

    <div class="footer-link">
        Already registered?<a href="{{ route('login') }}">Login</a>
    </div>
</x-guest-layout>

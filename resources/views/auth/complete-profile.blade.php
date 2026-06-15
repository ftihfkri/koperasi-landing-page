<x-guest-layout>
    <h1>Complete Your Profile</h1>
    <p class="sub">Your Google account is connected. Please fill in the remaining details.</p>
    <div class="hairline"></div>

    @if ($errors->any())
        <div class="alert danger">
            @foreach ($errors->all() as $error)
                <p>{{ $error }}</p>
            @endforeach
        </div>
    @endif

    <form method="POST" action="{{ route('profile.complete.save') }}" novalidate>
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
                   class="luxe-input"
                   value="{{ old('full_name', Auth::user()?->full_name ?? Auth::user()?->name) }}"
                   placeholder="Your full name" />
        </div>

        <div class="field">
            <label for="phone_number">Phone Number</label>
            <input id="phone_number" name="phone_number" type="tel"
                   class="luxe-input" value="{{ old('phone_number') }}"
                   placeholder="e.g. 011-12345678" />
        </div>

        <button type="submit" class="luxe-btn" style="margin-top:8px">Save and Continue</button>
    </form>
</x-guest-layout>

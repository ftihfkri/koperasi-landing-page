<x-guest-layout>
    <div class="text-center mb-6">
        <div style="width:80px;height:80px;background:{{ $alreadyMarked ? '#c9a028' : '#2d6a2d' }};border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:38px;">
            {{ $alreadyMarked ? 'ℹ️' : '✅' }}
        </div>
        <h1 class="text-2xl font-bold text-gray-800">
            {{ $alreadyMarked ? 'Sudah Direkodkan' : 'Kehadiran Direkodkan!' }}
        </h1>
        <p class="text-sm text-gray-500 mt-1">{{ $meeting->title }}</p>
    </div>

    <div style="background:#e8f5e4;border:1px solid #c5d6c3;border-radius:10px;padding:16px 18px;margin-bottom:18px;">
        <div style="font-size:14px;color:#2d6a2d;font-weight:600;margin-bottom:10px;">
            👤 {{ $user->full_name ?? $user->name }}
        </div>
        <div style="font-size:12px;color:#4a6a4a;line-height:1.7;">
            <strong>Shareholder ID:</strong> {{ $user->shareholder_id ?? '—' }}<br>
            <strong>Direkodkan:</strong> {{ \Carbon\Carbon::parse($scannedAt)->format('d M Y · H:i') }}
        </div>
    </div>

    <div style="background:#f5faf4;border:1px solid #c5d6c3;border-radius:10px;padding:14px 18px;margin-bottom:20px;">
        <div style="font-size:11px;color:#7a9a7a;font-family:monospace;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Mesyuarat</div>
        <div style="font-size:13px;color:#1a2e1a;line-height:1.6;">
            <strong>{{ $meeting->title }}</strong><br>
            📅 {{ $meeting->scheduled_at->format('d M Y · H:i') }}
            @if($meeting->location)
                <br>📍 {{ $meeting->location }}
            @endif
        </div>
    </div>

    @if($alreadyMarked)
    <div style="background:#fff8e1;border:1px solid #c9a028;border-radius:8px;padding:10px 14px;margin-bottom:18px;font-size:12px;color:#7a5a00;">
        Anda sudah pun direkodkan untuk mesyuarat ini. Tiada tindakan lanjut diperlukan.
    </div>
    @endif

    <a href="{{ route('dashboard') }}"
       style="display:block;text-align:center;padding:11px 18px;background:#2d6a2d;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        Kembali ke Dashboard →
    </a>
</x-guest-layout>

<x-guest-layout>
    <div class="text-center mb-6">
        <div style="width:80px;height:80px;background:#c92828;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:38px;">
            ⚠️
        </div>
        <h1 class="text-2xl font-bold text-gray-800">{{ $title ?? 'Ralat Kehadiran' }}</h1>
        <p class="text-sm text-gray-500 mt-1">{{ $subtitle ?? 'Terdapat masalah dengan pautan ini.' }}</p>
    </div>

    <div style="background:#ffe8e8;border:1px solid #f5b5b5;border-radius:10px;padding:14px 18px;margin-bottom:20px;font-size:13px;color:#7a2828;line-height:1.6;">
        {{ $error ?? 'Mesyuarat untuk QR code ini mungkin sudah tamat, atau pautannya tidak betul. Sila hubungi pentadbir koperasi.' }}
    </div>

    <a href="{{ route('login') }}"
       style="display:block;text-align:center;padding:11px 18px;background:#2d6a2d;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        Kembali ke Halaman Utama
    </a>
</x-guest-layout>

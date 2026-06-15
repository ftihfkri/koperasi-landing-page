<x-app-layout>
    <div class="max-w-5xl mx-auto p-6">
        <x-flash />
        <div class="mb-6">
            <h1 class="text-2xl font-bold">Reports & Statements</h1>
            <p class="text-sm text-gray-600">Generate downloadable CSV reports for management and shareholders.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            @if(auth()->user()->role === 'admin')
            <div class="rounded-xl bg-white p-5 shadow">
                <h2 class="font-semibold mb-4">Admin Summary Report</h2>
                <form method="GET" action="{{ route('admin.reports.admin-summary') }}" class="space-y-4">
                    <input type="number" name="year" value="{{ now()->year }}" class="w-full rounded-lg border-gray-300" />
                    <button class="rounded-lg bg-indigo-600 px-4 py-2 text-white">Download Summary CSV</button>
                </form>
            </div>
            @endif

            <div class="rounded-xl bg-white p-5 shadow">
                <h2 class="font-semibold mb-4">Shareholder Statement</h2>
                <p class="text-sm text-gray-600 mb-4">Shareholders can download their personal transaction history as a statement file.</p>
                @if(auth()->user()->role === 'shareholder')
                    <a href="{{ route('shareholder.statement.download') }}" class="inline-flex rounded-lg bg-green-600 px-4 py-2 text-white">Download My Statement</a>
                @else
                    <div class="text-sm text-gray-500">Log in as an shareholder to download a personal statement.</div>
                @endif
            </div>
        </div>
    </div>
</x-app-layout>

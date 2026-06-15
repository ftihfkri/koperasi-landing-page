<x-app-layout>
    <div class="max-w-7xl mx-auto p-6">
        <x-flash />

        <div class="mb-6">
            <h1 class="text-2xl font-bold">Dividend Management</h1>
            <p class="text-sm text-gray-600">Set yearly dividend percentages and view calculated member dividends.</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="rounded-xl bg-white p-5 shadow">
                <h2 class="font-semibold mb-4">Set / Calculate Dividend</h2>
                <form method="POST" action="{{ route('admin.dividends.rates.store') }}" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    @csrf
                    <input type="number" name="year" placeholder="Year" class="rounded-lg border-gray-300" required />
                    <input type="number" step="0.01" name="percentage" placeholder="Percentage" class="rounded-lg border-gray-300" required />
                    <div class="md:col-span-3">
                        <button class="rounded-lg bg-indigo-600 px-4 py-2 text-white">Save & Calculate</button>
                    </div>
                </form>
            </div>

            <div class="rounded-xl bg-white p-5 shadow">
                <h2 class="font-semibold mb-4">Available Dividend Years</h2>
                <div class="text-sm text-gray-700">
                    @forelse($availableYears as $year)
                        <div class="py-1">{{ $year }}</div>
                    @empty
                        <div>No dividend years yet.</div>
                    @endforelse
                </div>
            </div>
        </div>

        <div class="rounded-xl bg-white p-5 shadow">
            <h2 class="font-semibold mb-4">Calculated Dividends</h2>
            <div class="overflow-x-auto">
                <table class="min-w-full text-sm">
                    <thead class="border-b text-left text-gray-500">
                        <tr>
                            <th class="py-2">Year</th>
                            <th>Shareholder</th>
                            <th>Rate</th>
                            <th class="text-right">Dividend Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($dividends as $dividend)
                            <tr class="border-b">
                                <td class="py-3">{{ $dividend->year }}</td>
                                <td>{{ $dividend->user->name ?? '-' }}</td>
                                <td>{{ number_format($dividend->rate, 2) }}%</td>
                                <td class="text-right">RM {{ number_format($dividend->amount, 2) }}</td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="4" class="py-4 text-center text-gray-500">No dividend records yet.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>

            <div class="mt-4">{{ $dividends->links() }}</div>
        </div>
    </div>
</x-app-layout>
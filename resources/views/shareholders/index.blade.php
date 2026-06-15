<x-app-layout>
    <div class="max-w-7xl mx-auto p-6">
        <x-flash />
        <div class="flex items-center justify-between mb-6">
            <div>
                <h1 class="text-2xl font-bold">Shareholder Management</h1>
                <p class="text-sm text-gray-600">Create, search, and update cooperative shareholder records.</p>
            </div>
        </div>

        @if(auth()->user()->role === 'admin')
        <div class="rounded-xl bg-white p-5 shadow mb-6">
            <h2 class="font-semibold mb-4">Add Shareholder</h2>
            <form method="POST" action="{{ route('admin.shareholders.store') }}" class="grid grid-cols-1 md:grid-cols-5 gap-4">
                @csrf
                <input name="shareholder_id" value="{{ old('shareholder_id') }}" placeholder="Shareholder ID" class="rounded-lg border-gray-300" />
                <input name="full_name" value="{{ old('full_name') }}" placeholder="Full name" class="rounded-lg border-gray-300" />
                <input name="email" value="{{ old('email') }}" placeholder="Email" class="rounded-lg border-gray-300" />
                <input name="password" type="password" placeholder="Password (optional)" class="rounded-lg border-gray-300" />
                <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="is_approved" value="1" checked> Approved</label>
                <div class="md:col-span-5"><button class="rounded-lg bg-indigo-600 px-4 py-2 text-white">Create Shareholder</button></div>
            </form>
        </div>
        @endif

        <div class="rounded-xl bg-white p-5 shadow">
            <form method="GET" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input name="search" value="{{ request('search') }}" placeholder="Search shareholder ID, name, or email" class="rounded-lg border-gray-300" />
                <select name="status" class="rounded-lg border-gray-300">
                    <option value="">All status</option>
                    <option value="approved" @selected(request('status')==='approved')>Approved</option>
                    <option value="pending" @selected(request('status')==='pending')>Pending</option>
                </select>
                <button class="rounded-lg bg-gray-900 px-4 py-2 text-white">Filter</button>
            </form>

            <div class="overflow-x-auto">
                <table class="min-w-full text-sm">
                    <thead class="border-b text-left text-gray-500"><tr><th class="py-2">Shareholder ID</th><th>Name</th><th>Email</th><th>Status</th>@if(auth()->user()->role==='admin')<th>Action</th>@endif</tr></thead>
                    <tbody>
                        @forelse($members as $member)
                        <tr class="border-b align-top">
                            <td class="py-3">{{ $member->shareholder_id }}</td>
                            <td>{{ $member->display_name }}</td>
                            <td>{{ $member->email }}</td>
                            <td>{{ $member->is_approved ? 'Approved' : 'Pending' }}</td>
                            @if(auth()->user()->role==='admin')
                            <td>
                                <form method="POST" action="{{ route('admin.shareholders.update', $member) }}" class="space-y-2">
                                    @csrf
                                    @method('PUT')
                                    <input type="hidden" name="shareholder_id" value="{{ $member->shareholder_id }}">
                                    <input type="hidden" name="full_name" value="{{ $member->display_name }}">
                                    <input type="hidden" name="email" value="{{ $member->email }}">
                                    <label class="flex items-center gap-2 text-xs"><input type="checkbox" name="is_approved" value="1" {{ $member->is_approved ? 'checked' : '' }}> Approved</label>
                                    <button class="rounded bg-indigo-600 px-3 py-1 text-white text-xs">Save</button>
                                </form>
                            </td>
                            @endif
                        </tr>
                        @empty
                        <tr><td colspan="5" class="py-4 text-center text-gray-500">No shareholders found.</td></tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
            <div class="mt-4">{{ $members->links() }}</div>
        </div>
    </div>
</x-app-layout>

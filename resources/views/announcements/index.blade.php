<x-app-layout>
    <div class="max-w-7xl mx-auto p-6">
        <x-flash />
        <div class="mb-6">
            <h1 class="text-2xl font-bold">Announcements</h1>
            <p class="text-sm text-gray-600">Publish notices and updates for all cooperative users.</p>
        </div>

        <div class="rounded-xl bg-white p-5 shadow mb-6">
            <h2 class="font-semibold mb-4">Create Announcement</h2>
            <form method="POST" action="{{ route('admin.announcements.store') }}" class="space-y-4">
                @csrf
                <input name="title" placeholder="Announcement title" class="w-full rounded-lg border-gray-300" />
                <textarea name="content" rows="5" placeholder="Announcement content" class="w-full rounded-lg border-gray-300"></textarea>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="datetime-local" name="published_at" class="rounded-lg border-gray-300" />
                    <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" value="1" checked> Active</label>
                </div>
                <button class="rounded-lg bg-indigo-600 px-4 py-2 text-white">Publish</button>
            </form>
        </div>

        <div class="rounded-xl bg-white p-5 shadow">
            <div class="space-y-4">
                @forelse($announcements as $announcement)
                    <div class="rounded-lg border px-4 py-4">
                        <div class="flex items-center justify-between gap-4">
                            <div>
                                <h3 class="font-semibold">{{ $announcement->title }}</h3>
                                <div class="text-xs text-gray-500">{{ optional($announcement->published_at)->format('d M Y h:i A') }}</div>
                            </div>
                            <span class="text-xs px-2 py-1 rounded-full {{ $announcement->is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600' }}">{{ $announcement->is_active ? 'Active' : 'Inactive' }}</span>
                        </div>
                        <p class="mt-3 text-sm text-gray-700 whitespace-pre-line">{{ $announcement->content }}</p>
                    </div>
                @empty
                    <div class="text-sm text-gray-500">No announcements available.</div>
                @endforelse
            </div>
            <div class="mt-4">{{ $announcements->links() }}</div>
        </div>
    </div>
</x-app-layout>

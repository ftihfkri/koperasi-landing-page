<x-app-layout>
    <div class="max-w-7xl mx-auto p-6">
        <x-flash />
        <div class="mb-6">
            <h1 class="text-2xl font-bold">User Access Control</h1>
            <p class="text-sm text-gray-600">Approve accounts and assign roles for admin, staff, and shareholder access.</p>
        </div>

        <div class="rounded-xl bg-white p-5 shadow overflow-x-auto">
            <table class="min-w-full text-sm">
                <thead class="border-b text-left text-gray-500"><tr><th class="py-2">Shareholder ID</th><th>Name</th><th>Email</th><th>Role</th><th>Approved</th><th>Update</th></tr></thead>
                <tbody>
                    @forelse($users as $user)
                    <tr class="border-b">
                        <td class="py-3">{{ $user->shareholder_id }}</td>
                        <td>{{ $user->display_name }}</td>
                        <td>{{ $user->email }}</td>
                        <td colspan="3">
                            <form method="POST" action="{{ route('admin.users.update', $user) }}" class="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                                @csrf
                                @method('PUT')
                                <select name="role" class="rounded-lg border-gray-300">
                                    <option value="admin" @selected($user->role==='admin')>Admin</option>
                                    <option value="staff" @selected($user->role==='staff')>Staff</option>
                                    <option value="shareholder" @selected($user->role==='shareholder')>Shareholder</option>
                                </select>
                                <select name="is_approved" class="rounded-lg border-gray-300">
                                    <option value="1" @selected($user->is_approved)>Approved</option>
                                    <option value="0" @selected(!$user->is_approved)>Pending</option>
                                </select>
                                <button class="rounded-lg bg-indigo-600 px-4 py-2 text-white">Save</button>
                            </form>
                        </td>
                    </tr>
                    @empty
                    <tr><td colspan="6" class="py-4 text-center text-gray-500">No users found.</td></tr>
                    @endforelse
                </tbody>
            </table>
            <div class="mt-4">{{ $users->links() }}</div>
        </div>
    </div>
</x-app-layout>

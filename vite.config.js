import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel([
            'resources/css/app.css',
            'resources/js/app.js',
            'resources/js/shareholder-dashboard.tsx',
            'resources/js/admin-dashboard.tsx',
            'resources/js/staff-dashboard.tsx',
            'resources/css/landing.css',
            'resources/js/landing.tsx',
        ]),
        react(),
    ],
    resolve: {
        alias: {
            // shadcn/ui-style "@/..." imports used by the landing page resolve
            // into the landing source folder.
            '@': path.resolve(__dirname, 'resources/js/landing'),
        },
    },
});
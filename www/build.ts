import * as esbuild from 'esbuild';
import { ensureDir } from 'std/fs';

async function build() {
    console.log('🚀 Building React frontend...');

    // Ensure build directory exists
    await ensureDir('./dist');

    try {
        // Build the React app
        await esbuild.build({
            entryPoints: ['./www/main.tsx'],
            bundle: true,
            minify: true,
            sourcemap: true,
            target: 'es2020',
            format: 'esm',
            outfile: './dist/main.js',
            jsx: 'automatic',
            jsxImportSource: 'react',
            loader: {
                '.css': 'css',
            },
            define: {
                'process.env.NODE_ENV': '"production"',
            },
            external: [], // Bundle everything
        });

        // Copy HTML file from public directory
        await Deno.copyFile('./public/index.html', './dist/index.html');

        console.log('✅ Build completed successfully!');
        console.log('📁 Output directory: ./dist');
    } catch (error) {
        console.error('❌ Build failed:', error);
        Deno.exit(1);
    }
}

if (import.meta.main) {
    await build();
}

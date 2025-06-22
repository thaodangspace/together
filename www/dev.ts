import * as esbuild from 'esbuild';
import { ensureDir } from 'std/fs';

async function devBuild() {
    console.log('🚀 Starting React development server...');

    // Ensure build directory exists
    await ensureDir('./dist');

    try {
        // Copy HTML file from public directory
        await Deno.copyFile('./public/index.html', './dist/index.html');

        // Build the React app in watch mode
        const ctx = await esbuild.context({
            entryPoints: ['./www/main.tsx'],
            bundle: true,
            minify: false,
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
                'process.env.NODE_ENV': '"development"',
            },
            external: [], // Bundle everything
        });

        await ctx.watch();
        console.log('👀 Watching for changes...');
        console.log('📁 Output directory: ./dist');
        console.log('🌐 Frontend will be served by the Deno server on port 8061');

        // Keep the process alive
        await new Promise(() => {});
    } catch (error) {
        console.error('❌ Development build failed:', error);
        Deno.exit(1);
    }
}

if (import.meta.main) {
    await devBuild();
}

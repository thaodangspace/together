import { ensureDir } from 'std/fs';

async function build() {
    console.log('🚀 Building React frontend...');

    // Ensure build directory exists
    await ensureDir('./dist');

    try {
        // Create a temporary bundle script
        const bundleScript = `
import * as esbuild from 'npm:esbuild@0.19.12';

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
    external: [],
    platform: 'browser',
});

console.log('✅ React app bundled successfully');
`;

        // Write the bundle script to a temporary file
        await Deno.writeTextFile('./temp_bundle.ts', bundleScript);

        // Run the bundle script
        const esbuildCommand = new Deno.Command('deno', {
            args: ['run', '--allow-all', '--node-modules-dir', './temp_bundle.ts'],
            stdout: 'inherit',
            stderr: 'inherit',
        });

        const bundleResult = await esbuildCommand.output();

        // Clean up temporary file
        await Deno.remove('./temp_bundle.ts');

        if (bundleResult.code !== 0) throw new Error('React build failed');

        // Compile Tailwind CSS
        const tailwind = new Deno.Command('npx', {
            args: [
                'tailwindcss',
                '-i',
                './www/styles/global.css',
                '-c',
                './tailwind.config.js',
                '-o',
                './dist/styles.css',
                '--minify',
            ],
            stdout: 'inherit',
            stderr: 'inherit',
        });
        const { code } = await tailwind.output();
        if (code !== 0) throw new Error('Tailwind build failed');

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

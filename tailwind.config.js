/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.rs', './index.html', './style/**/*.css', './style/**/*.scss'],
    theme: {
        extend: {
            colors: {
                'youtube-red': '#FF0000',
                'youtube-dark': '#0F0F0F',
                'youtube-gray': '#272727',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
        },
    },
    plugins: [],
};

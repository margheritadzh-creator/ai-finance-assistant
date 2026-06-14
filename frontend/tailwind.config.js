/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/app/**/*.{js,ts,jsx,tsx}",
        "./src/components/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                finance: {
                    primary: "#0F172A",
                    accent: "#1E293B",
                    gold: "#C7A76C"
                }
            }
        }
    },
    plugins: []
};
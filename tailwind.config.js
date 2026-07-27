/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        night:  '#04222E',   // cielo detrás de la reja
        court:  '#0E5064',   // superficie de cancha
        court2: '#12657F',   // superficie iluminada
        glass:  '#2E7C93',   // reja / vidrio
        line:   '#EAF4F2',   // líneas de cancha
        flood:  '#FFB74A',   // reflector — único acento
        floodd: '#E09122',
      },
      fontFamily: {
        display: ['Archivo', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper:  '#F2F1ED',   // cartulina, el fondo
        card:   '#FBFAF7',   // el papel de encima
        ink:    '#171A1E',   // tinta negra azulada
        ink2:   '#5A6068',   // tinta gastada, texto secundario
        rule:   '#C7C4BB',   // filetes impresos
        stamp:  '#B33A2B',   // tampón rojo — el único acento
        court:  '#2F6B7A',   // azul de pista, solo en el dibujo
      },
      fontFamily: {
        display: ['Archivo', 'system-ui', 'sans-serif'],
        sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { DEFAULT: '2px', lg: '3px', xl: '4px' },
    },
  },
  plugins: [],
};

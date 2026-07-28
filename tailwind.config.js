/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:  '#0C1016',   // base
        s1:  '#141A22',   // filas y tarjetas
        s2:  '#1B2029',   // elevado / seleccionado
        s3:  '#232935',   // encima de lo elevado
        br:  '#242B36',   // bordes
        tx:  '#EDF1F5',   // texto
        t2:  '#8A94A4',   // texto secundario
        t3:  '#5B6472',   // texto terciario
        ac:  '#22C57E',   // verde: acción y estado
        wn:  '#F0A63C',   // ámbar: avisos y deudas
        ct:  '#2E86C1',   // azul: solo la cancha
      },
      fontFamily: {
        sans: ['"Inter Tight"', 'system-ui', 'sans-serif'],
        num:  ['"Roboto Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        micro: ['0.6875rem', { lineHeight: '1rem' }],
        tiny:  ['0.75rem',   { lineHeight: '1.05rem' }],
        base:  ['0.875rem',  { lineHeight: '1.25rem' }],
        lg:    ['1rem',      { lineHeight: '1.35rem' }],
      },
    },
  },
  plugins: [],
};

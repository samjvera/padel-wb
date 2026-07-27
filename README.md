# Cancha

App para organizar los pádel del grupo: quién puede qué día, el cuadro del
americano, los marcadores y a quién le toca pagar la cancha.

---

## Antes de empezar

**Tiempo:** unos 25 minutos, una sola vez.

**Costo:** cero. No te va a pedir tarjeta de crédito en ningún momento.

**No necesitas instalar nada.** Ni programas, ni terminal, ni saber programar.
Todo se hace desde el navegador, haciendo clic.

**Necesitas dos cuentas:**

- Una cuenta de Google (la que ya usas para Gmail sirve).
- Una cuenta de GitHub. Si no tienes, créala gratis en
  [github.com/signup](https://github.com/signup). Apunta el nombre de usuario
  que elijas, lo vas a usar varias veces.

Vamos a usar dos servicios:

- **Firebase** guarda la información (quién puede jugar, los marcadores, los pagos).
- **GitHub** guarda la app y la publica como página web.

> **Firebase rediseña su menú cada pocos meses.** Si no encuentras algo donde
> dice aquí, usa el buscador **Buscar productos** que está arriba del todo en la
> barra lateral izquierda: escribe el nombre de lo que buscas (`Authentication`,
> `Firestore`) y te lleva directo. Ese buscador no cambia de sitio.

---

# PARTE 1 — Firebase (donde se guarda todo)

## Paso 1. Crear el proyecto

1. Entra a [console.firebase.google.com](https://console.firebase.google.com) e
   inicia sesión con tu cuenta de Google.
2. Haz clic en **Crear un proyecto**.
3. Ponle un nombre. Por ejemplo `padel`. Firebase le añadirá unos números al
   final para que sea único; eso es normal.
4. Cuando te pregunte por **Google Analytics**, **desactívalo**. No lo
   necesitas y te ahorra pasos.
5. Clic en **Crear proyecto** y espera medio minuto.

**Cómo saber que va bien:** entras a una pantalla que dice *Hola [tu nombre]* y
junto al nombre del proyecto, arriba, aparece una etiqueta **Plan Spark**. Eso
confirma que estás en el plan gratuito y que no te van a cobrar nada.

## Paso 2. Permitir entrar con Google

1. En la barra lateral izquierda, bajo el título **Accesos directos a
   proyectos**, haz clic en **Authentication**.
   *(Si no lo ves ahí, escribe `Authentication` en **Buscar productos**.)*
2. Clic en **Comenzar**.
3. Te muestra una lista de formas de iniciar sesión. Elige **Google**.
4. Activa el interruptor de arriba a la derecha (**Habilitar**).
5. Te pedirá un **correo electrónico de asistencia**: elige el tuyo del
   desplegable.
6. Clic en **Guardar**.

**Cómo saber que va bien:** en la lista de proveedores, Google aparece con el
estado *Habilitado*.

## Paso 3. Crear la base de datos

1. En la barra lateral, dentro de **Categorías de producto**, haz clic en
   **Bases de datos y almacenamiento** para desplegarla, y elige
   **Firestore Database**.
   *(Atajo: escribe `Firestore` en **Buscar productos**.)*
2. Clic en **Crear base de datos**.

Se abre un asistente de tres pasos.

### 3.1 — Seleccionar edición

Te da a elegir entre **Edición Standard** y **Edición Enterprise**.

**Deja Standard**, que ya viene marcada. Es la que necesita esta app y la que
entra en el plan gratuito. Enterprise es para empresas con bases de datos
enormes y no te sirve de nada aquí.

Clic en **Siguiente**.

### 3.2 — ID y ubicación de la base de datos

⚠️ **Aquí está la trampa más peligrosa de todo el instructivo.**

Verás un campo **ID de la base de datos** con la palabra `(default)` en gris
claro. Eso es un texto de ejemplo, no algo que hayas escrito.

**No escribas nada en ese campo. Déjalo completamente vacío.**

Si le pones un nombre, la app no encontrará la base de datos nunca y verás
errores que no dicen por qué. Y no se puede renombrar después: habría que
empezar de cero.

En **Ubicación**, deja `nam5 (United States)`, que ya viene puesta. Verás un
aviso naranja de que la ubicación no se puede cambiar después: es normal y
`nam5` está bien.

Clic en **Siguiente**.

### 3.3 — Configurar

Te da a elegir entre **Iniciar en modo de producción** y **Comenzar en modo de
prueba**.

**Deja "Iniciar en modo de producción"**, que ya viene marcada.

A la derecha verás un recuadro con código y un aviso que dice *"Se denegarán
todas las operaciones de lectura y escritura de terceros"*. **Eso es correcto y
es lo que queremos.** De momento todo está bloqueado; en el Paso 4 pones las
reglas que dejan entrar a tu grupo.

> No elijas *modo de prueba*: deja la base de datos abierta a cualquiera durante
> 30 días y luego se cierra sola de golpe, rompiendo la app sin avisar.

Clic en **Crear** y espera unos segundos.

## Paso 4. Poner las reglas de seguridad

Ahora mismo tu base de datos está **bloqueada para todo el mundo**, incluido tú.
Eso es lo que dejó el modo de producción. En este paso la abres solo para tu
grupo.

**No te lo saltes**, o la app no funcionará.

1. Dentro de Firestore Database, arriba, entra a la pestaña **Reglas**.
2. Verás un recuadro con texto. **Borra todo lo que hay dentro.**
3. Abre el archivo `firestore.rules` que viene en la carpeta que descargaste
   (se abre con el Bloc de notas o TextEdit), copia **todo** su contenido y
   pégalo en ese recuadro.
4. Clic en **Publicar**.

Si te sale un aviso en rojo, es que se copió mal. Vuelve a borrar todo y pega
otra vez.

## Paso 5. Copiar los datos de conexión

1. En la barra lateral, clic en **Descripción general del proyecto** (la casita,
   arriba del todo).
2. En el centro de la pantalla, bajo el nombre del proyecto, clic en el botón
   **+ Agregar app**.
3. Te ofrece varios tipos de app. Elige el de **web**, que es el icono
   **`</>`**.
4. Ponle cualquier apodo, por ejemplo `cancha`. **No marques** la casilla de
   Firebase Hosting.
5. Clic en **Registrar app**.
6. Aparecerá un bloque de texto. Busca la parte que empieza por
   `const firebaseConfig = {` y **deja esta pestaña abierta**: vas a copiar
   esos valores en el Paso 9.

> Si ya cerraste esa pantalla, los datos siempre están en la barra lateral, en
> **Configuración** → **Configuración del proyecto**, bajando hasta **Tus apps**.

Se ve más o menos así:

```
const firebaseConfig = {
  apiKey: "AIzaSyB1c...",
  authDomain: "padel-4f2a1.firebaseapp.com",
  projectId: "padel-4f2a1",
  storageBucket: "padel-4f2a1.firebasestorage.app",
  messagingSenderId: "402918374652",
  appId: "1:402918374652:web:8d3f..."
};
```

> Esos datos **no son secretos**. Van dentro de la página y cualquiera puede
> verlos; así funcionan todas las apps web con Firebase. Lo que protege tu
> información son las reglas del Paso 4 y la lista de correos autorizados.

> **Si algún menú no coincide con lo que lees aquí:** el buscador *Buscar
> productos* de la barra lateral te lleva a cualquier sección por nombre. Y si
> te quedas trabado, una captura de pantalla suele bastar para desatascarlo.

---

# PARTE 2 — GitHub (donde vive la página)

## Paso 6. Crear el repositorio

Un "repositorio" es simplemente una carpeta de archivos en internet.

1. Entra a [github.com/new](https://github.com/new).
2. En **Repository name** escribe el nombre que quieras, por ejemplo `padel-wb`.
   Apúntalo: aparece en la dirección de tu app. La app detecta el nombre sola,
   así que cualquiera funciona.
3. Elige **Public**.
   > Tiene que ser público para que la publicación gratuita funcione. Solo se
   > ve el código, nunca la información del grupo: eso vive en Firebase, detrás
   > del inicio de sesión.
4. **No marques** ninguna de las casillas de abajo (README, .gitignore, licencia).
5. Clic en **Create repository**.

## Paso 7. Subir los archivos

⚠️ **Aquí es donde falla casi todo el mundo. Lee esto completo antes de arrastrar nada.**

La carpeta que descargaste contiene una subcarpeta llamada **`.github`**. Al
empezar por un punto, tu computadora **la esconde**, y si no la subes, la
página nunca se publica.

**Primero haz visibles los archivos ocultos:**

- **Mac:** abre la carpeta en Finder y pulsa `Cmd` + `Shift` + `.` (punto).
  Deberías ver aparecer `.github` y `.gitignore`, algo transparentes.
- **Windows:** en el Explorador, pestaña **Vista** → marca **Elementos ocultos**.

**Ahora sube:**

1. En la página de tu repositorio recién creado verás un recuadro azul que dice
   **Quick setup**. Dentro hay una frase que empieza por *"Get started by..."*
   con el enlace **uploading an existing file**. Haz clic ahí.
2. Abre la carpeta que descargaste, **entra dentro** de ella, y selecciona
   todo lo que hay (`Cmd`+`A` o `Ctrl`+`A`).
3. Arrástralo a la zona de subida del navegador.
4. Verifica que en la lista aparecen `.github/workflows/deploy.yml` y la
   carpeta `src`. Si no ves `.github`, vuelve al principio del paso.
5. Abajo, clic en **Commit changes**.

> **No subas la carpeta entera**, sube lo que hay *dentro*. Si en GitHub ves
> una sola carpeta llamada `padel`, entraste mal: borra el repositorio y
> empieza el paso otra vez.

## Paso 8. Activar la publicación

1. En tu repositorio, arriba, pestaña **Settings**.
2. Menú de la izquierda, **Pages**.
3. En **Source**, cambia el desplegable a **GitHub Actions**.

No hay que guardar nada, se aplica solo.

## Paso 9. Pegar los datos de Firebase

1. Vuelve a la pestaña **Code** de tu repositorio.
2. Entra a la carpeta `src` y haz clic en el archivo **`config.js`**.
3. Arriba a la derecha, clic en el **lápiz ✏️** (*Edit this file*).
4. Reemplaza cada `"PEGA_AQUI..."` por el valor correspondiente de la pestaña
   de Firebase que dejaste abierta en el Paso 5.

   **Mantén las comillas y las comas.** Solo cambias lo de dentro de las comillas.

   Debe quedar así:

   ```js
   export const firebaseConfig = {
     apiKey: "AIzaSyB1c...",
     authDomain: "padel-4f2a1.firebaseapp.com",
     projectId: "padel-4f2a1",
     storageBucket: "padel-4f2a1.firebasestorage.app",
     messagingSenderId: "402918374652",
     appId: "1:402918374652:web:8d3f...",
   };
   ```

5. Botón verde **Commit changes** → **Commit changes** otra vez.

## Paso 10. Esperar a que se publique

1. Pestaña **Actions** de tu repositorio.
2. Verás una línea con un círculo amarillo girando. Espera 1–2 minutos hasta
   que se ponga **verde ✓**.
3. Tu app ya está en:

   ```
   https://TU_USUARIO.github.io/NOMBRE_DEL_REPO/
   ```

   Se arma con tu usuario de GitHub y el nombre que le pusiste al repositorio.
   Por ejemplo, si tu usuario es `samjvera` y el repositorio `padel-wb`:

   ```
   https://samjvera.github.io/padel-wb/
   ```

   **La barra del final hace falta.** Sin ella puede que veas un error 404.

Si sale una **✗ roja**, ve a *Si algo falla* al final.

## Paso 11. Autorizar tu dirección en Firebase

Sin esto, al intentar entrar no pasará nada.

1. Vuelve a Firebase y entra a **Authentication** (barra lateral, bajo *Accesos
   directos a proyectos*).
2. Arriba, entra a la pestaña **Configuración** y busca **Dominios
   autorizados**. Verás que ya hay dos, `localhost` y uno que termina en
   `firebaseapp.com`: son normales, déjalos.
3. Clic en **Agregar dominio**.
4. Escribe **solo tu usuario seguido de `.github.io`**, sin `https://` y sin el
   nombre del repositorio:

   ```
   TU_USUARIO.github.io
   ```

   Por ejemplo, si tu usuario es `samjvera`, escribes exactamente:

   ```
   samjvera.github.io
   ```

   ⚠️ **No pongas la dirección completa.** Si escribes
   `https://samjvera.github.io/padel-wb/` no va a funcionar. Aquí va solo el
   dominio, sin repositorio y sin barras.

5. Clic en **Agregar**.

---

# PARTE 3 — Crear el grupo

## Paso 12. La primera vez

1. Abre tu app en el celular o la computadora.
2. Clic en **Entrar con Google**.
3. Aparece la pantalla **Crea tu grupo**, con los ocho nombres ya escritos.
4. Para cada persona, escribe **su correo de Google**.

   ⚠️ Tiene que ser el correo exacto con el que esa persona entra a Google. Si
   Arturo usa `arturo@hotmail.com` para todo pero su cuenta de Google es
   `arturo.perez@gmail.com`, hay que poner el segundo o no podrá entrar.

5. Revisa la **M** o **F** de cada uno. Solo los marcados con M entran en la
   rotación de pago.
6. Abajo, ordena con las flechas ↑↓ a quién le toca pagar primero.
7. Clic en **Crear el grupo**.

Listo. Esta pantalla no vuelve a aparecer nunca.

> **Hazlo enseguida después del Paso 11.** Hasta que crees el grupo, cualquier
> persona con cuenta de Google que abra la dirección podría crearlo. Son unos
> minutos de ventana; una vez creado, la puerta se cierra sola.

## Paso 13. Pasarles el enlace a los demás

Mándales la dirección por el grupo de WhatsApp. Cada uno entra con Google y ya
está: no hay que instalar ni registrarse.

Si a alguien le dice *"Esta cuenta no está en el grupo"*, es que su correo está
mal escrito. Ve a *Cambiar personas* más abajo.

---

# Cómo se usa cada semana

**Lunes — pestaña Semana.** Cada quien toca las casillas de los días y horarios
en que puede. El número dentro de cada casilla es cuánta gente puede a esa hora.
Cuando ya hay un horario claro, cualquiera toca **Fijar este día**: eso congela
la lista de los que juegan y asigna a quién le toca pagar.

**Día del partido — pestaña Partido.** Toca **Armar americano** y aparece el
cuadro: quién juega con quién en cada ronda, dibujado sobre una cancha. Después
de cada ronda escribes los puntos de un equipo y el del otro se calcula solo.
La tabla se ordena en vivo.

Antes de armar el cuadro puedes **añadir invitados**. Los invitados no entran
en la rotación de pago.

**Pestaña Pagos.** Muestra a quién le toca esta semana y la cola completa.
Cuando pague, tocan **Marcar como pagado**.

## La app no manda avisos

Es una decisión, no un olvido. No hay bot, ni correos, ni notificaciones: la
app no le escribe a nadie nunca.

En su lugar, en las pestañas *Semana* y *Partido* hay un botón **Copiar mensaje
para el grupo**. Arma el texto solo —qué horario va ganando, quién falta por
marcar, o la alineación y quién paga— y lo deja copiado para que lo pegues en
WhatsApp.

Y al fijar la noche, **Añadir al calendario** baja el evento al calendario del
teléfono, con avisos 3 horas y 30 minutos antes.

**Lo que esto significa:** si nadie abre la app, nadie se entera. Alguien del
grupo tiene que acordarse el lunes de tocar *Copiar mensaje* y pegarlo.

---

# Si algo falla

| Lo que ves | Qué pasa | Cómo se arregla |
|---|---|---|
| **Falta conectar Firebase** | El Paso 9 no se guardó | Vuelve a `src/config.js` en GitHub y revisa que no quede ningún `PEGA_AQUI` |
| Al tocar *Entrar con Google* no pasa nada, o se abre y se cierra | Falta el Paso 11 | Añade `TU_USUARIO.github.io` a Dominios autorizados |
| **Esta cuenta no está en el grupo** | El correo no coincide | Mira *Cambiar personas* abajo |
| Página en blanco o error 404 | La publicación no terminó, o la dirección está mal escrita | Pestaña Actions: espera el ✓ verde. Si ya está verde, revisa que la dirección lleve tu usuario, el nombre exacto del repositorio, y la **barra final** |
| **✗ roja** en Actions | Casi siempre falta la carpeta `.github`, o se subió la carpeta entera en vez de su contenido | Repite el Paso 7 con los archivos ocultos visibles |
| **Missing or insufficient permissions** | Las reglas del Paso 4 no se publicaron | Firestore → Reglas → pega otra vez → Publicar |
| Todo parece bien pero nada se guarda, o errores raros sin explicación | Le pusiste nombre a la base de datos en el Paso 3.2 | En Firestore, si tu base de datos **no** se llama `(default)`, hay que crear otra dejando el campo de ID vacío |
| Se queda en *Cargando…* | Igual que la anterior | Igual que la anterior |
| El botón *Copiar* no copia | Safari a veces lo bloquea | La app muestra el texto abajo; selecciónalo y cópialo a mano |

Cuando cambies algo en GitHub, espera 1–2 minutos y **recarga la página**. Si
sigues viendo lo viejo, recarga forzando: `Cmd`+`Shift`+`R` o `Ctrl`+`F5`.

---

# Cambiar personas después

Se hace en Firebase → **Firestore Database** → pestaña **Datos**.

**Corregir un correo mal escrito:**

1. Colección `players` → clic en la persona → doble clic en el campo `email` →
   corrígelo → **Actualizar**.
2. Colección `allowlist` → borra el documento con el correo viejo (los tres
   puntos ⋮ → **Eliminar documento**).
3. En `allowlist`, **Agregar documento**. En *ID del documento* pon el correo
   nuevo, y añade un campo `playerId` de tipo *string* con el identificador de
   la persona (aparece como nombre del documento en `players`, por ejemplo
   `arturo`).

**Sacar a alguien:** en `players`, cambia su campo `active` a `false`. Y borra
su documento de `allowlist` para que no pueda entrar.

---

# Cosas que conviene saber

## Ocho personas en una cancha se sientan mucho

La app lo permite, pero mide mal. Con 8 rondas de 16 puntos, cada persona juega
4 y se sienta 4, y **12 de las 28 parejas posibles nunca llegan a jugar juntas**.

Estos son los números reales del generador, con una cancha:

| Jugadores | Rondas | Partidos c/u | Parejas que nunca se forman |
|---|---|---|---|
| 4 | 6 | 6 | 0 de 6 |
| 5 | 5 | 4 | 0 de 10 |
| 6 | 8 | 5–6 | 0 de 15 |
| 7 | 8 | 4–5 | 5 de 21 |
| 8 | 8 | 4 | **12 de 28** |

**Cinco y seis jugadores son el punto dulce de una cancha.** Con 5 sale un
americano perfecto: cada uno se sienta exactamente una vez y juega con cada uno
de los demás exactamente una vez.

Si algún día consiguen **dos canchas**, 8 jugadores en 7 rondas es perfecto:
todos juegan todas las rondas y cada pareja se forma una vez.

## Los puntos M+

Cuando unos juegan más rondas que otros, a quien jugó menos se le suman 8
puntos por cada ronda que se perdió (la mitad de los 16 que reparte un partido).
Es el estándar y evita que el marcador castigue a quien le tocó descansar más.

## La columna Diff no desempata

Con puntos fijos por partido, la diferencia sale siempre de los puntos y los
partidos jugados. Dos personas con los mismos puntos y los mismos partidos
tienen forzosamente la misma diferencia. Por eso el desempate real es **quién
ganó más partidos**, y eso es lo que ordena la tabla.

## Quién paga

Paga siempre **quien menos veces ha pagado**, y si hay empate, el que esté antes
en el orden que definiste. Si te toca y no vas, no pierdes el turno: te quedas
arriba hasta que juegues.

Las mujeres y los invitados no entran en el cálculo. Si una noche solo confirman
mujeres e invitados, la app lo dice y nadie avanza en la cola.

## Todos mandan igual

No hay administradores. Cualquiera puede fijar el día, reabrir la semana o
marcar un pago. Entre amigos, los permisos suelen estorbar más que ayudar.

## La app organiza, no reserva

Alguien tiene que reservar la cancha en el club a mano. Los clubes casi nunca
dejan que otras apps reserven por ellos.

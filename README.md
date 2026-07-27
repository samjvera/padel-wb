# Cancha

App para organizar los pádel del grupo: quién puede qué día, el cuadro del
americano, los marcadores y a quién le toca pagar la cancha.

---

## Antes de empezar

**Tiempo:** unos 25 minutos, una sola vez.

**Costo:** cero. No te va a pedir tarjeta de crédito en ningún momento.

**No necesitas instalar nada.** Ni programas, ni terminal, ni saber programar.
Todo se hace desde el navegador, haciendo clic.

**Necesitas dos cuentas, y solo tú:**

- Una cuenta de Google, para crear el Firebase (la de Gmail sirve).
- Una cuenta de GitHub. Si no tienes, créala gratis en
  [github.com/signup](https://github.com/signup). Apunta el nombre de usuario
  que elijas, lo vas a usar varias veces.

Tus amigos **no necesitan ninguna cuenta**: abren el enlace y listo.

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

## Paso 2. Crear la base de datos

1. En la barra lateral, dentro de **Categorías de producto**, haz clic en
   **Bases de datos y almacenamiento** para desplegarla, y elige
   **Firestore Database**.
   *(Atajo: escribe `Firestore` en **Buscar productos**.)*
2. Clic en **Crear base de datos**.

Se abre un asistente de tres pasos.

### 2.1 — Seleccionar edición

Te da a elegir entre **Edición Standard** y **Edición Enterprise**.

**Deja Standard**, que ya viene marcada. Es la que necesita esta app y la que
entra en el plan gratuito. Enterprise es para empresas con bases de datos
enormes y no te sirve de nada aquí.

Clic en **Siguiente**.

### 2.2 — ID y ubicación de la base de datos

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

### 2.3 — Configurar

Te da a elegir entre **Iniciar en modo de producción** y **Comenzar en modo de
prueba**.

**Deja "Iniciar en modo de producción"**, que ya viene marcada.

A la derecha verás un recuadro con código y un aviso que dice *"Se denegarán
todas las operaciones de lectura y escritura de terceros"*. **Eso es correcto y
es lo que queremos.** De momento todo está bloqueado; en el Paso 3 pones las
reglas que dejan entrar a tu grupo.

> No elijas *modo de prueba*: deja la base de datos abierta a cualquiera durante
> 30 días y luego se cierra sola de golpe, rompiendo la app sin avisar.

Clic en **Crear** y espera unos segundos.

## Paso 3. Poner las reglas de seguridad

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

## Paso 4. Copiar los datos de conexión

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
   esos valores en el Paso 8.

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
> información son las reglas del Paso 3 y la lista de correos autorizados.

> **Si algún menú no coincide con lo que lees aquí:** el buscador *Buscar
> productos* de la barra lateral te lleva a cualquier sección por nombre. Y si
> te quedas trabado, una captura de pantalla suele bastar para desatascarlo.

---

# PARTE 2 — GitHub (donde vive la página)

## Paso 5. Crear el repositorio

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

## Paso 6. Copiar los archivos al repositorio

Como estás usando **GitHub Desktop** con el repositorio clonado en tu
computadora, no hay que subir nada por el navegador: copias los archivos a una
carpeta y GitHub Desktop se encarga.

### 6.1 — Abrir la carpeta del repositorio

1. Abre GitHub Desktop y asegúrate de que arriba a la izquierda está
   seleccionado tu repositorio (`padel-wb`).
2. Menú **Repository** → **Show in Explorer** (en Mac, *Show in Finder*).
3. Se abre una carpeta que parece vacía. Es la correcta.

Deja esa ventana abierta.

### 6.2 — Hacer visibles los archivos ocultos

⚠️ **No te saltes esto.** Los archivos que vas a copiar incluyen una carpeta
llamada **`.github`**. Al empezar por un punto, Windows y Mac **la esconden**, y
si no la copias, la página web nunca se publica y nada te avisará.

- **Windows:** en el Explorador, pestaña **Vista** → marca **Elementos ocultos**.
- **Mac:** en Finder, pulsa `Cmd` + `Shift` + `.` (punto).

Debería aparecer `.github` y `.gitignore`, en gris o algo transparentes.

### 6.3 — Copiar el contenido

1. Descomprime el archivo que descargaste.
2. **Entra dentro** de la carpeta `padel` que aparece.
3. Selecciona todo lo que hay dentro (`Ctrl`+`A`, o `Cmd`+`A` en Mac) y cópialo
   (`Ctrl`+`C` / `Cmd`+`C`).
4. Ve a la carpeta del repositorio que dejaste abierta y pega (`Ctrl`+`V` /
   `Cmd`+`V`).

> **Copia el contenido, no la carpeta.** Si al terminar dentro del repositorio
> ves una sola carpeta llamada `padel`, borra lo que pegaste y repite entrando
> un nivel más.

### 6.4 — Comprobar antes de continuar

Vuelve a GitHub Desktop. En el panel de la izquierda, pestaña **Changes**,
deberías ver una lista de unos 25 archivos.

**Busca en esa lista `.github/workflows/deploy.yml`.**

- Si está: perfecto, sigue.
- Si **no** está: los archivos ocultos no estaban visibles. Vuelve al paso 6.2,
  activa la opción y copia otra vez ese archivo.

Esta comprobación te ahorra el error más común y más difícil de diagnosticar.

### 6.5 — Guardar y enviar

En GitHub Desktop, abajo a la izquierda:

1. En el recuadro **Summary**, escribe cualquier cosa, por ejemplo
   `primera version`.
2. Clic en el botón azul **Commit to main**.

Y ahora lo importante:

3. Arriba, clic en **Push origin**.

⚠️ **Hacer *Commit* no envía nada a internet.** Solo guarda el cambio en tu
computadora. Hasta que no toques **Push origin**, GitHub sigue viendo el
repositorio vacío y la página no se publica. Es el fallo más frecuente de quien
empieza con GitHub Desktop.

**Cómo saber que va bien:** el botón deja de decir *Push origin* y, si recargas
la página del repositorio en el navegador, ves todos los archivos.

## Paso 7. Activar la publicación

1. En tu repositorio, arriba, pestaña **Settings**.
2. Menú de la izquierda, **Pages**.
3. En **Source**, cambia el desplegable a **GitHub Actions**.

No hay que guardar nada, se aplica solo.

## Paso 8. Pegar los datos de Firebase

Como tienes el repositorio en tu computadora, edita el archivo ahí mismo.

1. Abre la carpeta del repositorio (GitHub Desktop → **Repository** →
   **Show in Explorer**).
2. Entra a la carpeta **`src`** y busca el archivo **`config.js`**.
3. Ábrelo con un editor de **texto plano**:
   - **Windows:** clic derecho → *Abrir con* → **Bloc de notas**.
   - **Mac:** clic derecho → *Abrir con* → **TextEdit**.

   > No lo abras con Word ni con Páginas: añaden formato invisible que rompe el
   > archivo.

4. Verás seis líneas con `"PEGA_AQUI..."`. Reemplaza cada una por el valor que
   corresponda, de la pestaña de Firebase que dejaste abierta en el Paso 4.

   **Mantén las comillas y las comas.** Solo cambias lo que está *dentro* de las
   comillas.

   Debe quedar así (con tus valores, no estos):

   ```js
   export const firebaseConfig = {
     apiKey: "AIzaSyB1c...",
     authDomain: "padel-wb-4f2a1.firebaseapp.com",
     projectId: "padel-wb-4f2a1",
     storageBucket: "padel-wb-4f2a1.firebasestorage.app",
     messagingSenderId: "402918374652",
     appId: "1:402918374652:web:8d3f...",
   };
   ```

5. Guarda el archivo (`Ctrl`+`S` / `Cmd`+`S`) y ciérralo.

> Si GitHub Desktop te muestra el aviso **"This diff contains a change in line
> endings from 'LF' to 'CRLF'"**, ignóralo. Es solo la forma en que Windows
> marca el final de cada línea; no afecta a la app. Puedes hacer *Commit* y
> *Push* con total tranquilidad.

### Enviar el cambio

Vuelve a GitHub Desktop:

1. En **Changes** debería aparecer `src/config.js`. Si haces clic, ves en verde
   y rojo lo que cambiaste: comprueba que no quedó ningún `PEGA_AQUI`.
2. En **Summary** escribe `datos de firebase`.
3. Clic en **Commit to main**.
4. Clic en **Push origin**. ← otra vez, sin esto no llega a internet.

## Paso 9. Esperar a que se publique

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

# PARTE 3 — Crear el grupo

## Paso 10. La primera vez

1. Abre tu app en el celular o la computadora.
2. Aparece la pantalla **Crea tu grupo**, con los ocho nombres ya escritos.
   Cámbialos si hace falta.
3. Marca **M** o **F** en cada uno. Solo los marcados con M entran en la
   rotación de pago.
4. Abajo, ordena con las flechas ↑↓ a quién le toca pagar primero.
5. Clic en **Crear el grupo**.

Después te pregunta **¿Cómo te llamas?**. Escribe tu nombre o tócalo en la lista
de abajo. Queda guardado en ese teléfono; no lo vuelve a preguntar.

Si te equivocas, toca tu nombre arriba a la derecha y vuelves a escribirlo.

> Esta pantalla de configuración solo aparece una vez. En cuanto creas el grupo,
> nadie la vuelve a ver.

## Paso 11. Pasarles el enlace a los demás

Mándales la dirección por el grupo de WhatsApp:

```
https://samjvera.github.io/padel-wb/
```

Cada uno la abre, **escribe su nombre**, y ya está. No hay que instalar nada, no
hay que registrarse y no hay contraseñas.

Si el nombre ya existe, entra como esa persona. Si es nuevo —un amigo que se
apunta esa semana— se añade solo, como invitado. Da igual si escribe `Ricardo`,
`ricardo` o `RICARDO`: la app los reconoce como el mismo.

Diles que **la guarden en la pantalla de inicio** para tenerla a mano: en el
navegador del celular, menú → *Añadir a pantalla de inicio*.

# Cómo se usa cada semana

**Cada lunes a las 8:00 de la mañana, hora de Caracas**, la app pasa sola a una
semana nueva: la cuadrícula queda en blanco y se puede volver a organizar. No
hace falta que nadie haga nada, ni hay ningún servidor detrás: cada teléfono lo
calcula por su cuenta, así que todos ven el cambio en el mismo instante aunque
estén en países distintos.

Debajo del nombre de la semana, arriba, siempre dice cuánto falta para el
próximo reinicio.

La semana anterior no se borra: queda guardada en Firestore por si algún día
quieren consultarla.

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
| **Falta conectar Firebase** | El Paso 8 no se guardó | Vuelve a `src/config.js` en GitHub y revisa que no quede ningún `PEGA_AQUI` |
| Te pregunta el nombre cada vez que abres | Borraste los datos del navegador, o estás en modo incógnito | Escríbelo otra vez. En incógnito no se puede guardar nada |
| Escribiste mal tu nombre | — | Toca tu nombre arriba a la derecha y vuelve a escribirlo |
| Aparecen dos personas casi iguales (`Matias` y `Matías`) | Alguien lo escribió con acento | En Firestore → `players`, pon `active: false` en la sobrante |
| La semana no cambió el lunes | Tenías la app abierta desde antes | Recarga la página; si está abierta, cambia sola en menos de un minuto |
| Página en blanco o error 404 | La publicación no terminó, o la dirección está mal escrita | Pestaña Actions: espera el ✓ verde. Si ya está verde, revisa que la dirección lleve tu usuario, el nombre exacto del repositorio, y la **barra final** |
| **✗ roja** en Actions | Casi siempre falta la carpeta `.github`, o se copió la carpeta entera en vez de su contenido | Repite el Paso 6 con los archivos ocultos visibles |
| Hiciste cambios pero en GitHub no aparecen, o la pestaña Actions no se mueve | Hiciste *Commit* pero no *Push origin* | En GitHub Desktop, clic en **Push origin** arriba |
| **This diff contains a change in line endings from 'LF' to 'CRLF'** | Tu editor de Windows guardó los saltos de línea a la manera de Windows | Es inofensivo, no rompe nada. Haz *Commit* y *Push* normalmente |
| GitHub Desktop dice *"No local changes"* después de copiar | Pegaste los archivos en otra carpeta | Repository → Show in Explorer para abrir la carpeta correcta y pega ahí |
| **Missing or insufficient permissions** | Las reglas del Paso 3 no se publicaron | Firestore → Reglas → pega otra vez → Publicar |
| Todo parece bien pero nada se guarda, o errores raros sin explicación | Le pusiste nombre a la base de datos en el Paso 2.2 | En Firestore, si tu base de datos **no** se llama `(default)`, hay que crear otra dejando el campo de ID vacío |
| Se queda en *Cargando…* | Igual que la anterior | Igual que la anterior |
| El botón *Copiar* no copia | Safari a veces lo bloquea | La app muestra el texto abajo; selecciónalo y cópialo a mano |

**Regla de oro con GitHub Desktop:** cada vez que cambies algo son siempre tres
pasos — guardar el archivo, **Commit to main**, y **Push origin**. Si te saltas
el último, no pasa nada en internet.

Después de un *Push*, espera 1–2 minutos a que la pestaña *Actions* se ponga en
verde y **recarga la página** de tu app. Si sigues viendo lo viejo, recarga
forzando: `Ctrl`+`F5` o `Cmd`+`Shift`+`R`.

---

# Cambiar personas después

Se hace en Firebase → **Firestore Database** → pestaña **Datos**, dentro de la
colección `players`.

**Cambiar un nombre:** clic en la persona → doble clic en el campo `name` →
escríbelo → **Actualizar**.

**Sacar a alguien del grupo:** clic en la persona → cambia el campo `active` de
`true` a `false`. Deja de aparecer en las listas, pero se conserva su historial
de pagos. Sirve también para limpiar nombres duplicados.

**Convertir un invitado en miembro fijo:** cambia su campo `isGuest` a `false` y
asegúrate de que tenga `gender` con valor `M` o `F`. Si es hombre y quieres que
pague su turno, añádelo además a `meta` → `payments` → `order`.

**Añadir a alguien nuevo:** dentro de `players`, **Agregar documento**. En *ID
del documento* pon su nombre en minúsculas y sin acentos ni espacios (por
ejemplo `carlos`), y añade estos campos:

| Campo | Tipo | Valor |
|---|---|---|
| `name` | string | `Carlos` |
| `gender` | string | `M` o `F` |
| `isGuest` | boolean | `false` |
| `active` | boolean | `true` |

Si es hombre y quieres que entre en la rotación de pago, ve además a la
colección `meta` → documento `payments` → campo `order`, y añade su
identificador a la lista.

> Para invitados de una noche no hace falta nada de esto: se añaden desde la
> propia app, en la pestaña *Partido*.

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

## Cualquiera con el enlace puede entrar

No hay contraseñas, ni cuentas, ni lista de correos. Quien tenga la dirección
abre la app, escribe su nombre y puede hacer de todo. Es lo más cómodo para un
grupo de amigos, pero conviene que sepas qué implica.

**El riesgo real:** tu repositorio de GitHub es público, así que la dirección de
tu base de datos se puede encontrar. Existen robots que rastrean GitHub buscando
bases de datos abiertas. Si alguno da con la tuya, podría leer los nombres y los
marcadores, o intentar llenarla de basura.

**Lo que NO puede pasar:** no hay riesgo de que te cobren. El plan Spark no tiene
tarjeta asociada; si se superara la cuota gratuita, la app dejaría de funcionar
hasta el día siguiente, pero nadie paga nada.

**Lo que hacen las reglas para limitarlo.** Aunque cualquiera pueda escribir, las
reglas restringen *qué* se puede escribir:

- Los jugadores no se pueden borrar, solo desactivar.
- Solo se aceptan semanas con el formato correcto (`2026-W31`), así que no se
  pueden crear documentos inventados.
- Los documentos tienen un límite de tamaño.
- Cualquier ruta que la app no use está cerrada.

**Si algún día quieres cerrarlo de verdad,** la forma sería volver a activar el
inicio de sesión con Google y una lista de correos autorizados. Se puede añadir
después sin rehacer nada.

## Todos mandan igual

No hay administradores. Cualquiera puede fijar el día, reabrir la semana o
marcar un pago. Entre amigos, los permisos suelen estorbar más que ayudar.

## La app organiza, no reserva

Alguien tiene que reservar la cancha en el club a mano. Los clubes casi nunca
dejan que otras apps reserven por ellos.

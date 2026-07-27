# Cancha

App para organizar los pádel del grupo: quién puede qué día, el cuadro del
americano, los marcadores y a quién le toca pagar la cancha.

Cada **lunes a las 8:00 de la mañana, hora de Caracas**, se reinicia sola y
queda lista para organizar la semana siguiente.

---

## Antes de empezar

**Tiempo:** unos 20 minutos, una sola vez.

**Costo:** cero. No te pedirá tarjeta de crédito en ningún momento.

**No hay que instalar nada** ni saber programar. Ni terminal, ni comandos.

**Solo tú necesitas cuentas.** Una de Google (la de Gmail sirve) para crear la
base de datos, y una de GitHub para publicar la página. Tus amigos no necesitan
ninguna: abren el enlace, escriben su nombre y ya está.

Vas a usar dos servicios gratuitos:

- **Firebase** guarda la información: quién puede jugar, los marcadores, los pagos.
- **GitHub** guarda la app y la publica como página web.

Son **9 pasos**. Al final de cada uno hay una comprobación para saber si vas bien
antes de seguir.

> **Firebase rediseña sus menús cada pocos meses.** Si algo no está donde dice
> aquí, usa el buscador **Buscar productos**, arriba del todo en la barra
> lateral: escribe `Firestore` o lo que busques y te lleva directo. Ese buscador
> no se mueve.

---

# PARTE 1 — Firebase

## Paso 1. Crear el proyecto

1. Entra a [console.firebase.google.com](https://console.firebase.google.com) e
   inicia sesión con tu cuenta de Google.
2. Clic en **Crear un proyecto**.
3. Ponle un nombre, por ejemplo `padel-wb`. Firebase puede añadirle unos números
   al final para que sea único; es normal.
4. Cuando ofrezca **Google Analytics**, **desactívalo**. No hace falta.
5. Clic en **Crear proyecto** y espera medio minuto.

**Comprobación:** entras a una pantalla que dice *Hola [tu nombre]* y junto al
nombre del proyecto aparece la etiqueta **Plan Spark**. Ese es el plan gratuito.

## Paso 2. Crear la base de datos

En la barra lateral, dentro de **Categorías de producto**, despliega **Bases de
datos y almacenamiento** y elige **Firestore Database**. Clic en **Crear base de
datos**.

Se abre un asistente de tres pantallas.

### 2.1 — Seleccionar edición

Te ofrece **Edición Standard** y **Edición Enterprise**.

**Deja Standard**, que ya viene marcada. Es la del plan gratuito. Enterprise es
para empresas y no aporta nada aquí.

Clic en **Siguiente**.

### 2.2 — ID y ubicación

⚠️ **La trampa más peligrosa de toda la instalación.**

Verás un campo **ID de la base de datos** con la palabra `(default)` en gris
claro. **Eso es un texto de ejemplo: el campo está vacío y tiene que quedarse
vacío.**

Si escribes cualquier nombre ahí, la app nunca encontrará la base de datos.
No verías un error claro, solo que nada se guarda. Y no se puede renombrar
después: habría que crear otra desde cero.

En **Ubicación** deja `nam5 (United States)`. El aviso naranja de que no se puede
cambiar después es normal.

Clic en **Siguiente**.

### 2.3 — Configurar

Te ofrece **Iniciar en modo de producción** y **Comenzar en modo de prueba**.

**Deja "Iniciar en modo de producción"**, que ya viene marcada.

A la derecha verás un aviso de que *se denegarán todas las operaciones de lectura
y escritura*. **Es correcto.** Ahora mismo la base está cerrada para todos,
incluido tú; en el paso 3 la abres.

> No elijas *modo de prueba*: deja la base abierta a cualquiera durante 30 días
> y después se cierra sola de golpe, rompiendo la app sin avisar.

Clic en **Crear**.

**Comprobación:** entras a una tabla vacía que dice que no hay datos.

## Paso 3. Publicar las reglas de seguridad

Esto es lo que decide qué se puede escribir en tu base de datos. **Sin este paso
la app no funciona.**

1. Dentro de Firestore Database, arriba, entra a la pestaña **Reglas**.
2. **Borra todo** lo que haya en el recuadro.
3. Copia el bloque de aquí abajo entero y pégalo.
4. Clic en **Publicar**.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function tamanoSano() {
      return request.resource.data.size() < 40;
    }

    match /players/{id} {
      allow read: if true;
      allow create, update: if tamanoSano();
      allow delete: if false;
    }

    match /weeks/{wid} {
      allow read: if true;
      allow write: if wid.matches('^[0-9]{4}-W[0-9]{2}$');
    }

    match /sessions/{wid} {
      allow read: if true;
      allow write: if wid.matches('^[0-9]{4}-W[0-9]{2}$');
    }

    match /meta/{doc} {
      allow read: if true;
      allow write: if doc in ['payments', 'setup'] && tamanoSano();
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Comprobación:** aparece un mensaje de que las reglas se publicaron. Si sale
algo en rojo, quedó texto viejo mezclado: borra todo otra vez y vuelve a pegar.

> El archivo `firestore.rules` del proyecto es solo una copia de referencia. La
> app no lo lee: las reglas que mandan son las que publicas aquí. En Windows ese
> archivo no se abre con doble clic, pero no lo necesitas — el texto está arriba.

---

# PARTE 2 — GitHub

## Paso 4. Crear el repositorio

Un repositorio es una carpeta de archivos alojada en internet.

1. Entra a [github.com/new](https://github.com/new).
2. En **Repository name** escribe el nombre que quieras, por ejemplo `padel-wb`.
   Apúntalo: aparece en la dirección de tu app. La app detecta el nombre sola.
3. Elige **Public**.
   > Tiene que ser público para que la publicación gratuita funcione. Solo se ve
   > el código; la información del grupo vive en Firebase.
4. **No marques** ninguna casilla de abajo (README, .gitignore, licencia).
5. Clic en **Create repository**.
6. Clonalo en tu computadora con **GitHub Desktop**.

**Comprobación:** en GitHub Desktop, arriba a la izquierda aparece el nombre de
tu repositorio.

## Paso 5. Copiar los archivos

### 5.1 — Abrir la carpeta del repositorio

En GitHub Desktop, menú **Repository** → **Show in Explorer** (en Mac, *Show in
Finder*). Se abre una carpeta que parece vacía: es la correcta. Déjala abierta.

### 5.2 — Hacer visibles los archivos ocultos

⚠️ **No te saltes esto.** Entre los archivos hay una carpeta llamada
**`.github`**. Al empezar por punto, Windows y Mac **la esconden**, y sin ella la
página nunca se publica.

- **Windows:** Explorador → pestaña **Vista** → marca **Elementos ocultos**.
- **Mac:** en Finder, pulsa `Cmd` + `Shift` + `.` (punto).

Deberían aparecer `.github`, `.gitignore` y `.gitattributes`, algo transparentes.

### 5.3 — Copiar el contenido

1. Descomprime el archivo que descargaste.
2. **Entra dentro** de la carpeta `padel` que aparece.
3. Selecciona todo lo que hay dentro (`Ctrl`+`A`) y cópialo (`Ctrl`+`C`).
4. Pégalo en la carpeta del repositorio (`Ctrl`+`V`).

> **Copia el contenido, no la carpeta.** Si acabas viendo dentro del repositorio
> una sola carpeta llamada `padel`, borra y repite entrando un nivel más.

### 5.4 — Comprobar antes de seguir

Vuelve a GitHub Desktop, panel **Changes**. Deberías ver unos 25 archivos.

**Busca `.github/workflows/deploy.yml` en esa lista.**

- Si está: sigue.
- Si **no** está: los ocultos no estaban visibles. Vuelve al 5.2 y repite.

Esta comprobación evita el error más común y más difícil de diagnosticar.

### 5.5 — Guardar y enviar

Abajo a la izquierda:

1. En **Summary** escribe cualquier cosa, por ejemplo `primera version`.
2. Clic en **Commit to main**.
3. Arriba, clic en **Push origin**.

⚠️ **Commit no envía nada a internet.** Solo guarda en tu computadora. Hasta que
no toques **Push origin**, GitHub sigue viendo el repositorio vacío. Es el fallo
más frecuente con GitHub Desktop.

> Si aparece el aviso *"This diff contains a change in line endings from 'LF' to
> 'CRLF'"*, ignóralo. Es cosmético y no afecta a nada.

**Comprobación:** recarga la página del repositorio en el navegador y ves todos
los archivos.

## Paso 6. Activar la publicación

1. En tu repositorio, pestaña **Settings**.
2. Menú izquierdo, **Pages**.
3. En **Source**, elige **GitHub Actions**.

No hay que guardar, se aplica solo.

## Paso 7. Esperar a que se publique

1. Pestaña **Actions**. Verás un círculo amarillo girando.
2. Espera 1–2 minutos a que se ponga **verde ✓**.
3. Tu app está en `https://TU_USUARIO.github.io/NOMBRE_DEL_REPO/`

   Por ejemplo, usuario `samjvera` y repositorio `padel-wb`:

   ```
   https://samjvera.github.io/padel-wb/
   ```

   **La barra del final hace falta.**

Si sale una **✗ roja**, mira *Si algo falla* al final.

---

# PARTE 3 — Empezar a usarla

## Paso 8. Crear el grupo

Abre la app. La primera vez aparece **Crea tu grupo**:

1. Los ocho nombres vienen ya escritos. Cámbialos si hace falta.
2. Marca **M** o **F** en cada uno. Solo los M entran en la rotación de pago.
3. Con las flechas ↑↓ ordena a quién le toca pagar primero.
4. Clic en **Crear el grupo**.

Después te pregunta tu nombre. Escríbelo y quedas dentro.

> Esta pantalla solo aparece una vez. Nadie más la verá.

## Paso 9. Repartir el enlace

Manda la dirección por el grupo de WhatsApp. Cada uno la abre, **escribe su
nombre**, y ya está. Sin instalar nada, sin registrarse, sin contraseñas.

Da igual si escriben `Ricardo`, `ricardo` o `RICARDO`: la app los reconoce como
la misma persona, y también ignora los acentos (`Matías` = `Matias`).

Si alguien escribe un nombre nuevo —un amigo que se apunta esa semana— se añade
solo como invitado, fuera de la rotación de pago.

Diles que la guarden en la pantalla de inicio del celular: navegador → menú →
*Añadir a pantalla de inicio*.

---

# Cómo se usa cada semana

**El reinicio.** Cada lunes a las 8:00 AM hora de Caracas, la app pasa sola a una
semana nueva y la cuadrícula queda en blanco. No hace falta que nadie haga nada
ni hay servidor detrás: cada teléfono lo calcula por su cuenta, así que todos ven
el cambio en el mismo instante aunque estén en países distintos. Arriba siempre
dice cuánto falta. Lo de la semana anterior queda guardado.

**Pestaña Semana.** Cada quien toca las casillas de día y horario en que puede.
El número de la casilla es cuánta gente puede a esa hora. Cuando hay un horario
claro, cualquiera toca **Fijar este día**: eso congela la lista de los que juegan
y asigna quién paga.

**Pestaña Partido.** Toca **Armar americano** y sale el cuadro: quién juega con
quién en cada ronda, dibujado sobre una cancha. Anotas los puntos de un equipo y
el del otro se calcula solo. La tabla se ordena en vivo.

Antes de armar el cuadro puedes añadir invitados. No entran en la rotación de pago.

**Pestaña Pagos.** A quién le toca esta semana y la cola completa. Cuando pague,
tocan **Marcar como pagado**.

## No hay avisos automáticos

Es una decisión, no un olvido. La app no le escribe a nadie nunca.

En su lugar, en *Semana* y *Partido* hay un botón **Copiar mensaje para el
grupo**: arma el texto con el estado actual —qué horario va ganando, quién falta
por marcar, o la alineación y quién paga— y lo deja copiado para pegarlo en
WhatsApp.

Al fijar la noche, **Añadir al calendario** baja el evento al teléfono con avisos
3 horas y 30 minutos antes.

**Lo que implica:** si nadie abre la app, nadie se entera. Alguien tiene que
acordarse el lunes de copiar el mensaje y pegarlo en el grupo.

---

# Si algo falla

| Lo que ves | Qué pasa | Cómo se arregla |
|---|---|---|
| **Firestore está bloqueado** | Las reglas del Paso 3 no se publicaron | Firestore → Reglas → pega otra vez → Publicar |
| **Falta conectar Firebase** | `src/config.js` tiene `PEGA_AQUI` | Mira *Cambiar de proyecto de Firebase* abajo |
| Página en blanco o error 404 | No terminó de publicarse, o la dirección está mal | Espera el ✓ verde en Actions. Revisa usuario, nombre del repositorio y la **barra final** |
| **✗ roja** en Actions | Falta la carpeta `.github`, o copiaste la carpeta en vez de su contenido | Repite el Paso 5 con los ocultos visibles |
| Cambias algo y no pasa nada en GitHub | Hiciste *Commit* pero no *Push origin* | Clic en **Push origin** |
| Se queda en *Cargando…* | Las reglas no están publicadas | Igual que la primera fila |
| Te pregunta el nombre cada vez | Borraste datos del navegador, o estás en incógnito | Escríbelo otra vez. En incógnito no se guarda nada |
| Escribiste mal tu nombre | — | Toca tu nombre arriba a la derecha y vuelve a escribirlo |
| Aparecen dos personas casi iguales | Alguien lo escribió distinto | En Firestore → `players`, pon `active: false` en la sobrante |
| La semana no cambió el lunes | Tenías la app abierta desde antes | Recarga; si está abierta cambia sola en menos de un minuto |
| Aviso de *line endings LF/CRLF* | Tu editor de Windows guardó a la manera de Windows | Inofensivo. Commit y push normalmente |
| El botón *Copiar* no copia | Safari a veces lo bloquea | La app muestra el texto abajo; selecciónalo y cópialo |

**Regla de oro con GitHub Desktop:** cada cambio son tres pasos — guardar el
archivo, **Commit to main**, **Push origin**. Si te saltas el último no pasa nada.

Tras un push, espera 1–2 minutos al ✓ verde y recarga forzando: `Ctrl`+`F5`.

---

# Mantenimiento

## Actualizar la app a una versión nueva

Copia el contenido encima como en el Paso 5, y **Commit** + **Push**.

⚠️ **`src/config.js` es el único archivo con datos tuyos.** Antes de hacer commit,
ábrelo y comprueba que sigue teniendo tu `projectId` y no la palabra `PEGA_AQUI`.
Todo lo demás se puede sobrescribir sin pensar.

## Cambiar de proyecto de Firebase

Abre `src/config.js` con el **Bloc de notas** (no con Word: añade formato
invisible que rompe el archivo) y reemplaza los seis valores por los del proyecto
nuevo. Los encuentras en Firebase → **Descripción general del proyecto** →
**+ Agregar app** → icono `</>` , o si ya la registraste, en **Configuración** →
**Configuración del proyecto** → **Tus apps**.

Mantén las comillas y las comas; solo cambia lo de dentro. Luego **Commit** y
**Push**.

## Cambiar personas

En Firebase → **Firestore Database** → pestaña **Datos** → colección `players`.

- **Cambiar un nombre:** doble clic en el campo `name` → **Actualizar**.
- **Sacar a alguien:** cambia `active` de `true` a `false`. Desaparece de las
  listas pero conserva su historial. Sirve también para limpiar duplicados.
- **Convertir un invitado en miembro fijo:** pon `isGuest` en `false` y añade
  `gender` con valor `M` o `F`. Si es hombre y quieres que pague su turno,
  añádelo además a `meta` → `payments` → `order`.

Para invitados de una noche no hace falta nada: se añaden desde la app.

---

# Cosas que conviene saber

## Ocho personas en una cancha se sientan mucho

La app lo permite, pero mide mal. Con 8 rondas de 16 puntos cada uno juega 4 y se
sienta 4, y **12 de las 28 parejas posibles nunca llegan a jugar juntas**.

Números reales del generador, con una cancha:

| Jugadores | Rondas | Partidos c/u | Parejas que nunca se forman |
|---|---|---|---|
| 4 | 6 | 6 | 0 de 6 |
| 5 | 5 | 4 | 0 de 10 |
| 6 | 8 | 5–6 | 0 de 15 |
| 7 | 8 | 4–5 | 0 de 21 |
| 8 | 8 | 4 | **12 de 28** |

**Cinco y seis jugadores son el punto dulce de una cancha.** Con 5 sale un
americano perfecto: cada uno se sienta exactamente una vez y juega con cada uno
de los demás exactamente una vez.

Con **dos canchas**, 8 jugadores en 7 rondas también es perfecto.

## Los puntos M+

Cuando unos juegan más rondas que otros, a quien jugó menos se le suman 8 puntos
por cada ronda perdida: la mitad de los 16 que reparte un partido. Evita que el
marcador castigue a quien le tocó descansar más.

## La columna Diff no desempata

Con puntos fijos por partido, la diferencia se deduce de los puntos y los
partidos jugados. Dos personas con los mismos puntos y los mismos partidos tienen
forzosamente la misma diferencia. Por eso el desempate real es **quién ganó más
partidos**, y así se ordena la tabla.

## Quién paga

Paga **quien menos veces ha pagado**; si hay empate, el que esté antes en el orden
que definiste. Si te toca y no vas, no pierdes el turno: sigues arriba hasta que
juegues.

Mujeres e invitados quedan fuera del cálculo. Si una noche solo confirman mujeres
e invitados, la app lo dice y nadie avanza en la cola.

## Cualquiera con el enlace puede entrar

No hay contraseñas ni cuentas. Quien tenga la dirección abre, escribe su nombre y
puede hacer de todo, incluido entrar con el nombre de otro. Entre amigos suele dar
igual, pero conviene saberlo.

**El riesgo real:** tu repositorio es público, así que la dirección de la base de
datos se puede encontrar, y existen robots que rastrean GitHub buscando bases
abiertas. Si alguno da con la tuya podría leer los nombres y marcadores, o
intentar ensuciarla.

**Lo que no puede pasar:** que te cobren. El plan Spark no tiene tarjeta; si se
superara la cuota gratuita la app dejaría de funcionar hasta el día siguiente,
nada más.

**Lo que limitan las reglas:** los jugadores no se pueden borrar, solo se aceptan
semanas con formato válido, los documentos tienen límite de tamaño y cualquier
ruta que la app no use está cerrada. Eso convierte "pueden destruirte la base" en
"pueden ensuciar unas semanas concretas".

Si algún día quieres cerrarlo de verdad, se puede añadir inicio de sesión con
Google y lista de correos sin rehacer nada.

## Todos mandan igual

No hay administradores. Cualquiera puede fijar el día, reabrir la semana o marcar
un pago. Entre amigos, los permisos estorban más que ayudan.

## La app organiza, no reserva

Alguien tiene que reservar la cancha en el club. Los clubes casi nunca permiten
que otras apps reserven por ellos.

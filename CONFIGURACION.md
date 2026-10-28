# Configuración — App para jugadores

Guía paso a paso para dejar esto andando. Son pasos de una sola vez. Hacelos en este orden — cada uno depende del anterior.

**Mientras tanto:** ya podés ver la app funcionando con datos de ejemplo, abriendo `app-jugadores/index.html` y tocando "Ver demo sin login" (o pedile a Claude Code que te la muestre en el navegador).

---

## 0) Subir el repo a GitHub (si todavía no está)

Este repo hoy está solo en tu computadora (`git init`, sin conectar a ningún lado). Para que la app tenga una dirección web (necesaria para "Agregar a pantalla de inicio" en el celular), hace falta subirlo a GitHub.

1. Andá a [github.com](https://github.com) e iniciá sesión (si no tenés cuenta, creá una gratis con tu mail).
2. Botón verde **"New"** (repositorio nuevo). Nombre: `dashboard-liceo` (o el que quieras). Puede ser **Private** (gratis igual). **No** tildes "Add a README". Click **"Create repository"**.
3. GitHub te va a mostrar una pantalla con comandos — no los uses, pasale esto a Claude Code en esta carpeta (reemplazando la URL por la que te dio GitHub, algo como `https://github.com/tu-usuario/dashboard-liceo.git`):

   > "Conectá este repo a `<la URL que te dio GitHub>` y subilo"

## 1) Activar GitHub Pages

1. En GitHub, en tu repo: **Settings → Pages** (menú de la izquierda).
2. En "Build and deployment" → **Source**, elegí **"GitHub Actions"** (no "Deploy from a branch").
3. Listo — ya está todo armado (`.github/workflows/pages.yml`, ya en el repo) para que cada vez que se suba un cambio a `app-jugadores/`, se publique solo. La primera vez tarda ~1 minuto; después te va a aparecer la URL en esa misma pantalla de Settings → Pages, algo como `https://tu-usuario.github.io/dashboard-liceo/`. **Anotala, la necesitás en el paso 3.**

## 2) Crear el form de ingreso

En el editor de Apps Script del proyecto de la base (el mismo donde ya corriste `crearFormulario` y `migrarHistorico`):

1. Seleccioná la función **`crearFormularioIngreso`** en el desplegable de arriba y tocá ▶ Ejecutar.
2. Andá a **Ver → Registro** (o Ctrl+Enter) y copiá las dos URLs que aparecen: la del formulario publicado y la de edición. **Guardá la URL publicada, la necesitás en el paso 4.**

## 3) Crear el Client ID de Google (para el login)

Esto es lo único que requiere ir a Google Cloud — son puros clicks, no hace falta saber programar.

1. Andá a [console.cloud.google.com](https://console.cloud.google.com) con la cuenta de Google del club (o la tuya).
2. Arriba a la izquierda, **"Seleccionar proyecto" → "Proyecto nuevo"**. Nombre: `Liceo Naval App`. Crear.
3. Con ese proyecto seleccionado, buscá en la barra de arriba **"Pantalla de consentimiento de OAuth"** y entrá.
4. Tipo de usuario: **Externo** → Crear.
5. Completá: nombre de la app (`Liceo Naval — Mi Rendimiento`), tu mail en "Correo de asistencia" y en "Datos de contacto del desarrollador". **"Guardar y continuar"** en cada pantalla (Permisos y Usuarios de prueba: no hace falta tocar nada, seguí de largo).
6. Al terminar, en el resumen, tocá **"Publicar app"** (no pide revisión de Google porque solo usamos los permisos básicos de mail).
7. Menú izquierdo → **"Credenciales" → "+ Crear credenciales" → "ID de cliente de OAuth"**.
8. Tipo de aplicación: **"Aplicación web"**. Nombre: `Liceo Naval PWA`.
9. En **"Orígenes de JavaScript autorizados"**, agregá la URL de GitHub Pages del paso 1 (ej. `https://tu-usuario.github.io`, sin la barra ni lo de después).
10. **Crear**. Te va a mostrar un **Client ID** que termina en `.apps.googleusercontent.com` — **copialo, lo necesitás en el paso 4.**

## 4) Pegar las 3 cosas que faltan

Pasale esto a Claude Code, con los 3 datos que juntaste (URL de Pages del paso 1, URL del form del paso 2, Client ID del paso 3):

> "Configurá la app de jugadores: Client ID `<pegar>`, URL del form de ingreso `<pegar>`, y desplegá el backend"

Con eso, Claude Code:
- Completa `CONFIG` en `app-jugadores/app.js` (Client ID y URL del form).
- Te guía para desplegar el backend en Apps Script (**Implementar → Nueva implementación → Aplicación web → Ejecutar como "Yo" → Acceso "Cualquier usuario"**) y guarda esa URL también en `CONFIG.BACKEND_URL`.
- Guarda el mismo Client ID en las **Propiedades del script** de Apps Script (Project Settings → Script Properties → `CLIENT_ID`), para que el backend pueda verificar el login.
- Hace `git commit` + `git push` para que se publique solo.

## 5) Probar antes de avisarle a los jugadores

1. Entrá vos a la URL de GitHub Pages desde tu celular, "Agregar a pantalla de inicio", iniciá sesión con tu Gmail (el que vinculaste con el form de ingreso) — tenés que ver tus propios datos.
2. Probá con una cuenta de Google que **no** esté vinculada a ningún jugador — tiene que rechazar el acceso, sin mostrar ningún dato.
3. Recién ahí, mandale el link a los jugadores (primero que completen el form de ingreso del paso 2, después ya pueden entrar a la app).

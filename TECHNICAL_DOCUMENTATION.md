# 📖 Documentación Técnica Completa del Proyecto ("Citas Disney / Citas Gonza & Juli")

Este documento detalla la arquitectura, estructura de datos, componentes, integraciones de APIs y decisiones de diseño implementadas en el proyecto para permitir que cualquier desarrollador o agente AI continúe el trabajo sin fricciones.

---

## 🛠️ 1. Stack Tecnológico y Dependencias

- **Framework Front-end**: React `18.3.1` (Vite `6.4.3`)
- **Backend / Persistencia**: **Supabase** (Postgres + Realtime + PostgREST), sin login — ver sección 3.
- **PWA**: `vite-plugin-pwa` (Workbox) — la app es instalable y funciona offline-first. Ver sección 8.
- **Estilos**: Vanilla CSS puro (`src/styles/theme.css`) con variables CSS dinámicas y animaciones `@keyframes`.
- **Librería de Iconos**: `lucide-react`
- **Animaciones UI & Gestos**: `framer-motion`
- **Mapas Interactivos**: `leaflet` (Leaflet puro integrado mediante React `useRef` & `useEffect` para evitar la incompatibilidad de `react-leaflet@5` con React 18).
- **Efectos Festivos**: `canvas-confetti`

---

## 📂 2. Estructura del Proyecto

```
citas/
├── public/
│   └── icons/                        # Íconos de la PWA (generados con scripts/generate-icons.mjs)
├── scripts/
│   ├── check-links.mjs               # Verificador de enlaces del catálogo CABA
│   ├── generate-icons.mjs            # Genera los PNG de public/icons/ sin librerías de imagen
│   └── supabase-schema.sql           # SQL a correr una vez en el proyecto Supabase
├── src/
│   ├── components/
│   │   ├── BackgroundSparkles.jsx   # Emojis temáticos flotantes en segundo plano
│   │   ├── CandleOverlay.jsx         # Vela animada + resplandor ambiental (dos capas fijas independientes)
│   │   ├── CabaEventsModule.jsx      # Ruleta CABA, filtros por categoría y catálogo de planes con enlace a la fuente
│   │   ├── DailyCheckin.jsx          # Vista "✨ Hoy": notita de Gonza a Juli + "¿Cómo te sentís hoy?" (mood compartido vía Supabase)
│   │   ├── DateDetailModal.jsx       # Modal de detalle de cita (enlaces a Google Maps, tarjetas de cine/teatro)
│   │   ├── DateFormModal.jsx         # Modal de creación/edición de citas (Leaflet map picker, buscador cine/teatro)
│   │   ├── FullMapHuellas.jsx        # Mapa consolidado Leaflet con todos los pines de citas de CABA
│   │   ├── HistoryModule.jsx         # Vista "Nuestras Citas": Métricas, Calendario mensual, Lista y Mapa de Huellas
│   │   ├── InstallPwaGuide.jsx       # Tutorial de instalación (auto-abre 1 vez; reabre desde el botón "Instalar" del Navbar)
│   │   ├── InteractiveMapPicker.jsx  # Picker interactivo para seleccionar lat/lon o direcciones en el formulario
│   │   ├── Navbar.jsx                # Navegación segmentada + Botón Modo Vela 🕯️ + Botón Instalar 📲
│   │   └── WishlistModule.jsx        # Bucket List de pareja con conversión a Citas guardadas
│   ├── data/
│   │   └── cabaPlans.js              # Catálogo de 41 planes de CABA con dirección, precio, duración, reserva, link y mapsQuery
│   ├── services/
│   │   ├── apiService.js             # Nominatim OSM, iTunes Search API y Wikipedia Fallback API
│   │   ├── supabaseClient.js         # Cliente Supabase (sólo con la publishable/anon key)
│   │   ├── datesService.js           # CRUD + realtime de la tabla `dates`
│   │   ├── wishlistService.js        # CRUD + realtime de la tabla `wishlist`
│   │   ├── moodService.js            # CRUD + realtime de la tabla `daily_moods`
│   │   └── migrateLocalData.js       # Migración/siembra inicial de Supabase (corre una vez por navegador)
│   ├── utils/
│   │   ├── dateUtils.js              # getTodayLocalISO(): fecha de hoy en huso local (no UTC)
│   │   ├── mapUtils.js               # Tiles CartoDB Voyager + pines rosas con emoji (createPinIcon)
│   │   └── pwaUtils.js               # Detección de standalone / iOS / Android para el tutorial de instalación
│   ├── styles/
│   │   └── theme.css                 # Sistema de diseño, CSS tokens, Modo Vela romántico y responsive mobile-first
│   ├── App.jsx                       # Componente raíz: fetch inicial + realtime de Supabase, caché offline en localStorage
│   └── main.jsx                      # Punto de entrada de React
├── .env.example                      # Plantilla de variables de entorno (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
└── vite.config.js                    # Config de Vite + vite-plugin-pwa (manifest + Service Worker)
```

---

## 💾 3. Persistencia: Supabase (fuente de verdad) + localStorage (caché offline)

La app no tiene login: es para dos personas, con la **publishable/anon key** de
Supabase embebida en el bundle. La privacidad depende de que la URL de la app
y el proyecto de Supabase no se compartan públicamente, no de que la key sea
secreta (no lo es, está pensada para vivir en el navegador).

### Setup (una sola vez)

1. **Correr el SQL**: Dashboard de Supabase → **SQL Editor** → pegar y ejecutar
   [`scripts/supabase-schema.sql`](scripts/supabase-schema.sql) completo. Crea las
   3 tablas, las políticas de RLS y las agrega a la publicación de Realtime.
2. **Variables de entorno**: copiar `.env.example` a `.env` y completar con
   `Dashboard → Settings → API Keys`:
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxx
   ```
   **Nunca la secret key acá.** La secret key bypasea RLS por completo; si se
   filtra (por ejemplo pegada en un chat, un commit, o cualquier lugar no
   privado) hay que rotarla desde el dashboard.
3. **En producción** (Vercel/Netlify/etc.): cargar esas mismas 2 variables en
   la configuración de entorno del hosting — `.env` no se sube al repo
   (está en `.gitignore`), así que sin esto el build de producción no tiene
   las keys.

Si las variables de entorno faltan, la app **no se rompe**: sigue funcionando
en modo local-only (como antes de esta integración), sólo que sin sincronizar
entre dispositivos. Ver `isSupabaseConfigured` en `supabaseClient.js`.

### Tablas

| Tabla | Qué guarda | PK |
|---|---|---|
| `dates` | Citas registradas ("Nuestras Citas") | `id` (text) |
| `wishlist` | Bucket list de pareja | `id` (text) |
| `daily_moods` | Ánimo del día ("¿Cómo te sentís hoy?") — **una fila por día**, se sobreescribe si se toca otro emoji | `day` (date) |

**Esquema de cita** (`dates`, columnas `snake_case` — `datesService.js` las
mapea a `camelCase` para el resto de la app):

```json
{
  "id": "date-1722860000000",
  "title": "Merienda y Teatro en Palermo ☕🎭",
  "date": "2026-08-05",
  "time": "18:00 hs",
  "duration": "3 hs",
  "categories": ["cafe", "teatro"],
  "locations": [
    { "name": "Kiki Taller / Palermo", "lat": -34.5889, "lon": -58.4306, "fullAddress": "Patio del Liceo, Palermo, CABA" }
  ],
  "media_items": [
    { "id": "media-1", "title": "Spiderman Brand New Day", "type": "movie", "poster": "https://..." }
  ],
  "notes": "Hicimos taller de cerámica con vino y después caminamos."
}
```

**Esquema de pendiente** (`wishlist`):

```json
{
  "id": "wish-1722860000000",
  "title": "Taller de Cerámica y Vino",
  "location": "OWO Cerámica, Chacarita",
  "category": "arte",
  "emoji": "🏺",
  "notes": "Crear tazas de arcilla con copa de vino."
}
```

### Cómo fluyen los datos (`App.jsx`)

1. **Pintado instantáneo**: el estado arranca con lo último cacheado en
   `localStorage` (`citas_history_dates_v2` / `citas_wishlist_v1`), para que
   abrir la app no muestre una pantalla vacía mientras llega la red — clave
   en la PWA, con conexión mala.
2. **Migración/siembra** (`migrateLocalData.js`, corre una sola vez por
   navegador): si las tablas de Supabase están vacías, sube lo que hubiera
   en el caché local viejo (usuarios de antes de esta integración) o, si
   tampoco había nada, siembra los 2 ejemplos iniciales.
3. **Fetch inicial** de `dates`, `wishlist` y el mood de hoy.
4. **Suscripción realtime** a las 3 tablas (`subscribeToDates`,
   `subscribeToWishlist`, `subscribeToMood`): cuando el otro teléfono agrega,
   edita o borra algo, aparece solo — sin recargar.
5. **Escrituras optimistas**: cada acción (`handleSaveHistoryDate`,
   `handleAddWish`, `handleSelectMood`, etc.) actualiza el estado local al
   toque y dispara la escritura a Supabase en paralelo (no espera la
   respuesta). Si la escritura falla, sólo queda un `console.error`; la app
   no se traba — es una decisión consciente de UX (ver "offline" abajo) que
   se puede volver más estricta el día que haga falta.
6. **Si Supabase no responde** (sin conexión, tablas no creadas todavía,
   etc.): `syncState` pasa a `'offline'`, se muestra un banner
   ("📡 Sin conexión con el servidor…") y la app sigue 100% usable con el
   último dato cacheado en este dispositivo.

### Modo Vela y estado local (no van a Supabase)

`isCandleMode` es una preferencia del **dispositivo**, no de la pareja —
cada uno puede tener su celular en modo día o modo noche por separado. Se
guarda en `localStorage` (`citas_candle_mode_v1`), no en Supabase.

---

## 🔌 4. Integraciones y Servicios (`apiService.js`)

- **Búsqueda de Direcciones / Autocompletado**:
  - `searchPlaces(query)`: consume `https://nominatim.openstreetmap.org/search`. Devuelve `name`, `fullAddress`, `lat` y `lon`.
- **Búsqueda de Películas**:
  - `searchMovies(query)`: iTunes Search API (`media=movie`), con fallback a la búsqueda general de iTunes y luego a la Wikipedia API en español.
- **Búsqueda de Teatro**:
  - `searchTheatre(query)`: iTunes (`media=show`) + Wikipedia API en español.
- Los tres permiten **agregado manual instantáneo** de cualquier texto escrito si no aparece el título formal.

### Enlaces del catálogo CABA (`data/cabaPlans.js`)

Reglas obligatorias al agregar planes — verificables con `npm run check:links`:

1. **`link` sólo con URL verificada (HTTP 200)**, preferentemente el dominio propio del lugar.
   Las páginas de portales grandes (`buenosaires.gob.ar/<seccion>`, `turismo.../es/article/...`)
   se reorganizan seguido y terminan en 404 o redirigidas a `/gcaba_historico/`, que es un
   archivo muerto. Si el plan no tiene fuente propia estable, `link` va en `null` y la UI
   muestra sólo el botón de Maps.
2. **Nunca Instagram como fuente**: `instagram.com` devuelve HTTP 200 incluso para cuentas
   inexistentes, así que un link roto pasa desapercibido en cualquier chequeo automático.
3. **`mapsQuery` es obligatorio en todos los planes.** Alimenta el botón de Google Maps, que
   funciona siempre y sobrevive a que el sitio del lugar se caiga. Es la red de seguridad.

```bash
npm run check:links   # sale con código 1 si hay algún enlace roto o sin mapsQuery
```

### Mapas (`utils/mapUtils.js`)
- Tiles **CartoDB Voyager** (base sin etiquetas + capa de etiquetas encima), no el OSM estándar: la paleta clara combina con el diseño rosa.
- Ambas capas viven en `.leaflet-tile-pane` (diferenciadas por `zIndex`) para que el filtro de inversión del Modo Vela las afecte por igual.
- `createPinIcon(emoji)` genera un `L.divIcon` con un pin rosa y el emoji de la categoría, en vez del marcador azul por defecto.

---

## 🎨 5. Sistema de Diseño & Modo Vela Romántico 🕯️

- **Modo Día (Light Mode)**:
  - Gradient radial: `radial-gradient(circle at 50% 10%, #ffd6e0 0%, #ffeaf0 45%, #f4e8f7 100%)`
  - Tarjetas blancas con bordes sutiles rosas y sombras flotantes.
- **Modo Vela Romántico (Dark Candlelight Mode)**:
  - Clase contenedora: `.candle-mode-active`
  - Gradient radial nocturno: `radial-gradient(circle at 50% 20%, #2e1030 0%, #150a1d 50%, #0d0414 100%)`
  - Resplandor cálido de vela: Componente `CandleOverlay.jsx` con resplandor ambiental y llama animada mediante `@keyframes flameFlickerReal`.
  - Override de colores: bloque completo de `.app-container.candle-mode-active …` que cubre textos, superficies, chips, toggles, formularios, calendario, autocompletado, popups de mapa y navegación.
  - **Contraste verificado**: 0 textos por debajo de 4.5:1 (WCAG AA) en modo noche.
  - Los tiles del mapa se invierten por CSS (`filter: invert(1) hue-rotate(185deg) …`) para no plumbar el prop `isCandleMode` por todo el árbol.

- **Token `--pink-text` (`#c2185b`)**:
  - `--primary-pink` (`#ff4770`) sobre fondos claros da 3.3:1, insuficiente para texto chico.
  - Los chips, badges y etiquetas pequeñas usan `--pink-text`, que llega a ~6:1 sin perder identidad de marca.
  - **Pendiente conocido**: `.btn-disney-primary` (blanco sobre el rosa de marca) queda en 3.29:1 con texto de 16.8px. Es el color principal de la app; cambiarlo es una decisión de diseño.

---

## 🛡️ 6. Casos Borde y Manejo de Errores Resueltos

1. **Formatos de Ubicación Heterogéneos en Citas**:
   - En `FullMapHuellas.jsx` y `DateDetailModal.jsx`, las ubicaciones pueden venir como un objeto `{ name, lat, lon }` o como un string `location: "Palermo"`.
   - **Solución**: Sanitización con `typeof loc === 'string' ? loc : (loc?.name || 'Lugar')` para evitar errores de renderizado.
2. **Despliegue del Mapa Leaflet**:
   - Se utiliza `mapInstanceRef.current` para garantizar que no se instancien múltiples mapas sobre el mismo elemento del DOM durante re-renders.
   - El callback del padre se guarda en un `useRef` y el efecto depende de `[]`. Antes dependía de `[onSelectLocation]`, que el padre recreaba en cada render: el mapa se destruía y reconstruía con cada tecla escrita en el formulario.
   - `map.invalidateSize()` diferido 250 ms porque el mapa se monta dentro de un modal animado.

3. **Pines sin coordenadas guardadas**:
   - Se dispersan con un offset **determinístico** derivado del texto (`stableOffset`). Con `Math.random()` los pines saltaban de lugar en cada re-render.

4. **Popups de Leaflet**:
   - Se arman con HTML crudo, así que todo texto del usuario pasa por `escapeHtml()` antes de inyectarse.

5. **Fechas**:
   - `getTodayLocalISO()` en vez de `new Date().toISOString()`: en Argentina (UTC-3) el ISO adelanta el día desde las 21:00 y las citas nuevas quedaban pre-cargadas con la fecha de mañana.

6. **LocalStorage corrupto**:
   - `loadCache()` valida que lo parseado sea un arreglo antes de usarlo como estado.

7. **Secret key de Supabase**:
   - Sólo la publishable/anon key entra al código (`supabaseClient.js`). La
     secret key bypasea Row Level Security por completo y nunca debe estar en
     el frontend ni en el repo — si se comparte por accidente (chat, commit),
     hay que rotarla en el dashboard.

8. **Escritura optimista vs. tablas todavía no creadas**:
   - Si alguien usa la app antes de correr `supabase-schema.sql`, los fetches
     fallan con `PGRST205` ("no existe la tabla"). La UI no se rompe: cae a
     `syncState = 'offline'` y sigue funcionando con los datos de muestra /
     lo último cacheado, mostrando el banner correspondiente.

---

## 📲 8. PWA e instalación en el celular

- **`vite-plugin-pwa`** genera el Service Worker (Workbox) y el
  `manifest.webmanifest` en el build; no hay código de SW escrito a mano.
- **Caché de red** (`vite.config.js → workbox.runtimeCaching`):
  - `*.supabase.co` → `NetworkOnly`. Los datos de la pareja **nunca** se
    sirven desde caché: o son los datos reales o se ve el banner de "sin
    conexión", nunca una mezcla vieja disfrazada de actual.
  - Tiles del mapa (CartoDB / OSM) → `CacheFirst`, para que el mapa abra
    offline con lo último visto.
  - Google Fonts → `CacheFirst` de larga duración.
- **Íconos** (`public/icons/`): generados con
  `node scripts/generate-icons.mjs` — un corazón blanco sobre el degradado
  rosa de la app, dibujado a mano con la fórmula implícita de la curva de
  corazón y armado como PNG crudo (`zlib` de Node, sin ninguna librería de
  imágenes). Regenerar si cambia la paleta de la app.
  - `icon-192.png` / `icon-512.png` (purpose `any`)
  - `icon-512-maskable.png` (corazón más chico y centrado, para la "safe
    zone" que recortan Android/iOS al aplicar la máscara del ícono)
  - `apple-touch-icon.png` (180×180, referenciado a mano en `index.html`:
    **iOS ignora los íconos del manifest** para el ícono de inicio, sólo lee
    `<link rel="apple-touch-icon">`)
- **Tutorial de instalación** (`InstallPwaGuide.jsx` + `utils/pwaUtils.js`):
  - Detecta standalone con `matchMedia('(display-mode: standalone)')` +
    `navigator.standalone` (esto último sólo existe en iOS Safari).
  - Detecta iOS (incluye iPad en iPadOS 13+, que se identifica como Mac con
    touch) para mostrar los pasos exactos de Safari: Compartir → Agregar a
    inicio → Agregar. **iOS no dispara `beforeinstallprompt`**, así que ahí
    no hay forma de un botón que instale solo — sólo se puede explicar los
    pasos.
  - En Android, si el navegador sí dispara `beforeinstallprompt`, se guarda
    el evento y se ofrece un botón "Instalar ahora" con `prompt()` nativo;
    si no, muestra los pasos manuales (⋮ → Instalar app).
  - Se auto-abre una vez por navegador (flag `citas_pwa_banner_seen_v1` en
    localStorage) si la app no está corriendo instalada. Después queda
    disponible a demanda desde el botón "📲 Instalar" del Navbar (oculto
    automáticamente si ya se está usando la app instalada), que dispara un
    evento de `window` (`open-pwa-guide`) en vez de pasar estado por props.

---

## 🚀 9. Comandos Útiles para Futuros Agentes

- **Iniciar Servidor de Desarrollo**:
  ```bash
  npm run dev
  ```
- **Verificar Compilación de Producción**:
  ```bash
  npm run build
  ```
- **Regenerar íconos de la PWA** (si cambia la paleta):
  ```bash
  node scripts/generate-icons.mjs
  ```
- **Verificar enlaces del catálogo CABA**:
  ```bash
  npm run check:links
  ```

# Jesús Olguín — Portfolio

Sitio personal de Jesús Olguín — Full-Stack Developer & IoT Solutions, con una segunda
landing de servicios técnicos (calefacción, piscinas, electricidad industrial, etc.).

Sitio estático servido con Express, desplegado en Railway.

## Estructura

```
.
├── index.html              # Portfolio de desarrollador (dark / glass / cyan)
├── servicios.html          # Landing de servicios técnicos (brutalista naranja/navy)
├── server.js               # Express: estáticos + ruta /servicios + fallback SPA
├── package.json
├── manifest.json           # PWA
├── gen-icons.mjs           # Genera los iconos PWA desde logo-isotipo.png (usa sharp)
├── logo-isotipo.png        # Logo (fuente de los iconos)
├── icon-192.png / icon-512.png / apple-touch-icon.png
├── servicios-qr-limpio.png # QR usado en servicios.html
└── README.md
```

> **Fuente de verdad única: la raíz del repo.** Railway despliega desde la raíz
> (Root Directory vacío). No hay carpeta `portfolio/` duplicada.

## Desarrollo local

```bash
npm install
npm start
# → http://localhost:3000
```

## Rutas

- `/` → portfolio de desarrollador (`index.html`)
- `/servicios` y `/servicios.html` → landing de servicios técnicos
- Cualquier otra ruta → fallback a `index.html`

## Scripts

| Script         | Qué hace                                              |
|----------------|------------------------------------------------------|
| `npm start`    | Levanta el server Express en el puerto `PORT` (3000) |
| `npm run icons`| Regenera los iconos PWA desde `logo-isotipo.png`     |

## Deploy en Railway

- Conectado a este repo (`jesus1942/portfolio`), branch `main`.
- **Root Directory:** vacío (raíz del repo).
- Auto Deploy activado: cada push a `main` redespliega.
- Build: Nixpacks detecta `package.json` → `npm install` → `npm start`.
- `.railwayignore` excluye `*.md`, `.git` y `gen-icons.mjs` del deploy.

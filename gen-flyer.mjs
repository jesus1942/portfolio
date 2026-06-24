// Genera flyers de servicios técnicos en 3 formatos cada uno, para 2 decks:
//   HOGAR Y OBRA          → flyer-hogar-a4.pdf, -instagram.png, -stories.png
//   INDUSTRIA Y TALLER    → flyer-industria-a4.pdf, -instagram.png, -stories.png
//
// Hilo conductor: misma identidad visual (brutalista naranja/navy), mismo header/footer
// con WhatsApp + QR. Cambia el pill del sector, los servicios y el tagline del CTA.
//
// Uso: node gen-flyer.mjs

import puppeteer from 'puppeteer';
import QRCode from 'qrcode';

const WA = 'https://wa.me/5492804018359?text=Hola%20Jes%C3%BAs%2C%20vi%20tu%20flyer%20de%20servicios%20y%20quiero%20consultarte.';
const qrDataUrl = await QRCode.toDataURL(WA, { margin: 1, scale: 8, color: { dark: '#0f172a', light: '#ffffff' } });

const css = `
  *,*::before,*::after { box-sizing: border-box; margin:0; padding:0; }
  :root { --orange:#f97316; --navy:#0f172a; --slate:#475569; --cream:#fff7ed; --paper:#fafaf7; --white:#fff; }
  body { font-family: 'Space Grotesk','Inter',system-ui,sans-serif; color:var(--navy); background:var(--paper); -webkit-font-smoothing:antialiased; }
  .page { padding: 36px 32px; display:flex; flex-direction:column; gap:22px; min-height:100vh; position:relative; overflow:hidden; }
  .page::before { content:''; position:absolute; top:0; left:0; right:0; height:22px;
    background: repeating-linear-gradient(-45deg, var(--orange) 0 16px, var(--navy) 16px 32px); }

  .head { margin-top: 32px; display:flex; flex-direction:column; gap:8px; }
  .pill { align-self:flex-start; border:3px solid var(--orange); background:var(--cream); color:var(--orange);
    font-weight:900; font-size:12px; letter-spacing:.12em; text-transform:uppercase; padding:6px 10px; }
  .brand { font-weight:900; font-size:30px; letter-spacing:-.02em; line-height:1; text-transform:uppercase; color:var(--orange); }
  .brand small { display:block; font-size:13px; letter-spacing:.18em; color:var(--navy); margin-top:6px; font-weight:700; }
  h1 { font-weight:900; font-size:54px; line-height:.96; letter-spacing:-.035em; text-transform:uppercase; }
  h1 span { color:var(--orange); }
  .tag { color:var(--slate); font-size:15px; font-weight:600; margin-top:6px; }

  .grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .card { padding:16px 16px 14px; background:var(--white); border:4px solid var(--navy); box-shadow:6px 6px 0 var(--navy); display:flex; flex-direction:column; gap:6px; }
  .card .icon { width:34px; height:34px; flex:0 0 auto; border:3px solid var(--navy); background:var(--orange); box-shadow:3px 3px 0 var(--navy); display:grid; place-items:center; color:var(--white); }
  .card .icon svg { width:20px; height:20px; }
  .card .row { display:flex; align-items:center; gap:10px; }
  .card h3 { font-weight:900; font-size:17px; letter-spacing:-.01em; text-transform:uppercase; }
  .card p { color:var(--slate); font-size:12.5px; line-height:1.35; font-weight:500; }
  .card.full { grid-column: 1 / -1; }

  .cta { margin-top:auto; padding:18px 20px; background:var(--navy); color:var(--white); border:5px solid var(--navy); box-shadow:7px 7px 0 var(--orange); display:grid; grid-template-columns:1fr 132px; gap:18px; align-items:center; }
  .cta h2 { font-weight:900; font-size:26px; line-height:1; text-transform:uppercase; letter-spacing:-.02em; }
  .cta h2 span { color:var(--orange); }
  .cta p { font-size:13px; color:#cbd5e1; margin-top:6px; }
  .cta .phone { display:inline-block; margin-top:12px; background:var(--orange); color:var(--white); padding:10px 14px; font-weight:900; letter-spacing:.06em; text-transform:uppercase; font-size:14px; border:3px solid var(--white); }
  .qr { background:var(--white); padding:8px; border:4px solid var(--white); display:grid; place-items:center; }
  .qr img { width:100%; height:auto; display:block; image-rendering: pixelated; }
  .qr-cap { text-align:center; font-size:10px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:#cbd5e1; margin-top:6px; }

  /* IG post 1080×1350 */
  .ig-post .brand { font-size:38px; } .ig-post h1 { font-size:64px; }
  .ig-post .grid { gap:16px; } .ig-post .card h3 { font-size:20px; } .ig-post .card p { font-size:13.5px; }
  .ig-post .cta { grid-template-columns: 1fr 160px; } .ig-post .cta h2 { font-size:30px; }

  /* IG story 1080×1920 — single column */
  .ig-story .grid { grid-template-columns: 1fr; gap:14px; }
  .ig-story .brand { font-size:42px; } .ig-story h1 { font-size:72px; }
  .ig-story .card { padding:18px 20px; }
  .ig-story .card h3 { font-size:22px; } .ig-story .card p { font-size:15px; }
  .ig-story .cta { grid-template-columns: 1fr 180px; } .ig-story .cta h2 { font-size:34px; }
`;

const DECKS = [
  {
    id: 'hogar',
    pill: 'Hogar y obra · Puerto Madryn',
    title: 'Instalación y<br>mantenimiento <span>sin improvisar</span>.',
    subtitle: 'Calderas · Calentadores de piscina · Bombas · Riego · Automatismos',
    ctaH: 'Contame qué <span>necesitás resolver</span>.',
    ctaP: 'Diagnóstico antes de presupuestar · Trabajo prolijo · Pensado para durar.',
    services: [
      { title:'Calderas', desc:'Instalación, mantenimiento y reparación. Calefacción central, piso radiante, radiadores, distribución y purgado.',
        icon:'<path d="M6 4h12v16H6z M9 7h6 M9 11h6 M9 15h6"/>' },
      { title:'Calentadores de piscina', desc:'Instalación, conexión hidráulica, puesta en marcha y mantenimiento del circuito de calefacción de piscinas.',
        icon:'<path d="M4 14c2-2 4 2 6 0s4-2 6 0 4 2 4 2 M4 18c2-2 4 2 6 0s4-2 6 0 4 2 4 2 M12 2v6 M9 5l3-3 3 3"/>' },
      { title:'Bombas y filtrado', desc:'Bombas de filtrado, presurización y riego. Cisternas, automatismos de nivel, comandos y protecciones.',
        icon:'<circle cx="12" cy="12" r="6"/><path d="M12 6V3 M12 21v-3 M6 12H3 M21 12h-3 M9 12l3-3 3 3"/>' },
      { title:'Riego', desc:'Sistemas de riego automatizado, distribución, programadores, válvulas, bombas y conexiones.',
        icon:'<path d="M12 3v6 M9 6h6 M4 12c2 2 4 0 4 0s2 2 4 0 4 2 4 2 4-2 4-2 M5 18l3 3 m11-3l-3 3 M12 12v9"/>' },
      { title:'Automatismos', desc:'Sensores, flotantes, presostatos, temporizadores y contactores. Tableros eléctricos y control para que el sistema trabaje mejor.',
        icon:'<rect x="4" y="6" width="16" height="12" rx="1"/><path d="M8 10v4 M12 10v4 M16 10v4"/>' },
    ],
  },
  {
    id: 'industria',
    pill: 'Industria y taller · Puerto Madryn',
    title: 'Soldadura,<br>naval y <span>electricidad industrial</span>.',
    subtitle: 'Mantenimiento naval · Eléctrico industrial · Tableros · Soldadura',
    ctaH: 'Trabajo técnico, <span>sin improvisar</span>.',
    ctaP: 'Manos antes que teclado · Diagnóstico y propuesta clara · Pensado para durar.',
    services: [
      { title:'Mantenimiento naval', desc:'Reparación de cascos y estructuras, cubierta y tuberías a bordo, mantenimiento general en astillero y a flote.',
        // ship hull + waves
        icon:'<path d="M3 15h18l-3 5H6z M12 3v12 M8 7l4-2 4 2 M2 18c2 1 3 0 4 1 M18 19c1-1 2 0 4 1"/>' },
      { title:'Eléctrico industrial', desc:'Instalaciones eléctricas en planta, protecciones, contactores y comandos. Diagnóstico de fallas y reordenamiento.',
        // lightning bolt
        icon:'<path d="M13 3 L7 13 L11 13 L9 21 L17 10 L13 10 Z"/>' },
      { title:'Tableros eléctricos', desc:'Armado y mejora de tableros para bombas, calefacción, filtrado y automatismos. Control de cargas y maniobra segura.',
        // panel with switches
        icon:'<rect x="4" y="4" width="16" height="16" rx="1"/><circle cx="9" cy="9" r="1.2"/><circle cx="15" cy="9" r="1.2"/><path d="M7 14h4 M13 14h4 M7 17h4 M13 17h4"/>' },
      { title:'Soldadura · 5 procesos', desc:'SMAW · MIG/MAG · TIG · GTAW · FCAW. Estructuras, reparaciones y mantenimiento industrial.',
        // welding torch with sparks
        icon:'<path d="M14 4 L20 4 L20 10 L14 10 Z M14 7 L4 17 L7 20 L17 10 M3 20l2-2 M5 13l-2-2"/>' },
    ],
  },
];

const renderServices = (services) => services.map((s,i)=>`
  <div class="card${i===4?' full':''}">
    <div class="row">
      <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${s.icon}</svg></div>
      <h3>${s.title}</h3>
    </div>
    <p>${s.desc}</p>
  </div>
`).join('');

const html = (deck, variant) => `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;900&display=swap" rel="stylesheet">
<style>${css}</style></head>
<body class="${variant}">
  <div class="page">
    <header class="head">
      <span class="pill">${deck.pill}</span>
      <div class="brand">Jesús Olguín<small>SERVICIOS TÉCNICOS</small></div>
      <h1>${deck.title}</h1>
      <p class="tag">${deck.subtitle}</p>
    </header>

    <section class="grid">${renderServices(deck.services)}</section>

    <div class="cta">
      <div>
        <h2>${deck.ctaH}</h2>
        <p>${deck.ctaP}</p>
        <span class="phone">+54 9 280 401-8359</span>
      </div>
      <div>
        <div class="qr"><img src="${qrDataUrl}" alt="QR WhatsApp"/></div>
        <div class="qr-cap">Escaneá para chatear</div>
      </div>
    </div>
  </div>
</body></html>`;

const browser = await puppeteer.launch({ headless:'new', args:['--no-sandbox','--disable-setuid-sandbox'] });

async function renderPNG(deck, variant, width, height, out) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  await page.setContent(html(deck, variant), { waitUntil: 'networkidle0' });
  await page.screenshot({ path: out, type: 'png' });
  await page.close();
  console.log('✓', out, `(${width}×${height} @2x)`);
}

async function renderPDF(deck, out) {
  const page = await browser.newPage();
  await page.setContent(html(deck, 'a4'), { waitUntil: 'networkidle0' });
  await page.pdf({ path: out, format: 'A4', printBackground: true, margin: { top:0,right:0,bottom:0,left:0 } });
  await page.close();
  console.log('✓', out, '(A4 PDF)');
}

for (const deck of DECKS) {
  await renderPDF(deck,            `flyer-${deck.id}-a4.pdf`);
  await renderPNG(deck, 'ig-post',  1080, 1350, `flyer-${deck.id}-instagram.png`);
  await renderPNG(deck, 'ig-story', 1080, 1920, `flyer-${deck.id}-stories.png`);
}

await browser.close();

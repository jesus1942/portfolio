// Flyer "Desarmando cosas" — statement para Instagram con foto de trabajo real.
// Misma identidad brutalista naranja/navy del resto de la marca.
//   flyer-desarmando-instagram.png  (1080×1350, post feed 4:5)
//   flyer-desarmando-stories.png    (1080×1920, stories / reels 9:16)
//
// Uso: node gen-flyer-desarmando.mjs

import puppeteer from 'puppeteer';
import sharp from 'sharp';
import QRCode from 'qrcode';

const WA = 'https://wa.me/5492804018359?text=Hola%20Jes%C3%BAs%2C%20vi%20tu%20publicaci%C3%B3n%20y%20quiero%20consultarte.';
const qrDataUrl = await QRCode.toDataURL(WA, { margin: 1, scale: 6, color: { dark: '#0f172a', light: '#ffffff' } });

// Foto principal: rotar por EXIF y, si quedó horizontal, forzar vertical.
const photoSrc = '/root/.claude/uploads/52bad491-fd6d-5a87-8eb9-297709dd2c7b/64d25790-IMG_2846.jpeg';
let buf = await sharp(photoSrc).rotate().resize({ width: 1400, withoutEnlargement: true }).jpeg({ quality: 84 }).toBuffer();
let meta = await sharp(buf).metadata();
if (meta.width > meta.height) {
  // las del iPhone vienen rotadas en píxeles → forzar 90° antihorario para que "arriba sea arriba"
  buf = await sharp(buf).rotate(-90).jpeg({ quality: 84 }).toBuffer();
  meta = await sharp(buf).metadata();
}
const photoDataUrl = 'data:image/jpeg;base64,' + buf.toString('base64');
console.log('foto procesada:', meta.width + 'x' + meta.height);

const css = `
  *,*::before,*::after { box-sizing: border-box; margin:0; padding:0; }
  :root { --orange:#f97316; --navy:#0f172a; --slate:#475569; --cream:#fff7ed; --paper:#fafaf7; --white:#fff; }
  body { font-family: 'Space Grotesk','Inter',system-ui,sans-serif; color:var(--navy); background:var(--paper); -webkit-font-smoothing:antialiased; }
  .page { padding: 48px 38px 38px; display:flex; flex-direction:column; gap:18px; min-height:100vh; position:relative; overflow:hidden; }
  .page::before { content:''; position:absolute; top:0; left:0; right:0; height:26px;
    background: repeating-linear-gradient(-45deg, var(--orange) 0 18px, var(--navy) 18px 36px); }

  .pill { align-self:flex-start; border:4px solid var(--orange); background:var(--cream); color:var(--orange);
    font-weight:900; font-size:14px; letter-spacing:.14em; text-transform:uppercase; padding:8px 14px; }

  h1 { font-weight:900; font-size:96px; line-height:.84; letter-spacing:-.04em; text-transform:uppercase; }
  h1 .accent { color:var(--orange); }
  h1 .dot { color:var(--orange); }

  .photo-frame { border:5px solid var(--navy); box-shadow:12px 12px 0 var(--orange); overflow:hidden; flex:1 1 auto; min-height:520px; }
  .photo-frame img { width:100%; height:100%; object-fit:cover; display:block; }

  .sub { font-weight:700; font-size:22px; line-height:1.25; color:var(--navy); }
  .sub b { color:var(--orange); }

  .cta { padding:18px 22px; background:var(--navy); color:var(--white); border:5px solid var(--navy); box-shadow:7px 7px 0 var(--orange); display:grid; grid-template-columns:1fr 110px; gap:18px; align-items:center; }
  .cta .brand { font-weight:900; font-size:22px; line-height:1; text-transform:uppercase; color:var(--orange); }
  .cta .brand small { display:block; font-size:11px; letter-spacing:.18em; color:#cbd5e1; font-weight:700; margin-top:6px; }
  .cta .phone { display:inline-block; margin-top:12px; background:var(--orange); color:var(--white); padding:9px 13px; font-weight:900; letter-spacing:.06em; text-transform:uppercase; font-size:13.5px; border:3px solid var(--white); }
  .qr { background:var(--white); padding:6px; border:4px solid var(--white); display:grid; place-items:center; }
  .qr img { width:100%; height:auto; display:block; image-rendering: pixelated; }

  /* Stories 1080×1920 — más aire, foto más grande */
  .ig-story h1 { font-size:130px; }
  .ig-story .pill { font-size:16px; padding:10px 18px; }
  .ig-story .photo-frame { min-height: 740px; }
  .ig-story .sub { font-size:28px; }
  .ig-story .cta { padding:24px 26px; grid-template-columns:1fr 150px; }
  .ig-story .cta .brand { font-size:28px; }
  .ig-story .cta .phone { font-size:16px; padding:12px 16px; }
`;

const html = (variant) => `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;900&display=swap" rel="stylesheet">
<style>${css}</style></head>
<body class="${variant}">
  <div class="page">
    <span class="pill">Trabajo real · Puerto Madryn</span>
    <h1>Desarmando<br><span class="accent">cosas</span><span class="dot">.</span></h1>

    <div class="photo-frame">
      <img src="${photoDataUrl}" alt="Trabajo en campo — desarmando un container"/>
    </div>

    <p class="sub">Saber cómo funcionan <b>es la mitad del trabajo.</b></p>

    <div class="cta">
      <div>
        <div class="brand">Jesús Olguín<small>SERVICIOS TÉCNICOS</small></div>
        <span class="phone">+54 9 280 401-8359</span>
      </div>
      <div>
        <div class="qr"><img src="${qrDataUrl}" alt="QR WhatsApp"/></div>
      </div>
    </div>
  </div>
</body></html>`;

const browser = await puppeteer.launch({ headless:'new', args:['--no-sandbox','--disable-setuid-sandbox'] });

async function renderPNG(variant, width, height, out) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  await page.setContent(html(variant), { waitUntil: 'networkidle0' });
  await page.screenshot({ path: out, type: 'png' });
  await page.close();
  console.log('✓', out, `(${width}×${height} @2x)`);
}

await renderPNG('ig-post',  1080, 1350, 'flyer-desarmando-instagram.png');
await renderPNG('ig-story', 1080, 1920, 'flyer-desarmando-stories.png');

await browser.close();

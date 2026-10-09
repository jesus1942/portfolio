"""Saca capturas de la versión publicada de cada proyecto del portfolio.

Abre cada URL en Chromium (Playwright), espera a que cargue y guarda un .webp
en la raíz del repo con el nombre que usa index.html. Si un sitio no responde,
conserva la captura anterior y sigue con el resto.

Uso:  python scripts/capturas.py            (todas)
      python scripts/capturas.py pool tutti (solo esas)
"""
import asyncio
import io
import sys
from pathlib import Path

from PIL import Image
from playwright.async_api import async_playwright

RAIZ = Path(__file__).resolve().parent.parent

# clave: (url, archivo, ancho_viewport, alto_viewport, ancho_final, alto_final, pasos extra)
PROYECTOS = {
    "pool":     ("https://poolcalculator-production.up.railway.app/", "screenshot-pool.webp", 1280, 800, 1000, 625, None),
    "activaqr": ("https://activaqr.net/", "screenshot-activaqr.webp", 1280, 730, 1000, 570, None),
    "buques":   ("https://jesus1942.github.io/visorPortuariaBuques/", "screenshot-buques.webp", 1280, 800, 1000, 625, ["esperar_datos", "clic:Cerrar"]),
    "modular":  ("https://jesus1942.github.io/ModularLive/", "screenshot-modular.webp", 1280, 800, 1000, 625, None),
    "bible":    ("https://jesus1942.github.io/readBible/", "screenshot-bible.webp", 1280, 800, 1000, 625, ["clic:Continuar sin cuenta", "clic:Cerrar"]),
    "bcra":     ("https://bcra-consultas-pwa-production.up.railway.app/", "screenshot-bcra.webp", 1280, 800, 1000, 625, None),
    "tarjetas": ("https://jesus1942.github.io/tarjetitas/", "screenshot-tarjetitas.webp", 1280, 800, 1000, 625, None),
    "tutti":    ("https://jesus1942.github.io/tutti-frutti/?backend=https://tutti-frutti-backend.onrender.com",
                 "screenshot-tutti.webp", 1280, 800, 1000, 625, None),
    "fortaleza": ("https://jesus1942.github.io/fortaleza-roja/", "screenshot-fortaleza.webp", 1280, 720, 1000, 563, "jugar"),
}


async def clic_texto(page, texto):
    """Hace clic en un botón/enlace visible con ese texto (si existe): cierra avisos, entra como invitado, etc."""
    loc = page.get_by_text(texto, exact=False)
    try:
        if await loc.count():
            await loc.first.click(timeout=4000)
            await page.wait_for_timeout(1500)
    except Exception:
        pass


async def mejor_vista(page):
    """Fortaleza Roja genera un mundo distinto en cada partida. Gira en el lugar y se queda
    con el ángulo que muestra más profundidad (centro más oscuro por la niebla = pasillo largo),
    para no terminar mirando una pared."""
    mejor, puntaje = None, None
    for _ in range(10):
        png = await page.screenshot(type="png")
        img = Image.open(io.BytesIO(png)).convert("L")
        w, h = img.size
        centro = img.crop((int(w * .38), int(h * .25), int(w * .62), int(h * .55)))
        brillo = sum(centro.getdata()) / (centro.width * centro.height)
        if 4 < brillo and (puntaje is None or brillo < puntaje):
            mejor, puntaje = png, brillo
        await page.keyboard.down("KeyE")
        await page.wait_for_timeout(240)
        await page.keyboard.up("KeyE")
        await page.wait_for_timeout(250)
    return mejor


async def pasos_extra(page, modos):
    """Devuelve una captura propia (png) si el paso la eligió, o None para usar la pantalla actual."""
    for modo in (modos if isinstance(modos, list) else [modos]):
        if modo == "esperar_datos":
            # la app de buques lee la planilla de la APPM: espero a que deje de decir "Cargando"
            for _ in range(20):
                txt = await page.inner_text("body")
                if "Cargando" not in txt and "Obteniendo" not in txt:
                    break
                await page.wait_for_timeout(1000)
        elif modo.startswith("clic:"):
            await clic_texto(page, modo[5:])
        elif modo == "jugar":
            await page.click("#play")
            await page.wait_for_timeout(900)
            return await mejor_vista(page)
    return None


async def capturar(browser, clave):
    url, archivo, vw, vh, fw, fh, modo = PROYECTOS[clave]
    page = await browser.new_page(viewport={"width": vw, "height": vh}, device_scale_factor=1)
    try:
        try:
            await page.goto(url, wait_until="networkidle", timeout=60000)
        except Exception:
            # algunos sitios dejan conexiones abiertas (websockets, polling): alcanza con "load"
            await page.goto(url, wait_until="load", timeout=60000)
        await page.wait_for_timeout(3500)  # animaciones de entrada, fuentes, datos
        png = await pasos_extra(page, modo) if modo else None
        if png is None:
            png = await page.screenshot(type="png")
        img = Image.open(io.BytesIO(png)).convert("RGB")
        # recorte desde arriba con la proporción final y escalado
        ratio = fw / fh
        alto = min(img.height, round(img.width / ratio))
        img = img.crop((0, 0, img.width, alto)).resize((fw, fh), Image.LANCZOS)
        img.save(RAIZ / archivo, "WEBP", quality=80, method=6)
        print(f"ok   {clave:10s} -> {archivo}")
        return True
    except Exception as e:
        print(f"FALLA {clave:10s} ({url}): {e}")
        return False
    finally:
        await page.close()


async def main():
    claves = sys.argv[1:] or list(PROYECTOS)
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
        resultados = [await capturar(browser, c) for c in claves]
        await browser.close()
    print(f"{sum(resultados)}/{len(resultados)} capturas actualizadas")


if __name__ == "__main__":
    asyncio.run(main())

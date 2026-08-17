# Publicar un objeto desde Telegram

La primera versión del formulario no sube fotos. Acepta título, categoría,
barrio, descripción opcional y duración; la foto queda para una segunda fase.

## Workflow de n8n

Importar [`sv_publish_item.workflow.json`](./sv_publish_item.workflow.json) en
n8n. El workflow crea una fila en `sv_items` mediante la credencial existente
`NocoDB Token account`.

Antes de activarlo:

1. Abrir el nodo `Validate Telegram and item`.
2. Sustituir `PEGA_AQUI_EL_TOKEN_REAL_DE_PUCELO_BOT` por el token real de
   `Pucelo Bot`. El token solo debe existir dentro de n8n; no se debe guardar en
   este repositorio ni en el navegador.
3. Confirmar que el nodo `Create NocoDB row` conserva la credencial y la tabla
   `Segunda Vida`.
4. En NocoDB, crear estos campos en `sv_items` antes de activar el workflow:
   `consent_accepted` (Checkbox), `consent_version` (SingleLineText) y
   `consent_at` (DateTime).
5. Activar el workflow.

El endpoint de producción será:

```text
POST https://tasks.nukeador.com/webhook/segundavida/publish
```

El frontend envía JSON con esta forma:

```json
{
  "initData": "<Telegram.WebApp.initData>",
  "item": {
    "title": "Mesa auxiliar",
    "category": "Hogar",
    "zone": "Delicias - Canterac",
    "description": "En buen estado.",
    "duration_days": 14
  },
  "consent": {
    "accepted": true,
    "version": "sv-publish-2026-08-16-v1"
  }
}
```

La identidad se valida con el HMAC de `initData`; no se confía en
`initDataUnsafe`, en un `telegram_id` enviado por el navegador ni en una
cabecera que el cliente pueda falsificar. `owner_telegram_id` se guarda solo en
NocoDB y no se devuelve al catálogo público.

El workflow también exige el consentimiento explícito, comprueba su versión y
genera `consent_at` en n8n. La fecha no se acepta desde el navegador.

El identificador público se genera en un nodo separado con bytes aleatorios:
`sv-${crypto.randomBytes(6).toString('base64url')}`. Nunca se construye a partir
del Telegram user ID. El valor se escribe en `public_id` y, mientras dure la
compatibilidad, también en `item-id`.

Las filas antiguas que tengan un `item-id` como
`sv-2191395-1786900112374` deben editarse una vez en NocoDB y recibir un valor
opaco, por ejemplo `sv-k8Qm2LxP`, en ambos campos. Las URLs antiguas se aceptan
solo como fallback de navegación y se normalizan a `/i/<public_id>/`; no se
generan enlaces nuevos con el valor antiguo.

## Generación de la ficha después de publicar

El workflow de publicación debe responder primero con `public_id` (manteniendo
`item_id` como alias temporal) y después dejar preparada una llamada al
generador. Este repositorio no activa esa llamada desde n8n ni contiene
credenciales reales.

Contrato de llamada para n8n:

```json
{
  "public_id": "sv-k8Qm2LxP",
  "items": [{
    "public_id": "sv-k8Qm2LxP",
    "title": "Mesa auxiliar",
    "description": "En buen estado.",
    "category": "Hogar",
    "zone": "Delicias - Canterac",
    "status": "available",
    "expires_at": "2026-09-01T12:00:00+02:00",
    "image_url": null,
    "owner_display_name": "Vecindad",
    "owner_username": "vecino",
    "interest_count": 0
  }]
}
```

El runner autorizado debe guardar ese JSON temporalmente y ejecutar:

```bash
python3 scripts/generate_static_pages.py \
  --input public-item.json \
  --output-dir generated-site \
  --site-url https://segundavida.aldeapucela.org
```

El generador produce `i/<public_id>/index.html`, `sitemap.xml`, `robots.txt` y
un `404.html` de fallback. Rechaza campos sensibles, escapa HTML y usa la
marca de SegundaVida como imagen fallback. Para probar manualmente basta con
usar el ejemplo anterior en un archivo local; no hace falta tocar NocoDB.

La alternativa sin commits automáticos es ejecutar manualmente o por schedule
`.github/workflows/generate-static-pages.yml`, configurando la variable de
repositorio `SEGUNDAVIDA_PUBLIC_ITEMS_URL` con un endpoint público ya
proyectado. El workflow prepara y despliega Pages cuando la fuente del sitio se
ha cambiado a **GitHub Actions**; no llama a n8n por sí mismo.

## Respuestas

Éxito:

```json
{
  "ok": true,
  "item_id": "sv-k8Qm2LxP",
  "status": "available",
  "message": "Publicado correctamente"
}
```

Error de validación:

```json
{
  "ok": false,
  "valid": false,
  "error": "zone_invalid"
}
```

La configuración actual permite probar desde `localhost:8000` y desde
`https://segundavida.aldeapucela.org`. La foto no se envía en esta versión.

## Enlace para abrir la Mini App

El botón del formulario usa `https://t.me/pucelobot?startapp=segundavida`,
configurado en `js/telegram.js`. Este formato abre directamente la Main Mini
App; por tanto, si mantienes la Main App desactivada, Telegram abrirá el chat
del bot y la persona tendrá que pulsar el botón `SegundaVida` del menú.

Si quieres un enlace directo sin convertirla en la app principal, crea un
`short_name` para la Mini App en BotFather y usa el formato
`https://t.me/pucelobot/<short_name>?startapp=offer`. Después solo hay que
actualizar una línea en `js/telegram.js`. El botón de menú que ya has
configurado sigue siendo válido y es la ruta principal para entrar.

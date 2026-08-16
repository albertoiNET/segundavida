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
del Telegram user ID.

Las filas antiguas que tengan un `item-id` como
`sv-2191395-1786900112374` deben editarse una vez en NocoDB y recibir un valor
opaco, por ejemplo `sv-k8Qm2LxP`. La URL antigua dejará de funcionar; así no se
mantiene publicado el identificador sensible.

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

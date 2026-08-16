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
4. Activar el workflow.

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
  }
}
```

La identidad se valida con el HMAC de `initData`; no se confía en
`initDataUnsafe`, en un `telegram_id` enviado por el navegador ni en una
cabecera que el cliente pueda falsificar. `owner_telegram_id` se guarda solo en
NocoDB y no se devuelve al catálogo público.

## Respuestas

Éxito:

```json
{
  "ok": true,
  "item_id": "sv-123456789-...",
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

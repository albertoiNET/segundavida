# Marcar una publicación como entregada

Importa [`sv_complete_item.workflow.json`](./sv_complete_item.workflow.json) en
n8n. Crea el endpoint:

```text
POST https://tasks.nukeador.com/webhook/segundavida/complete
```

El workflow usa la credencial existente `NocoDB Token account`, busca la fila
en la tabla `Segunda Vida`, comprueba la firma de `Telegram.WebApp.initData` y
solo permite cambiar la publicación si `owner_telegram_id` coincide con la
persona autenticada. Al completar escribe:

- `status = completed`
- `completed_at =` fecha actual generada por n8n

El nodo de validación contiene la constante `BOT_TOKEN`. Pega ahí el mismo
token privado que ya tienes en el nodo Code de `/whoami`; no lo pegues en el
repositorio ni en el navegador. La credencial `Pucelo Bot` no se puede leer
desde un nodo Code de n8n, por lo que no puede recuperarse automáticamente
desde esa credencial. Como el nodo Code necesita HMAC, n8n también debe tener
permitido el módulo `crypto` con `NODE_FUNCTION_ALLOW_BUILTIN=crypto`.

Después de importar:

1. Abre `Validate Telegram initData` y sustituye
   `PEGA_AQUI_EL_TOKEN_REAL_DE_PUCELO_BOT` por el token privado de `Pucelo Bot`.
2. Comprueba que la credencial del nodo `Search rows` y `Update NocoDB row` es
   `NocoDB Token account`.
3. Comprueba que la tabla seleccionada es `Segunda Vida` y que contiene los
   campos `Id`, `item-id`, `owner_telegram_id`, `status` y `completed_at`.
4. Activa el workflow.

El frontend ya envía este cuerpo:

```json
{
  "initData": "<Telegram.WebApp.initData>",
  "item_id": "sv-123456789-..."
}
```

Respuesta correcta:

```json
{
  "ok": true,
  "item_id": "sv-123456789-...",
  "status": "completed",
  "completed_at": "2026-08-16T12:00:00.000Z",
  "message": "Marcado como entregado"
}
```

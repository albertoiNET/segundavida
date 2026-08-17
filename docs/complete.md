# Gestionar el estado de una publicación

Importa [`sv_complete_item.workflow.json`](./sv_complete_item.workflow.json) en
n8n. El workflow crea un único endpoint para las tres acciones:

Si solo necesitas reemplazar el nodo NocoDB, puedes importar
[`sv_complete_update_node.json`](./sv_complete_update_node.json). Debe recibir
un item con `Id` (la clave técnica de NocoDB), `status` y `completed_at`. Para
reactivar una publicación, `status` será `available` y `completed_at` será
`null`.

```text
POST https://tasks.nukeador.com/webhook/segundavida/complete
```

El workflow usa la credencial existente `NocoDB Token account`, busca la fila
en la tabla `Segunda Vida`, comprueba la firma de `Telegram.WebApp.initData` y
permite cambiar la publicación si `owner_telegram_id` coincide con la persona
autenticada o si la identidad aparece activa con rol `admin` en el Data Table
`Segunda Vida - Permisos`. La acción recibida puede ser `complete`, `reopen` o `hide`. En el
nodo `Update NocoDB row`, el campo **Row ID Value** debe quedar exactamente así:

```text
{{ $json.Id }}
```

Al completar escribe:

- `status = completed`
- `completed_at =` fecha actual generada por n8n

Al reabrir escribe:

- `status = available`
- `completed_at = null`

Al borrar escribe:

- `status = hidden`
- conserva `completed_at` si la publicación ya estaba entregada

El borrado es una ocultación reversible para administración y auditoría: la
fila no se elimina físicamente. Las publicaciones ocultas dejan de aparecer
en el catálogo, en su ficha pública y en `Mis publicaciones`. El workflow
dispara además la regeneración de las fichas estáticas mediante GitHub Actions.

El nodo de validación lee `TELEGRAM_BOT_TOKEN` desde `$vars` y, como fallback,
desde `$env`; no hay que repetir el secreto en cada nodo. La credencial
`Pucelo Bot` sigue disponible para nodos Telegram, pero n8n no la expone
automáticamente al sandbox de un nodo Code. Como el nodo Code necesita HMAC,
n8n también debe tener permitido el módulo `crypto` con
`NODE_FUNCTION_ALLOW_BUILTIN=crypto`.

Después de importar:

1. Configura una variable privada de proyecto llamada `TELEGRAM_BOT_TOKEN` con
   el valor actual del token de `Pucelo Bot` (o la variable de entorno con ese
   nombre) y no la guardes en este repositorio.
2. Comprueba que la credencial del nodo `Search rows` y `Update NocoDB row` es
   `NocoDB Token account`.
3. Comprueba que la tabla seleccionada es `Segunda Vida` y que contiene los
   campos `Id`, `item-id`, `owner_telegram_id`, `status` y `completed_at`.
   En `Update NocoDB row`, pon `{{ $json.Id }}` en **Row ID Value**.
4. Comprueba que `Dispatch static page regeneration` usa la credencial
   `GitHub account`. Si no quieres regenerar fichas estáticas desde este
   workflow, puedes desactivar ese nodo y mantener la regeneración programada.
5. Activa el workflow.

El frontend ya envía este cuerpo:

```json
{
  "initData": "<Telegram.WebApp.initData>",
  "item_id": "k8Qm2LxP",
  "action": "complete"
}
```

Para marcarla de nuevo como disponible, el frontend envía la misma petición
con `"action": "reopen"`.

Para ocultarla sin marcarla como entregada, el frontend envía la misma petición
con `"action": "hide"`.

Respuesta correcta al completar:

```json
{
  "ok": true,
  "item_id": "k8Qm2LxP",
  "status": "completed",
  "completed_at": "2026-08-16T12:00:00.000Z",
  "message": "Marcado como entregado"
}
```

Respuesta correcta al reactivar:

```json
{
  "ok": true,
  "item_id": "k8Qm2LxP",
  "status": "available",
  "completed_at": null,
  "message": "Publicación reactivada"
}
```

Respuesta correcta al ocultar:

```json
{
  "ok": true,
  "item_id": "k8Qm2LxP",
  "status": "hidden",
  "completed_at": null,
  "message": "Publicación borrada"
}
```

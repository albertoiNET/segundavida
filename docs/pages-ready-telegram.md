# Publicación de fichas: Pages ready → Telegram

La publicación de una ficha ya no espera dentro de n8n a que GitHub Pages se
propague. El workflow de publicación dispara `generate-static-pages.yml` con
el `item_id` y devuelve la respuesta al frontend. GitHub Actions:

1. genera la ficha y comprueba que el HTML local contiene el `item_id` y los
   metadatos necesarios;
2. despliega GitHub Pages y comprueba la URL pública con reintentos;
3. llama al webhook fijo de n8n cuando la ficha está realmente disponible.

El workflow `Segunda Vida - Pages ready → Telegram` busca la fila por
`item-id`, comprueba `telegram_message_id`, vuelve a verificar la ficha y
publica en Telegram. Después guarda el identificador del mensaje en la
columna existente `telegram_message_id`, de modo que un callback repetido sea
idempotente. No requiere columnas nuevas.

## Configuración necesaria

Configura una credencial de tipo `Header Auth` en n8n y úsala en el nodo
`Pages ready webhook`:

- nombre del header: `X-SegundaVida-Pages-Token`;
- valor: un secreto generado para este callback.

Guarda exactamente ese mismo valor en GitHub como secret del repositorio:
`SEGUNDAVIDA_N8N_CALLBACK_TOKEN`. La credencial del Webhook hace la
autenticación directamente en n8n; no depende de variables de proyecto ni de
una licencia de pago.

El webhook de producción es:

`https://tasks.nukeador.com/webhook/segundavida/pages-ready`

El callback rechaza peticiones sin el header
`X-SegundaVida-Pages-Token`, con un `item_id` inválido o sin fila coincidente.
Si Telegram ya tiene `telegram_message_id`, responde correctamente sin
duplicar la publicación.

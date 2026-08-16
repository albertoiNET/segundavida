# Autenticación Telegram · HITO 8

La web pública puede consultar el catálogo sin iniciar sesión. Cualquier acción
que cree o modifique datos —ofrecer un objeto, marcarlo como finalizado o
mostrar interés— debe exigir una identidad Telegram validada por n8n.

## Contrato del frontend

El frontend lee únicamente `Telegram.WebApp.initData` y lo envía al backend:

```text
POST https://tasks.nukeador.com/webhook/segundavida/whoami
Content-Type: application/json
```

Body:

```json
{
  "initData": "query_id=...&user=...&auth_date=...&hash=..."
}
```

El cliente está preparado en [`js/auth.js`](../js/auth.js). No guarda el
`initData`, no lo manda a Matomo y no usa `initDataUnsafe` para autorizar nada.

Respuesta válida mínima:

```json
{
  "valid": true,
  "telegram_id": 123456789,
  "first_name": "Pepe",
  "username": "pepe"
}
```

Respuesta sin identidad válida:

```json
{
  "valid": false,
  "mode": "public"
}
```

## Workflow n8n

Crear el workflow `SV · Validate Telegram User`:

```text
Webhook (POST /segundavida/whoami)
  -> Code: validar initData
  -> Respond to Webhook
```

Puedes importarlo directamente desde
[`docs/sv_validate_telegram_user.workflow.json`](./sv_validate_telegram_user.workflow.json).
Después de importarlo, revisa el nombre del webhook y activa el workflow.

El Webhook debe permitir estos orígenes:

```text
https://segundavida.aldeapucela.org
http://localhost:8000
http://127.0.0.1:8000
```

El workflow importable espera el token en la variable privada de entorno
`TELEGRAM_BOT_TOKEN`. Nunca debe pegarse en `index.html`, `js/`, NocoDB, el CSV
o el repositorio. El nodo Code usa el módulo nativo `crypto`; si tu instancia
self-hosted lo bloquea, permite únicamente ese módulo con
`NODE_FUNCTION_ALLOW_BUILTIN=crypto` y reinicia n8n.

## Validación obligatoria en n8n

El nodo de backend debe:

1. Rechazar la petición si falta `initData` o no es una cadena.
2. Interpretar `initData` como query string y extraer `hash` y `auth_date`.
3. Construir `data_check_string` con todos los campos salvo `hash`, ordenados
   alfabéticamente y separados por salto de línea.
4. Calcular la firma HMAC-SHA-256 siguiendo el procedimiento oficial de
   Telegram, usando el token del bot en el servidor, y compararla en tiempo
   constante con `hash`.
5. Rechazar datos antiguos comprobando `auth_date` con una tolerancia corta
   (por ejemplo, 10 minutos para este endpoint).
6. Devolver únicamente `telegram_id`, `first_name` y `username` después de
   validar. No devolver el `initData` ni el token.

La misma validación debe repetirse en cada endpoint que escriba datos. La
respuesta de `whoami` sirve para la interfaz, pero no sustituye la autorización
del endpoint de publicación.

## Reglas que aplicaremos al formulario

- El propietario se obtiene del `telegram_id` validado por n8n; nunca del body
  enviado por el navegador.
- `category` solo acepta las categorías configuradas en NocoDB.
- `title`, `description` y `expires_at` se validan de nuevo en n8n.
- Los endpoints de escritura no devolverán campos privados de NocoDB.
- No habrá token persistente en `localStorage` ni secretos en GitHub Pages.

## Prueba de aceptación

Cuando el workflow esté activo:

1. Abrir la mini app desde el botón de Telegram: debe responder `valid: true`.
2. Abrir `http://localhost:8000/`: debe mantenerse en modo público sin llamar a
   `whoami`.
3. Probar un `initData` modificado: n8n debe responder `valid: false`.
4. Probar un `auth_date` antiguo: n8n debe rechazarlo.

Referencia: [Telegram Mini Apps · Validating data received via the Mini App](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app).

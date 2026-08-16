# SegundaVida · Aldea Pucela

Frontend público de SegundaVida, una iniciativa de Aldea Pucela para facilitar
que objetos que ya no se necesitan puedan tener una segunda vida.

## Estado

Proyecto en **HITO 8 — Autenticación Telegram** del plan técnico incremental.
El catálogo público ya está conectado al workflow de n8n y la siguiente
dependencia es validar la identidad antes de habilitar publicaciones.

La estructura inicial contiene:

- `index.html`: primera página técnica del frontend.
- `css/app.css`: estilos base, tokens visuales iniciales y responsive.
- `js/app.js`: punto de entrada JavaScript y actualización de estados.
- `js/telegram.js`: detección mínima del entorno Telegram Mini App.
- `js/auth.js`: envío controlado de `Telegram.WebApp.initData` al endpoint de identidad.
- `js/api.js`: cliente del catálogo y de los webhooks de n8n.
- `js/analytics.js`: wrapper de Matomo, inactivo hasta asignar un Site ID.
- `css/tokens.css`: tokens compartidos de color, tipografía, geometría y tema.
- `docs/design-system.md`: auditoría visual y reglas de uso.
- `docs/analytics.md`: decisión y activación pendiente de Matomo.
- `data/sv_items.csv`: CSV listo para importar la tabla inicial de NocoDB.
- `docs/nocodb.md`: campos, tipos y contrato público de n8n.
- `docs/auth.md`: contrato, validaciones y reglas de seguridad de Telegram.
- `docs/sv_complete_item.workflow.json`: workflow importable para marcar y
  reactivar objetos desde `Mis publicaciones`.
- `docs/complete.md`: configuración del webhook `POST /segundavida/complete`.

## Desarrollo local

El proyecto no necesita dependencias para esta primera fase. Puede servirse
localmente con cualquier servidor HTTP estático, por ejemplo:

```bash
python3 -m http.server 8000
```

Después, abrir `http://localhost:8000/` en el navegador.

## Integración n8n

`js/api.js` consulta el catálogo público mediante `/data`. La llamada de
identidad solo se realiza dentro de Telegram cuando existe `initData`; el
backend `SV · Validate Telegram User` todavía debe crearse y activarse en n8n.

La tabla `sv_items` ya está creada en NocoDB a partir del CSV y el endpoint
público de n8n proyecta solo los campos seguros del catálogo.

## Analítica

El HITO 6 integra Matomo mediante un wrapper propio y el `siteId 27` de
SegundaVida, sin exponer credenciales ni enviar identificadores personales.

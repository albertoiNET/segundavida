# SegundaVida · Aldea Pucela

Frontend público de SegundaVida, una iniciativa de Aldea Pucela para facilitar
que objetos que ya no se necesitan puedan tener una segunda vida.

## Estado

Proyecto en **HITO 6 — Matomo básico** del plan técnico incremental.

La estructura inicial contiene:

- `index.html`: primera página técnica del frontend.
- `css/app.css`: estilos base, tokens visuales iniciales y responsive.
- `js/app.js`: punto de entrada JavaScript y actualización de estados.
- `js/telegram.js`: detección mínima del entorno Telegram Mini App.
- `js/api.js`: cliente mínimo para el ping de n8n.
- `js/analytics.js`: wrapper de Matomo, inactivo hasta asignar un Site ID.
- `css/tokens.css`: tokens compartidos de color, tipografía, geometría y tema.
- `docs/design-system.md`: auditoría visual y reglas de uso.
- `docs/analytics.md`: decisión y activación pendiente de Matomo.

## Desarrollo local

El proyecto no necesita dependencias para esta primera fase. Puede servirse
localmente con cualquier servidor HTTP estático, por ejemplo:

```bash
python3 -m http.server 8000
```

Después, abrir `http://localhost:8000/` en el navegador.

## Integración n8n

`js/api.js` consulta el workflow `SV · Ping` en producción y espera una
respuesta JSON con `ok: true` y `service: "SegundaVida"`. No se realiza todavía
autenticación ni ninguna otra llamada a backend.

La base de datos NocoDB se incorporará en el hito de modelo de datos, con un
CSV preparado para importar.

## Analítica

El HITO 6 integra Matomo mediante un wrapper propio y el `siteId 27` de
SegundaVida, sin exponer credenciales ni enviar identificadores personales.

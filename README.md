# SegundaVida · Aldea Pucela

Frontend público de SegundaVida, una iniciativa de Aldea Pucela para facilitar
que objetos que ya no se necesitan puedan tener una segunda vida.

## Estado

Proyecto en **HITO 4 — Ping real con n8n** del plan técnico incremental.

La estructura inicial contiene:

- `index.html`: primera página técnica del frontend.
- `css/app.css`: estilos base, tokens visuales iniciales y responsive.
- `js/app.js`: punto de entrada JavaScript y actualización de estados.
- `js/telegram.js`: detección mínima del entorno Telegram Mini App.
- `js/api.js`: cliente mínimo para el ping de n8n.

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

El siguiente paso manual es abrir la Mini App desde Pucelobot y confirmar que
el estado aparece como `n8n: Conectado ✓`. La base de datos NocoDB se incorporará
en el hito de modelo de datos, con un CSV preparado para importar.

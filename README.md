# SegundaVida · Aldea Pucela

Frontend público de SegundaVida, una iniciativa de Aldea Pucela para facilitar
que objetos que ya no se necesitan puedan tener una segunda vida.

## Estado

Proyecto en **HITO 3 — Mini App mínima** del plan técnico incremental.

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

## Próximo hito

El HITO 4 añadirá el primer ping entre la Mini App y n8n. La URL se dejará en
`js/api.js` únicamente después de crear y activar el workflow `SV · Ping`.
No se realiza todavía autenticación ni ninguna otra llamada a backend.

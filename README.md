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
- `docs/sv_get_item.workflow.json`: workflow importable para `GET
  /segundavida/item/:public_id`, con proyección pública y 404 seguro.
- `docs/static-pages-design.md`: diseño de fichas indexables, rutas, contrato
  público, migración de IDs y límites de seguridad.
- `scripts/generate_static_pages.py`: generador local determinista de fichas
  `/i/<public_id>/`, sitemap, robots y fallback 404.
- `.github/workflows/generate-static-pages.yml`: ejecución manual/programada
  opcional sin commits periódicos ni credenciales en el repositorio.

## Desarrollo local

El proyecto no necesita dependencias para esta primera fase. Puede servirse
localmente con cualquier servidor HTTP estático, por ejemplo:

```bash
python3 -m http.server 8000
```

Después, abrir `http://localhost:8000/` en el navegador.

Una ficha generada se abre en `http://localhost:8000/i/<public_id>/`. Si no
existe el directorio generado, la app sigue funcionando como catálogo y el
endpoint individual intenta hidratar la ficha. Las URLs históricas
`#item=<id>` y `/objetos/<id>` se redirigen en el navegador a `/i/<id>/`; no se
usan para nuevos enlaces.

## Integración n8n

`js/api.js` consulta el catálogo público mediante `/data`. La llamada de
identidad solo se realiza dentro de Telegram cuando existe `initData`; el
backend `SV · Validate Telegram User` todavía debe crearse y activarse en n8n.

La tabla `sv_items` ya está creada en NocoDB a partir del CSV y el endpoint
público de n8n proyecta solo los campos seguros del catálogo.

## Fichas estáticas y GitHub Pages

El campo canónico es `public_id`, opaco y estable. `item-id` se mantiene como
alias de lectura durante la migración de filas antiguas;
las nuevas publicaciones deben escribir ambos campos con el mismo valor
aleatorio generado en n8n. Nunca uses un Telegram user ID para formar una URL.

Para generar fichas con datos reales:

```bash
python3 scripts/generate_static_pages.py \
  --source-url https://tasks.nukeador.com/webhook/segundavida/data \
  --output-dir .generated-site \
  --site-url https://segundavida.aldeapucela.org
```

El repositorio no contiene objetos ficticios. La generación manual debe usar un
JSON real proyectado por N8N o el endpoint público real.

El contrato completo de NocoDB/n8n, incluido el endpoint individual
`GET /webhook/segundavida/item/<public_id>`, está en
[`docs/nocodb.md`](docs/nocodb.md) y [`docs/publish.md`](docs/publish.md).
Después de `/publish`, n8n debe invocar el generador con la proyección pública
del objeto; el repositorio deja esa integración preparada pero no la dispara.

GitHub Pages está configurado actualmente desde `main`. Para evitar commits
automáticos de páginas generadas, configura Pages en **GitHub Actions** y usa
`.github/workflows/generate-static-pages.yml`, que prepara y despliega el sitio
desde el artefacto generado. La ejecución necesita la variable de repositorio
`SEGUNDAVIDA_PUBLIC_ITEMS_URL` o una URL introducida manualmente; sin ella el
job termina sin generar ni publicar datos.

## Analítica

El HITO 6 integra Matomo mediante un wrapper propio y el `siteId 27` de
SegundaVida, sin exponer credenciales ni enviar identificadores personales.

# Fichas públicas estáticas y datos vivos

## Objetivo

SegundaVida mantiene un frontend estático que puede abrirse como Mini App de
Telegram y como web normal. Las fichas públicas se publican como HTML en
`/i/<public_id>/index.html`, que GitHub Pages sirve también como la ruta limpia
`/i/<public_id>/`. Ese HTML contiene título, descripción inicial, imagen,
canonical y metadatos para buscadores y redes sociales. El JavaScript vuelve a
consultar la API al abrir la ficha y es la única fuente de verdad para estado,
disponibilidad, botones, intereses y cualquier dato privado.

No se crean nuevas URLs con hash ni bajo `/objetos/`. Se aceptan como
compatibilidad las URLs históricas `#item=<id>` y `/objetos/<id>`; el frontend
las normaliza a la ruta canónica cuando puede hacerlo.

## Identificador público

`public_id` es un valor opaco, estable y aleatorio generado por n8n antes de
crear la fila en NocoDB. No se calcula a partir de `telegram_id`, `chat_id`,
timestamp ni ningún otro identificador de Telegram. El campo recomendado en
NocoDB es `public_id` (`SingleLineText`, obligatorio, único). Durante la
migración, `item-id` se acepta como alias de lectura para no romper registros
de prueba ni los endpoints existentes; las nuevas publicaciones deben escribir
ambos campos con el mismo valor mientras se completa la migración. El
generador rechaza IDs que parezcan contener datos sensibles.

Los fixtures `sv-demo-001` y `sv-demo-002` se conservan como registros ocultos
compatibles. Al activar el flujo, asigna a cada fila un `public_id` opaco (por
ejemplo, `sv-k8Qm2LxP`, generado aleatoriamente) y deja `item-id` durante la
transición. Nunca se debe poner un Telegram user ID en ninguno de los dos
campos.

## Contratos de API

Se mantienen `GET /data`, `POST /publish`, `POST /complete` y `POST /mine`.
La proyección pública de `/data` y del nuevo endpoint individual solo puede
contener:

```json
{
  "id": "sv-k8Qm2LxP",
  "title": "Silla de escritorio",
  "description": "En buen estado.",
  "category": "Hogar",
  "zone": "Delicias",
  "status": "available",
  "created_at": "2026-08-16T10:00:00+02:00",
  "expires_at": "2026-09-15T23:59:00+02:00",
  "image_url": null,
  "owner_display_name": "Vecindad",
  "owner_username": "vecino",
  "interest_count": 0
}
```

El endpoint individual recomendado es `GET /item/<public_id>` (o el mismo
webhook con esa ruta). Debe responder `200` con `{ok:true,item}` para
`available`, `completed` y `expired`, y `404` con `{ok:false,error:"not_found"}`
si no existe o está oculto. Nunca devuelve `telegram_id`, `owner_telegram_id`,
`telegram_chat_id`, `telegram_thread_id`, `initData` ni secretos.

Para tolerar despliegues graduales, el cliente reconoce `public_id` primero y
`item-id` como alias antiguo. El valor normalizado siempre se expone como
`id`, y toda navegación nueva se construye con `/i/<id>`.

## Generación y despliegue

`scripts/generate_static_pages.py` es un generador determinista sin
dependencias externas. Lee un JSON de objetos públicos o llama al endpoint
configurado, crea `i/<id>/index.html`, `sitemap.xml` y `robots.txt`, escapa
texto y atributos HTML, valida URLs de imagen `http(s)` y aplica la imagen de
marca como fallback. La salida se puede generar en un directorio temporal para
que n8n la suba como artefacto o la entregue a un job de GitHub Actions.

Contrato de invocación local:

```bash
python3 scripts/generate_static_pages.py \
  --input examples/public-items.json \
  --output-dir .generated-site \
  --site-url https://segundavida.aldeapucela.org
```

Contrato para n8n después de `/publish`: enviar un JSON con `public_id` (o
`item_id` durante la transición), los campos públicos ya proyectados y, si se
quiere generar solo una ficha, `items` con un único elemento. n8n debe ejecutar
el generador en un runner autorizado o invocar el workflow de GitHub Actions
con un artefacto firmado; no se guardan credenciales en el repositorio y este
repositorio no dispara todavía ese flujo automáticamente.

GitHub Pages está documentado para cambiar de la fuente actual `main` a
`GitHub Actions` si se desea publicar el resultado generado sin commits
periódicos. El workflow incluido permite ejecución manual y programada como
opción; su job es deliberadamente neutral respecto a secretos, NocoDB y n8n.

## Seguridad y límites

El HTML generado es una previsualización indexable y fallback. No se incrustan
botones de contacto basados en datos no validados ni identificadores privados.
Al hidratarse, la app consulta la ficha individual y solo habilita acciones con
la respuesta viva. Si la API cae, la ficha conserva su contenido inicial, pero
marca el estado operativo como no verificable y no permite acciones.

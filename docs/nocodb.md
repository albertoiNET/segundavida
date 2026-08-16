# Modelo de datos de SegundaVida en NocoDB

## Tabla inicial: `sv_items`

Importar [`data/sv_items.csv`](../data/sv_items.csv) para crear la tabla nueva.
Incluye dos registros placeholder con `status=hidden`: sirven para que NocoDB
detecte valores y para probar el flujo, pero nunca aparecerán en el catálogo
público.

### Campos y tipos recomendados

| Campo | Tipo NocoDB | Requerido | Uso |
| --- | --- | --- | --- |
| `item-id` | SingleLineText, primary key | Sí | Identificador estable generado por n8n |
| `title` | SingleLineText | Sí | Título visible |
| `description` | LongText | Sí | Descripción del objeto |
| `category` | SingleSelect | Sí | `Hogar`, `Infantil`, `Libros`, `Tecnología`, `Ropa`, `Otros` |
| `zone` | SingleLineText | Sí | Zona aproximada, no dirección exacta |
| `owner_telegram_id` | SingleLineText | Sí | Identidad privada de Telegram |
| `owner_display_name` | SingleLineText | Sí | Nombre público mostrado |
| `owner_username` | SingleLineText | No | Username opcional |
| `status` | SingleSelect | Sí | `available`, `completed`, `expired`, `hidden` |
| `created_at` | DateTime | Sí | Fecha de publicación |
| `updated_at` | DateTime | Sí | Última modificación |
| `expires_at` | DateTime | Sí | Fin de disponibilidad |
| `completed_at` | DateTime | No | Cuándo se finalizó |
| `image_url` | URL | No | Primera imagen pública |
| `telegram_chat_id` | SingleLineText | No | Referencia privada para n8n |
| `telegram_thread_id` | SingleLineText | No | Referencia privada para n8n |
| `telegram_message_id` | SingleLineText | No | Referencia privada para n8n |
| `interest_count` | Number | Sí | Contador agregado, valor inicial `0` |

Telegram IDs se guardan como texto para evitar problemas de precisión o
limitaciones de tamaño en campos numéricos. No se crea todavía el estado
`reserved` ni la tabla de intereses; esta última llegará cuando implementemos
`Me interesa`.

## Importación en NocoDB

1. Crear o seleccionar la base `SegundaVida`.
2. Elegir `Import CSV` y subir `data/sv_items.csv`.
3. Nombrar la tabla `sv_items`.
4. Revisar los tipos según la tabla anterior, especialmente `DateTime`,
   `SingleSelect`, `URL` y `Number`.
5. Marcar `item-id` como primary key y crear una vista `Public catalog`.
6. En esa vista filtrar `status = available` y ordenar por `created_at`
   descendente.

Después de probar el flujo, puedes eliminar los dos registros `sv-demo-001` y
`sv-demo-002`, o conservarlos mientras permanezcan ocultos.

## Contrato público de n8n

El endpoint provisional que ya está conectado es:

```text
GET /webhook/segundavida/data
```

Ahora mismo devuelve el formato crudo de NocoDB (`id` interno + `fields`). El
frontend lo normaliza para poder probar el catálogo, pero antes de introducir
datos reales hay que hacer que n8n proyecte solo los campos públicos.

El contrato final recomendado será:

```text
GET /webhook/segundavida/items
```

Flujo previsto:

```text
Webhook
  -> NocoDB: listar sv_items
  -> filtrar status=available y expires_at futuro
  -> mapear solo campos públicos
  -> Respond to Webhook
```

La respuesta no debe devolver Telegram IDs, chats, hilos ni mensajes. El nombre
interno de NocoDB (`item-id`) se transforma en `id` en la API pública. Contrato
inicial de cada objeto:

```json
{
  "id": "sv-...",
  "title": "Silla de escritorio",
  "description": "Silla giratoria en buen estado.",
  "category": "Hogar",
  "zone": "Delicias",
  "status": "available",
  "created_at": "2026-08-16T10:00:00+02:00",
  "expires_at": "2026-09-15T23:59:00+02:00",
  "image_url": null,
  "owner_display_name": "Pepe",
  "interest_count": 0
}
```

La respuesta completa del endpoint puede ser:

```json
{
  "ok": true,
  "items": [],
  "total": 0
}
```

Los datos privados solo se usarán dentro de n8n para publicar en Telegram,
gestionar intereses y resolver acciones del propietario.

En el nodo Code de n8n, acceder al campo de NocoDB y normalizarlo así:

```javascript
{
  id: row["item-id"],
  title: row.title,
  description: row.description,
  category: row.category,
  zone: row.zone,
  status: row.status,
  created_at: row.created_at,
  expires_at: row.expires_at,
  image_url: row.image_url || null,
  owner_display_name: row.owner_display_name,
  interest_count: Number(row.interest_count || 0),
}
```

No usar `row.item-id`, porque JavaScript lo interpretaría como una resta.

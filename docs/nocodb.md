# Modelo de datos de SegundaVida en NocoDB

## Tabla inicial: `sv_items`

Importar [`data/sv_items.csv`](../data/sv_items.csv) para crear la tabla nueva.
Incluye dos registros placeholder con `status=hidden`: sirven para que NocoDB
detecte valores y para probar el flujo, pero nunca aparecerán en el catálogo
público.

### Campos y tipos recomendados

| Campo | Tipo NocoDB | Requerido | Uso |
| --- | --- | --- | --- |
| `Id` | System field, primary key | Automático | Identificador técnico interno de NocoDB |
| `CreatedAt` | System DateTime | Automático | Fecha de creación de NocoDB |
| `UpdatedAt` | System DateTime | Automático | Última modificación en NocoDB |
| `item-id` | SingleLineText | Sí | Identificador estable de negocio generado por n8n |
| `title` | SingleLineText | Sí | Título visible |
| `description` | LongText | Sí | Descripción del objeto |
| `category` | SingleSelect | Sí | `Hogar`, `Infantil`, `Libros`, `Tecnología`, `Ropa`, `Otros` |
| `zone` | SingleLineText | Sí | Zona aproximada, no dirección exacta |
| `owner_telegram_id` | SingleLineText | Sí | Identidad privada de Telegram |
| `owner_display_name` | SingleLineText | Sí | Nombre público mostrado |
| `owner_username` | SingleLineText | No | Username opcional |
| `status` | SingleSelect | Sí | `available`, `completed`, `expired`, `hidden` |
| `expires_at` | DateTime | Sí | Fin de disponibilidad |
| `completed_at` | DateTime | No | Cuándo se finalizó |
| `image_url` | URL | No | Primera imagen pública |
| `telegram_chat_id` | SingleLineText | No | Referencia privada para n8n |
| `telegram_thread_id` | SingleLineText | No | Referencia privada para n8n |
| `telegram_message_id` | SingleLineText | No | Referencia privada para n8n |
| `interest_count` | Number | Sí | Contador agregado, valor inicial `0` |
| `consent_accepted` | Checkbox | Sí | Confirmación de aceptación de publicación y contacto |
| `consent_version` | SingleLineText | Sí | Versión del texto aceptado por la persona |
| `consent_at` | DateTime | Sí | Fecha generada por n8n al publicar |

NocoDB ya aporta `CreatedAt` y `UpdatedAt`; no hay que crearlos ni rellenarlos
desde el CSV. n8n los expondrá como `created_at` y `updated_at` en la respuesta
pública. Telegram IDs se guardan como texto para evitar problemas de precisión o
limitaciones de tamaño en campos numéricos. No se crea todavía el estado
`reserved` ni la tabla de intereses. Cuando haya un `owner_username` público,
`Me interesa` abre directamente el chat del vecino o la vecina. Por eso el
formulario exige configurar un username público antes de publicar. Las
publicaciones antiguas sin username se mantienen visibles, pero no ofrecen un
canal de contacto. La tabla de intereses queda para una segunda fase si
necesitamos métricas o notificaciones más detalladas.

## Importación en NocoDB

1. Crear o seleccionar la base `SegundaVida`.
2. Elegir `Import CSV` y subir `data/sv_items.csv`.
3. Nombrar la tabla `sv_items`.
4. Revisar los tipos según la tabla anterior, especialmente `DateTime`,
   `SingleSelect`, `URL` y `Number`.
5. Mantener `Id` como clave técnica de NocoDB y usar `item-id` como identificador
   de negocio; crear una vista `Public catalog`.
6. En esa vista filtrar `status = available` y ordenar por `created_at`
   descendente.

Después de probar el flujo, puedes eliminar los dos registros `sv-demo-001` y
`sv-demo-002`, o conservarlos mientras permanezcan ocultos.

Antes de activar el webhook de publicación, añade también los tres campos de
consentimiento anteriores a la tabla existente. No hace falta volver a importar
el CSV ni rellenarlos en los registros placeholder: los completará n8n en cada
nueva publicación.

## Contrato público de n8n

El endpoint que ya está conectado es:

```text
GET /webhook/segundavida/data
```

Devuelve una envoltura JSON con `ok`, `items` y `total`. n8n proyecta solo los
campos públicos antes de responder; los campos privados de Telegram no salen al
navegador.

Flujo previsto:

```text
Webhook
  -> NocoDB: listar sv_items
  -> filtrar status=available y expires_at futuro
  -> mapear solo campos públicos
  -> Respond to Webhook
```

### Workflow actual

El flujo activo tiene `Webhook -> Search rows -> Code -> Respond to Webhook`. El
nodo `Code` está en modo **Run Once for All Items** y proyecta el resultado con
este código:

```javascript
function timestamp(value) {
  if (!value) return null;
  const date = new Date(String(value).replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

const publicItems = $input.all()
  .map(({ json }) => {
    const fields = json.fields ?? json;
    return {
      id: fields["item-id"] ?? null,
      title: fields.title ?? "",
      description: fields.description ?? "",
      category: fields.category ?? "Otros",
      zone: fields.zone ?? "Valladolid",
      status: fields.status ?? "hidden",
      created_at: fields.CreatedAt ?? fields.created_at ?? null,
      updated_at: fields.UpdatedAt ?? fields.updated_at ?? null,
      expires_at: fields.expires_at ?? null,
      image_url: fields.image_url || null,
      owner_display_name: fields.owner_display_name ?? "Vecindad",
      owner_username: fields.owner_username || null,
      interest_count: Number(fields.interest_count ?? 0),
    };
  })
  .filter((item) => (
    item.id &&
    item.status === "available" &&
    (!item.expires_at || timestamp(item.expires_at) >= Date.now())
  ));

return [{
  json: {
    ok: true,
    items: publicItems,
    total: publicItems.length,
  },
}];
```

En `Respond to Webhook`, cambia `Respond With` de `All Incoming Items` a
`JSON` y pon como `Response Body`:

```text
={{ $json }}
```

La conexión final debe quedar:

```text
Webhook -> Search rows -> Code (public catalog) -> Respond to Webhook
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
  "owner_username": "pepe_demo",
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
  created_at: row.CreatedAt,
  updated_at: row.UpdatedAt,
  expires_at: row.expires_at,
  image_url: row.image_url || null,
  owner_display_name: row.owner_display_name,
  owner_username: row.owner_username || null,
  interest_count: Number(row.interest_count || 0),
}
```

No usar `row.item-id`, porque JavaScript lo interpretaría como una resta.

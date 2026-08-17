# Actualizar `/complete` sin importar el workflow entero

El frontend envía `action: "complete"` al marcar una publicación como entregada,
`action: "reopen"` al devolverla a disponible y `action: "hide"` al borrarla
sin marcarla como entregada. Para conservar los cambios que ya tienes en n8n,
aplica solo estos ajustes al workflow existente.

## 1. `Validate Telegram initData`

Después de `itemId`, añade:

```javascript
const action = ['complete', 'reopen', 'hide'].includes(body.action)
  ? body.action
  : 'complete';
```

En el `return` válido, incluye `action`:

```javascript
return [{
  json: {
    ok: true,
    valid: true,
    item_id: itemId,
    action,
    telegram_id: String(user.id),
  },
}];
```

## 2. `Verify owner and item`

Sustituye el Code por este. Mantiene la comprobación de propietario y permite
las tres transiciones válidas:

```javascript
const auth = $('Validate Telegram initData').first()?.json ?? {};
const rows = $input.all();
if (auth.valid !== true) return [{ json: auth }];

const found = rows
  .map(({ json }) => ({ json, fields: json.fields ?? json }))
  .find(({ fields }) => String(fields.public_id ?? fields['item-id'] ?? '') === String(auth.item_id));

if (!found) {
  return [{ json: { ok: false, valid: false, error: 'item_not_found' } }];
}

const fields = found.fields;
if (String(fields.owner_telegram_id ?? '') !== String(auth.telegram_id)) {
  return [{ json: { ok: false, valid: false, error: 'not_owner' } }];
}

const currentStatus = String(fields.status ?? '');
if (auth.action === 'hide' && !['available', 'completed'].includes(currentStatus)) {
  return [{ json: { ok: false, valid: false, error: currentStatus === 'hidden' ? 'item_already_hidden' : 'item_not_available' } }];
}
const targetStatus = auth.action === 'hide'
  ? 'hidden'
  : auth.action === 'reopen'
    ? 'available'
    : 'completed';
if (targetStatus === 'completed' && fields.status !== 'available') {
  return [{ json: { ok: false, valid: false, error: 'item_not_available' } }];
}
if (targetStatus === 'available' && fields.status !== 'completed') {
  return [{ json: { ok: false, valid: false, error: 'item_not_completed' } }];
}

const rowId = fields.Id ?? found.json.Id ?? found.json.id ?? null;
if (rowId === null || rowId === undefined || rowId === '') {
  return [{ json: { ok: false, valid: false, error: 'nocodb_row_id_missing' } }];
}

return [{ json: {
  ok: true,
  valid: true,
  Id: rowId,
  item_id: auth.item_id,
  status: targetStatus,
  completed_at: auth.action === 'hide'
    ? (currentStatus === 'completed' ? fields.completed_at ?? null : null)
    : targetStatus === 'completed' ? new Date().toISOString() : null,
  expires_at: fields.expires_at ?? null,
  title: fields.title ?? '',
} }];
```

## 3. `Update NocoDB row`

Conserva `Row ID Value = {{ $json.Id }}` y usa estos valores:

```text
status        = {{ $json.status }}
completed_at  = {{ $json.completed_at ?? null }}
```

Así `reopen` escribe `available` y limpia `completed_at`, mientras que `hide`
escribe `hidden` y conserva la fecha de entrega si ya existía.

## 4. `Build success response`

Usa este Code:

```javascript
const input = $('Verify owner and item').first()?.json ?? {};
const hidden = input.status === 'hidden';
const reopened = input.status === 'available';

return [{ json: {
  ok: true,
  item_id: input.item_id ?? '',
  title: input.title ?? '',
  status: input.status ?? 'completed',
  completed_at: input.completed_at ?? null,
  expires_at: input.expires_at ?? null,
  message: hidden ? 'Publicación borrada' : reopened ? 'Publicación reactivada' : 'Marcado como entregado',
} }];
```

# Actualizar `/complete` sin importar el workflow entero

El frontend envía `action: "complete"` al marcar una publicación como entregada
y `action: "reopen"` al devolverla a disponible. Para conservar los cambios
que ya tienes en n8n, aplica solo estos ajustes al workflow existente.

## 1. `Validate Telegram initData`

Después de `itemId`, añade:

```javascript
const action = body.action === 'reopen' ? 'reopen' : 'complete';
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
las dos transiciones válidas:

```javascript
const auth = $('Validate Telegram initData').first()?.json ?? {};
const rows = $input.all();
if (auth.valid !== true) return [{ json: auth }];

const found = rows
  .map(({ json }) => ({ json, fields: json.fields ?? json }))
  .find(({ fields }) => String(fields['item-id'] ?? '') === String(auth.item_id));

if (!found) {
  return [{ json: { ok: false, valid: false, error: 'item_not_found' } }];
}

const fields = found.fields;
if (String(fields.owner_telegram_id ?? '') !== String(auth.telegram_id)) {
  return [{ json: { ok: false, valid: false, error: 'not_owner' } }];
}

const targetStatus = auth.action === 'reopen' ? 'available' : 'completed';
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
  completed_at: targetStatus === 'completed' ? new Date().toISOString() : null,
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

Así `reopen` escribe `available` y limpia `completed_at`.

## 4. `Build success response`

Usa este Code:

```javascript
const input = $('Verify owner and item').first()?.json ?? {};
const reopened = input.status === 'available';

return [{ json: {
  ok: true,
  item_id: input.item_id ?? '',
  title: input.title ?? '',
  status: input.status ?? 'completed',
  completed_at: input.completed_at ?? null,
  expires_at: input.expires_at ?? null,
  message: reopened ? 'Publicación reactivada' : 'Marcado como entregado',
} }];
```

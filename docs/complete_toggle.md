# Actualizar `/complete` sin importar el workflow entero

El endpoint de gestión acepta estas acciones:

- `complete`: de `available` o `reserved` a `completed`.
- `reopen`: de `completed` a `available`.
- `reserve`: de `available` a `reserved`.
- `release`: de `reserved` a `available`.
- `hide`: de `available`, `reserved` o `completed` a `hidden`.

Si mantienes un workflow existente, replica estas reglas en los nodos de
validación y actualización:

```javascript
const allowedActions = ['complete', 'reopen', 'hide', 'reserve', 'release'];
const action = allowedActions.includes(body.action) ? body.action : 'complete';
const storedStatus = String(fields.status ?? '');
const expiration = fields.reservation_expires_at
  ? new Date(String(fields.reservation_expires_at).replace(' ', 'T')).getTime()
  : NaN;
const expiredReservation = storedStatus === 'reserved'
  && Number.isFinite(expiration)
  && expiration <= Date.now();
const currentStatus = expiredReservation ? 'available' : storedStatus;

if (action === 'reserve' && currentStatus !== 'available') {
  return [{ json: { ok: false, valid: false, error: 'item_not_available' } }];
}
if (action === 'release' && currentStatus !== 'reserved') {
  return [{ json: { ok: false, valid: false, error: 'item_not_reserved' } }];
}
if (action === 'complete' && !['available', 'reserved'].includes(currentStatus)) {
  return [{ json: { ok: false, valid: false, error: 'item_not_available' } }];
}
```

El estado siguiente y las fechas se calculan exclusivamente en n8n:

```javascript
const nextStatus = action === 'hide'
  ? 'hidden'
  : ['reopen', 'release'].includes(action)
    ? 'available'
    : action === 'reserve'
      ? 'reserved'
      : 'completed';

const reservedAt = nextStatus === 'reserved' ? new Date().toISOString() : null;
const reservationExpiresAt = nextStatus === 'reserved'
  ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  : null;
```

En `Update NocoDB row`, conserva `Row ID Value = {{ $json.Id }}` y escribe
`status`, `completed_at`, `reserved_at` y `reservation_expires_at`. No aceptes
la fecha de caducidad enviada por el cliente.

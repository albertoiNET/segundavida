# Reservas y caducidad

Las publicaciones pueden pasar manualmente por estos estados:

```text
available -> reserved -> completed
     \-> completed
reserved -> available
```

`reserve` calcula `reserved_at` y `reservation_expires_at` en n8n. El navegador
envía una duración en días (`reservation_days`): 1 por defecto, 2 para 48 horas
o un valor personalizado entre 1 y 30. n8n valida ese número y calcula la fecha
de caducidad; nunca se acepta una fecha enviada por el navegador.

El workflow [`sv_expire_reservations.workflow.json`](./sv_expire_reservations.workflow.json)
se ejecuta cada hora. Busca filas `reserved` cuya `reservation_expires_at` ya
ha pasado y escribe `available`, `reserved_at = null` y
`reservation_expires_at = null`. Es idempotente y no depende de que alguien
abra la publicación.

El workflow de gestión también aplica una comprobación de caducidad en tiempo
real para que una reserva atrasada no bloquee una nueva acción mientras llega
la siguiente ejecución programada.

Importa y activa ambos workflows después de crear en NocoDB los campos
`reserved_at` y `reservation_expires_at`. La publicación, la reserva y la
liberación usan la credencial existente `NocoDB Token account`.

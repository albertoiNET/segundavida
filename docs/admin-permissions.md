# Permisos de administración

La administración de publicaciones se basa en un Data Table de n8n, no en una
variable del navegador ni en una variable `$vars` de n8n.

## Tabla de permisos

En el proyecto personal de n8n se creó la tabla `Segunda Vida - Permisos` con
estos campos:

| Campo | Tipo | Valor inicial |
| --- | --- | --- |
| `telegram_id` | Texto | — |
| `role` | Texto | `admin` |
| `active` | Booleano | `true` |
| `display_name` | Texto | — |

La primera fila es:

```text
telegram_id = 2191395
role        = admin
active      = true
display_name = Nuke
```

Para retirar el acceso basta con poner `active` a `false`; no hace falta
modificar el código ni el frontend.

## Workflows

`Validar Telegram User - Segunda Vida` valida la firma de Telegram y consulta
el Data Table. Su respuesta pública solo añade el booleano `is_admin`:

```json
{
  "valid": true,
  "telegram_id": "2191395",
  "first_name": "Nuke",
  "username": "tionuke",
  "is_admin": true
}
```

`Marcar como entregado - Segunda Vida` llama a ese endpoint y autoriza
`complete`, `reopen` y `hide` cuando la identidad es el propietario de la
publicación o es un administrador activo. La comprobación sigue estando en el
backend; ocultar los controles en la interfaz nunca es una medida de seguridad.

`Editar publicación - Segunda Vida` aplica la misma regla: el propietario puede
editar su publicación disponible y un administrador activo puede editar
cualquier publicación visible en estado disponible, reservada, entregada o
caducada. El workflow conserva el estado y vuelve a moderar el texto y las
fotos antes de guardar.

## Interfaz

La sección `Mis publicaciones` sigue mostrando únicamente publicaciones del
usuario autenticado. Un administrador puede gestionar una publicación ajena
desde su ficha pública, donde verá la etiqueta `Gestión de administrador`.
En esa ficha también verá `Editar` aunque la publicación no sea suya; el
backend vuelve a comprobar el rol antes de aceptar los cambios. `Me interesa`
se mantiene disponible al administrador cuando consulta una publicación de otra
persona.

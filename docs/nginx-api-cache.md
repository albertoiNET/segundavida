# Capa Nginx para la API pública de Segunda Vida

Esta guía documenta la arquitectura recomendada para colocar Nginx entre el
frontend estático y n8n. Los ejemplos son plantillas: no contienen el dominio,
los certificados ni los UUIDs de una instalación concreta.

## Objetivo

```text
frontend.example.org
        |
        v
api.example.org  (Nginx)
        |
        v
n8n interno:5678
```

El frontend solo debe conocer `api.example.org`. Nginx oculta la ruta interna
de n8n y aplica las reglas de caché y protección antes de abrir una ejecución.

## Política recomendada

| Ruta | Método | Caché | TTL |
| --- | --- | --- | --- |
| `/segundavida/data` | `GET`, `HEAD` | Sí | 10 segundos |
| `/segundavida/item/<id>` | `GET`, `HEAD` | Sí | 15 segundos |
| `/segundavida/whoami` | `POST` | No | — |
| `/segundavida/publish` | `POST` | No | — |
| `/segundavida/edit` | `POST` | No | — |
| `/segundavida/complete` | `POST` | No | — |
| `/segundavida/mine` | `POST` | No | — |
| `/segundavida/report` | `POST` | No | — |
| `/segundavida/interaction` | `POST` | No | — |

La caché debe usar `proxy_cache_lock` para que varias peticiones simultáneas a
la misma clave produzcan una sola consulta al upstream. Se puede servir una
respuesta antigua durante un fallo temporal, pero no se deben cachear errores
`500` o `503` como respuestas normales.

Las peticiones con `Cache-Control: no-cache` deben saltarse la caché y tampoco
deben rellenarla. El frontend usa este mecanismo después de publicar o editar
para que la persona que hizo la operación vea el cambio inmediatamente.

## Validación y límites

- Solo se permiten las formas de consulta que usa el frontend (`scope` y
  `owner_username` con sus formatos definidos).
- Los parámetros desconocidos se rechazan en Nginx y no llegan a n8n.
- Los identificadores de ficha se validan por longitud y caracteres permitidos.
- Las rutas de ficha mal formadas se rechazan en el borde.
- Lecturas públicas: límite inicial de 5 peticiones por segundo e IP, con ráfaga
  de 10.
- Escrituras y autenticación: límite inicial de 2 peticiones por segundo e IP,
  con ráfaga de 5.
- Los límites deben observarse y ajustarse si una red compartida produce falsos
  positivos.

## Instalación

1. Copiar `segundavida-hardening.conf` y `segundavida-api-maps.conf` al bloque
   `http` de Nginx, normalmente mediante `/etc/nginx/conf.d/`.
2. Copiar `api.example.org.conf.template` a un fichero privado del servidor.
3. Sustituir `api.example.org` por el dominio de la instalación.
4. Sustituir `__ITEM_WEBHOOK_UUID__` por el UUID interno de la ficha. Ese valor
   debe permanecer en el servidor y no versionarse.
5. Configurar los certificados TLS del dominio real en el servidor.
6. Ejecutar `nginx -t` y solo después `systemctl reload nginx`.

El fichero renderizado con datos reales debe permanecer fuera del repositorio.
Conviene guardar una copia de seguridad antes de cada cambio para poder
restaurar la configuración sin tocar n8n.

## Verificación

```text
GET /health                         -> 200 y no-store
GET /segundavida/data               -> MISS y luego HIT
GET /segundavida/item/<id>          -> MISS y luego HIT
GET /segundavida/data?unknown=1     -> 400 sin llegar a n8n
GET /segundavida/item/nope          -> 400 sin llegar a n8n
POST /segundavida/publish           -> nunca se almacena en caché
```

Las pruebas de carga deben hacerse contra un upstream de prueba o con una
petición pública conocida y controlada. No se deben provocar errores
intencionados ni enviar escrituras contra el n8n de producción.

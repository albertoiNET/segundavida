# Analítica de SegundaVida

## Configuración

SegundaVida utiliza la instalación Matomo existente de Aldea Pucela, en:

```text
https://stats.aldeapucela.org/
```

La web principal utiliza el `siteId 13`. SegundaVida tiene un `siteId` propio
para separar el uso de la Mini App de las métricas generales de Aldea Pucela.

## Sitio configurado

El sitio de SegundaVida está asociado a este dominio:

```text
segundavida.aldeapucela.org
```

El sitio propio de SegundaVida usa el `siteId 27`. El valor está configurado en
[`js/analytics.js`](../js/analytics.js). No se debe copiar ningún `token_auth`,
contraseña ni credencial de administración al frontend.

El wrapper carga `matomo.js` únicamente en páginas donde el ID está configurado.

## API interna

El resto del frontend debe usar exclusivamente:

```javascript
SecondaVidaAnalytics.trackPageView();
SecondaVidaAnalytics.trackEvent("telegram", "open-mini-app", "offer");
```

## Eventos de comportamiento

La instrumentación mantiene las visitas de Matomo y añade únicamente estas
interacciones de negocio:

| Categoría | Acción | Nombre | Momento |
| --- | --- | --- | --- |
| `share` | `success` | `public_id` o `home` | La compartición se completa |
| `interest` | `click` | `public_id` | Se pulsa «Me interesa» |
| `interest` | `telegram-open` | `public_id` | Se abre o se intenta abrir el chat de Telegram |
| `favorite` | `add` | `public_id` | Se añade un objeto a Favoritos |
| `favorite` | `remove` | `public_id` | Se quita un objeto de Favoritos |
| `telegram` | `open-mini-app` | `offer` o `posts` | Se pulsa un CTA web para abrir la Mini App |

No se genera un evento adicional al mostrar una ficha: las visitas y páginas
virtuales de Matomo cubren ese comportamiento. Tampoco se instrumentan
búsquedas, filtros, formularios, fotos ni navegación interna.

`interest/telegram-open` mide el salto correcto o el intento aceptado de abrir
Telegram. La web no puede confirmar que la persona haya enviado el mensaje
dentro de Telegram; para eso haría falta un flujo mediado por un bot o un
backend que recibiera una confirmación.

El `public_id` usado como nombre de evento es un identificador opaco y público.
Nunca se envían a Matomo títulos, descripciones, términos de búsqueda,
username o ID de Telegram, `initData`, nombre, correo ni teléfono. El evento de
`report/submit` existente se conserva sin añadir eventos auxiliares.

No se enviarán a Matomo el Telegram ID, nombre de usuario, nombre, correo, teléfono,
descripción de objetos ni ningún otro contenido escrito por usuarios. Matomo
medirá comportamiento agregado; la identidad operativa permanecerá en NocoDB.

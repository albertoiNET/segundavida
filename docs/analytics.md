# Analítica de SegundaVida

## Decisión

SegundaVida usará la instalación Matomo existente de Aldea Pucela, en:

```text
https://stats.aldeapucela.org/
```

La web principal publica actualmente el `siteId 13`. SegundaVida tendrá un
`siteId` propio para separar el uso de la Mini App de las métricas generales
de Aldea Pucela.

## Activación pendiente

En Matomo hay que crear un nuevo sitio con este dominio:

```text
segundavida.aldeapucela.org
```

Después, sustituir el valor vacío de `MATOMO_SITE_ID` en
[`js/analytics.js`](../js/analytics.js) por el nuevo ID numérico. No se debe
copiar ningún `token_auth`, contraseña ni credencial de administración al
frontend.

Mientras el ID esté vacío, el wrapper no carga `matomo.js`, no realiza
peticiones y no altera la experiencia de la Mini App.

## API interna

El resto del frontend debe usar exclusivamente:

```javascript
SecondaVidaAnalytics.trackPageView();
SecondaVidaAnalytics.trackEvent("SegundaVida", "open_telegram");
```

No se enviarán a Matomo el Telegram ID, username, nombre, correo, teléfono,
descripción de objetos ni ningún otro contenido escrito por usuarios. Matomo
medirá comportamiento agregado; la identidad operativa permanecerá en NocoDB.

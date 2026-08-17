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
SecondaVidaAnalytics.trackEvent("SegundaVida", "open_telegram");
```

No se enviarán a Matomo el Telegram ID, nombre de usuario, nombre, correo, teléfono,
descripción de objetos ni ningún otro contenido escrito por usuarios. Matomo
medirá comportamiento agregado; la identidad operativa permanecerá en NocoDB.

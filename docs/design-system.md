# Sistema visual de SegundaVida

SegundaVida comparte la identidad de Aldea Pucela. No es una marca separada:
es otra herramienta vecinal del mismo ecosistema.

## Auditoría de referencias

Referencias revisadas el 16 de agosto de 2026:

- [Aldea Pucela](https://aldeapucela.org/): presenta el ecosistema como una
  comunidad vecinal, con una voz cercana, enlaces directos a sus herramientas y
  cambio entre tema claro y oscuro.
- [Eventos](https://eventos.aldeapucela.org/): agenda estática y mobile-first.
  Su repositorio declara Nunjucks, Tailwind CSS, PostCSS, GitHub Actions y
  GitHub Pages. SegundaVida reutiliza la claridad y el enfoque estático, pero
  no necesita Node ni un proceso de build.
- [Contratos Valladolid](https://contratos.aldeapucela.org/): producto de
  exploración con navegación sencilla, buscador visible y copy orientado a la
  acción vecinal.
- [Fotos de Valladolid](https://fotos.aldeapucela.org/): galería comunitaria
  con navegación, filtros y una llamada clara a participar.

## Decisiones para SegundaVida

### Color

El morado identifica la marca y las acciones principales. El turquesa comunica
disponibilidad, comunidad y estados positivos. El gris pizarra se reserva para
texto secundario. Los fondos son blancos y marfil muy suaves para mantener una
superficie ligera dentro de Telegram.

Los tokens canónicos viven en [`css/tokens.css`](../css/tokens.css). Las
variables principales son:

| Uso | Token | Valor claro |
| --- | --- | --- |
| Acción y marca | `--color-primary` | `#66517d` |
| Acción intensa | `--color-primary-dark` | `#4f3e62` |
| Estado positivo | `--color-secondary` | `#1e9e8a` |
| Fondo general | `--bg-body` | `#f4f4f4` |
| Superficie de la app | `--bg-container` | `#fefefe` |
| Texto principal | `--text-main` | `#27272a` |
| Texto auxiliar | `--text-secondary` | `#52525b` |

También se ha dejado una variante oscura mediante `prefers-color-scheme`,
manteniendo la misma jerarquía de morado y turquesa.

### Tipografía

- Inter o la sans-serif del sistema para lectura, controles y datos.
- Georgia como serif de apoyo únicamente en el lockup de marca, siguiendo el
  carácter editorial y vecinal de Aldea Pucela.
- Máximo dos familias tipográficas.

### Componentes y geometría

- Mobile-first, con una columna de lectura estrecha y navegación preparada para
  el pulgar.
- Radios suaves (`--radius-sm`, `--radius-md`, `--radius-lg`) sin convertir
  cada bloque en una tarjeta flotante.
- Bordes finos para separar estados; sombras ligeras solo cuando una pieza sea
  realmente interactiva.
- Espaciado basado en múltiplos de 4 px mediante los tokens `--space-*`.
- Los botones primarios usan morado; los estados disponibles y confirmaciones,
  turquesa; los estados informativos no compiten con ambos.

### Accesibilidad y responsive

- Contraste suficiente entre texto y superficie en los dos temas.
- Estados comunicados por texto y color, nunca solo por color.
- Área táctil cómoda y contenido legible desde 320 px.
- Las animaciones respetan `prefers-reduced-motion`.

## Regla de implementación

Los estilos de cada pantalla consumirán los tokens de `css/tokens.css`. No se
introducirán colores hexadecimales nuevos en las vistas salvo que se documente
primero una necesidad real del sistema.

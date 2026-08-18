# Design QA

- Source visual: `/var/folders/8r/kmn758jj0h7cq06fx_44sb100000gp/T/codex-clipboard-62ea6562-4d07-498d-82bd-17d42f356b5c.png`
- Implementation capture: `/private/tmp/segundavida-cards-implementation.png`
- Combined comparison input: `/private/tmp/segundavida-cards-comparison.png`
- Filter source visual: `/var/folders/8r/kmn758jj0h7cq06fx_44sb100000gp/T/codex-clipboard-aa40321b-8d4d-4e83-9bf4-0dff262c1b14.png`
- Filter implementation capture: `/private/tmp/segundavida-filters-implementation.png`
- Filter comparison input: `/private/tmp/segundavida-filters-comparison.png`
- Viewport: 387 × 865 CSS pixels, catalog home, mobile two-column grid, top of page.
- State: active catalog with six seeded items; first row visible; card hover inactive.

## Evidence

- Cards render in two equal columns on the mobile viewport instead of a single oversized column.
- Card image, rounded border, warm white surface, and soft shadow remain consistent with the reference direction.
- The body reserves two title lines, so the category and availability row starts at the same vertical position for one-line and two-line titles.
- Bottom padding was reduced so the card closes closer to the metadata row.
- Metadata icons use an outlined treatment; the fallback mode restores readable solid text glyphs if the icon CDN is unavailable.
- Card metadata now uses one shared icon-to-label gap, and availability dates use the compact `d/m` format (`Hasta 16/9`).
- The mobile metadata row now gives the category and availability distinct group spacing while keeping the clock tight to its own date label.
- Filter pills use a more compact, medium-weight label treatment with less unused width; search is now a solid standalone magnifying-glass button instead of a circular outlined control.
- The filter row is compact and horizontal on mobile, with a category selector, an accessible “No reservados” switch, and a circular search trigger aligned on the right.
- Search is hidden by default, opens on the search button, receives focus, filters results while typing, and closes again with the button or Escape.
- Category selection continues to filter the catalog, and the availability switch exposes the existing `all`/`available` filtering behavior.

## Comparison history

1. Initial card redesign was visually close to the reference but oversized on mobile because the grid collapsed to one column.
2. Mobile breakpoint restored a two-column grid and compact card spacing.
3. Final pass removed rigid body height, reserved title-line space, tightened bottom padding, and changed metadata icons to outlined glyphs.
4. Filter controls were refactored into compact pills; search moved into an on-demand panel and status became a semantic switch.
5. Final micro-pass aligned metadata spacing and shortened card dates to keep category and availability readable in the two-column layout.
6. Final annotation pass separated the category and availability groups and tightened the clock-to-date gap.
7. Filter refinement tightened pill sizing/typography and replaced the circular search control with a solid icon button.

## Final result

final result: passed

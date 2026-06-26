# @thebes/cadmea

## 1.1.1

### Patch Changes

- fieldWidgets now also match by trailing field name, so a widget (e.g. ImageHotspotField) can target a field nested inside an array item (key path `blocks.0.url`) by registering it under the bare name (`url`).

## 1.1.0

### Minor Changes

- Studio UI for Phase 4: per-field `fieldWidgets` override on CollectionEdit + a built-in `ImageHotspotField` image hotspot/crop picker (#17), and `VisualEditingPane` click-to-edit preview iframe (#15).

## 1.0.0

### Patch Changes

- a098759: Accessibility fixes for the storefront and admin UI components.

  - `CartDrawer` is now a proper modal dialog: `role="dialog"`/`aria-modal`,
    a focus trap with `Esc`-to-close and focus restoration on close, body
    scroll lock while open, and an `aria-live` region announcing cart
    contents as items change. Mirrors the existing PanelNav/SearchPalette
    focus-trap idiom.
  - `CollectionEdit` announces submit errors via `role="alert"` and colors
    the required-field marker (its accessible name is unchanged).

- Updated dependencies [1159873]
  - @thebes/cadmus@0.2.0

![Publish to NPM](https://github.com/shute-technologies/graph-editor/workflows/Publish%20to%20NPM/badge.svg) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) ![npm](https://img.shields.io/npm/v/shute-technologies.graph-editor) ![GitHub last commit](https://img.shields.io/github/last-commit/shute-technologies/graph-editor) ![npm](https://img.shields.io/npm/dt/shute-technologies.graph-editor) ![npm bundle size](https://img.shields.io/bundlephobia/min/shute-technologies.graph-editor)

This is a Graph Editor made in HTML Canvas for controlling Animations

## Theming

Every colour and font the canvas draws with is a field of `GEEStyles`, read on every frame. A host passes
its theme in with:

```ts
import { GEEStyles, GEEITheme, GEEIThemeValues, GEEDefaultTheme } from 'shute-technologies.graph-editor';

GEEStyles.applyTheme(theme); // deep merge: the fields a theme leaves out keep their current value
GEEStyles.resetTheme();      // every field back to GEEDefaultTheme
```

- `GEEITheme` is any subset of the fields below, at any depth. `GEEIThemeValues` is the complete set.
- `GEEDefaultTheme` is the look the editor has always had (frozen). Without a theme nothing changes.
- The next frame shows a change. To switch themes, call `resetTheme()` first, or apply a theme that sets
  every field, so that nothing from the previous theme stays behind.
- Only theme fields are written. Geometry (sizes, offsets, line widths) and unknown keys are ignored.
- `GEEStyles` is shared by every `GEEEngine` on the page.

| Field | What it colours | Default |
| --- | --- | --- |
| `backgroundColor` | The canvas background | `#4e4e4e` |
| `cStrokeColor` | Nothing yet (reserved for grid and control strokes) | `#6e6e6e` |
| `fontColor` | Nothing yet (node names use `graph.textColor`) | `#f9f9f9` |
| `arrowColorStroke` | A transition arrow | `#000000` |
| `arrowColorFocusStroke` | The selected transition arrow | `white` |
| `arrowColorFill` | The head of a transition arrow | `#6e6e6e` |
| `graph.color` | A node | `#6d6d6d` |
| `graph.startColor` | The start node | `#9d9d9d` |
| `graph.mouseOverColor` | The node under a connection being dragged | `#3d3d3d` |
| `graph.outlineColor` | A node's outline | `black` |
| `graph.textColor` | A node's name (and the start node's, while it is under the pointer) | `white` |
| `graph.startTextColor` | The start node's name | `white` |
| `graph.progressColor` | The playback progress bar | `white` |
| `graph.textStyle` | A node's name: a CSS font | `bold 11px Arial` |
| `graph.circleConnector.fillColor` | The connector circle, and the head of the arrow dragged out of it | `#990000` |
| `graph.circleConnector.strokeColor` | The connector's outline, and the line of the arrow dragged out of it | `#003300` |

For example, a host with light and dark palettes maps its tokens onto the fields once and applies the
result whenever its theme changes:

```ts
import { GEEStyles, GEEITheme } from 'shute-technologies.graph-editor';

const graphite = {
  dark: {
    bgApp: '#0e1015', bgSurface: '#15181e', bgSurface3: '#252a35', border: '#2a303c', borderStrong: '#3a4252',
    text: '#e6e9ef', textMuted: '#9aa2b2', accent: '#5b8cff', onAccent: '#0b0d12'
  },
  light: {
    bgApp: '#dde1e7', bgSurface: '#f5f6f8', bgSurface3: '#dfe3ea', border: '#d1d6de', borderStrong: '#b4bbc7',
    text: '#1b1f27', textMuted: '#515969', accent: '#2f5ccd', onAccent: '#ffffff'
  }
};

type Palette = typeof graphite.dark;

function toGraphTheme(p: Palette): GEEITheme {
  return {
    backgroundColor: p.bgApp,
    cStrokeColor: p.border,
    fontColor: p.text,
    arrowColorStroke: p.textMuted,
    arrowColorFocusStroke: p.accent,
    arrowColorFill: p.borderStrong,
    graph: {
      color: p.bgSurface3,
      startColor: p.accent,
      mouseOverColor: p.borderStrong,
      outlineColor: p.borderStrong,
      textColor: p.text,
      startTextColor: p.onAccent,
      progressColor: p.accent,
      textStyle: '600 11px Inter, system-ui, sans-serif',
      circleConnector: { fillColor: p.accent, strokeColor: p.borderStrong }
    }
  };
}

// At start-up and on every theme change.
function setGraphTheme(mode: 'dark' | 'light'): void {
  GEEStyles.resetTheme();
  GEEStyles.applyTheme(toGraphTheme(graphite[mode]));
}
```

Up to 0.11 `GEEStyles` was not exported, so hosts imported it from
`shute-technologies.graph-editor/lib/src/shute-technologies/modules/config/geeStyles` and wrote its fields.
That still works, but import it from the package instead and use `applyTheme`.

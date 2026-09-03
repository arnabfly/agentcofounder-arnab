// Extension slot (currently inactive). EDIT THIS FILE when a core journey the
// user explicitly asks for cannot be expressed through src/config.ts — e.g. a
// live calculation across inputs, a timer, a random pick, any interactive
// mechanism. Implement exactly that journey here with plain React; the frame
// renders this panel automatically above the list. Keep `export default`.
// While it returns null, nothing is shown.

import type { CustomPanelProps } from "./frame/types";

export default function Custom(_props: CustomPanelProps) {
  return null;
}

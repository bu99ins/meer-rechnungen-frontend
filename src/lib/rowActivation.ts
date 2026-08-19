// Shared by every list's table row (dblclick) and card (click) activation handler: a click/
// double-click that started on an action control (a link or a button — Edit, Download PDF,
// Delete, View) has already done its own job, so row/card activation must not also fire. The
// confirm dialog lives outside the row/card in the DOM (rendered once at the bottom of the page),
// so its clicks never reach this check in the first place — they simply don't bubble through here.
export const isActionTarget = (target: EventTarget | null): boolean =>
  target instanceof Element && Boolean(target.closest('a, button'));

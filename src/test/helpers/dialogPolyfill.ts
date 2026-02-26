/**
 * jsdom does not implement HTMLDialogElement.showModal/close.
 * This polyfill assigns stub methods that track open state via the `open` attribute.
 *
 * Imported in src/test/setup.ts so every test file gets it automatically.
 */
export function installDialogPolyfill(): void {
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
}

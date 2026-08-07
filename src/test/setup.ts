// Globale Test-Einrichtung für Vitest + React Testing Library.
// Fügt jest-dom-Matcher hinzu (z. B. toBeInTheDocument) und räumt nach jedem Test auf.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom implementiert `<dialog>.showModal()`/`close()` nicht; minimaler Ersatz mit
// `open`-Attribut, `returnValue` und `close`-Event für die Dialog-Tests.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(
    this: HTMLDialogElement,
    returnValue?: string,
  ) {
    if (returnValue !== undefined) {
      this.returnValue = returnValue;
    }
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
}

afterEach(() => {
  cleanup();
});

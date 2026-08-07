// Globale Test-Einrichtung für Vitest + React Testing Library.
// Fügt jest-dom-Matcher hinzu (z. B. toBeInTheDocument) und räumt nach jedem Test auf.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom implementiert `<dialog>.showModal()`/`close()` nicht; minimaler Ersatz mit
// `open`-Attribut, `returnValue` und `close`-Event für die Dialog-Tests. Der Zugriff über
// `globalThis` und den optionalen Prototyp-Typ hält den Guard sowohl unter
// `environment: 'node'` (kein DOM) als auch gegenüber den lückenlosen DOM-Typen lauffähig.
const dialogElement = (globalThis as { HTMLDialogElement?: typeof HTMLDialogElement })
  .HTMLDialogElement;
const dialogPrototype = dialogElement?.prototype as
  | {
      open: boolean;
      showModal?: (this: HTMLDialogElement) => void;
      close?: (this: HTMLDialogElement, returnValue?: string) => void;
    }
  | undefined;
if (dialogPrototype !== undefined && dialogPrototype.showModal === undefined) {
  dialogPrototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  dialogPrototype.close = function close(this: HTMLDialogElement, returnValue?: string) {
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

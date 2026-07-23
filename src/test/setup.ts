// Globale Test-Einrichtung für Vitest + React Testing Library.
// Fügt jest-dom-Matcher hinzu (z. B. toBeInTheDocument) und räumt nach jedem Test auf.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});

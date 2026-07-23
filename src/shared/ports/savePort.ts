/**
 * Austauschbare Persistenz-Schnittstelle (siehe AGENTS.md §7).
 *
 * Die Spiellogik greift ausschließlich über diese Schnittstelle auf gespeicherte
 * Rohdaten zu. Aktuell via localStorage implementiert; später ohne Änderung der
 * Spiellogik gegen ein Cloud-Backend (z. B. Firebase) austauschbar.
 *
 * Bewusst async (Promise-basiert), damit ein Cloud-Adapter direkt passt.
 * Serialisierung, Versionierung und Validierung liegen NICHT hier, sondern in
 * der Save-Service-Schicht darüber (src/features/save).
 */
export interface SavePort {
  load(): Promise<string | null>;
  save(raw: string): Promise<void>;
  clear(): Promise<void>;
}

const STORAGE_KEY = 'crucible-idle-rpg:save';

/** localStorage-Implementierung des SavePort. */
export function createLocalStorageSavePort(key: string = STORAGE_KEY): SavePort {
  return {
    load: () => Promise.resolve(localStorage.getItem(key)),
    save: (raw) => {
      localStorage.setItem(key, raw);
      return Promise.resolve();
    },
    clear: () => {
      localStorage.removeItem(key);
      return Promise.resolve();
    },
  };
}

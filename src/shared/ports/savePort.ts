/**
 * Austauschbare Persistenz-Schnittstelle (siehe AGENTS.md).
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

/**
 * localStorage-Implementierung des SavePort. Der Umweg über `.then(...)` verlegt die
 * synchronen `localStorage`-Zugriffe in die Promise-Kette: Ein synchroner Fehler
 * (z. B. volle Quota) wird zur Rejection statt zum Throw und hält den Port-Kontrakt.
 */
export function createLocalStorageSavePort(key: string = STORAGE_KEY): SavePort {
  return {
    load: () => Promise.resolve().then(() => localStorage.getItem(key)),
    save: (raw) =>
      Promise.resolve().then(() => {
        localStorage.setItem(key, raw);
      }),
    clear: () =>
      Promise.resolve().then(() => {
        localStorage.removeItem(key);
      }),
  };
}

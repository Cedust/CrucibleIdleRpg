import { createStore, useStore } from 'zustand';
import type { RewardCommit } from '@/features/dungeon/rewards';
import { commitFloorVictory } from '@/features/dungeon/rewards';
import {
  purchaseCrucibleNode,
  respecCrucibleTree,
  type RespeccableTreeId,
} from '@/game/crucible/crucible';
import { applyBrand, applyMasterwork, applyTemper } from '@/game/crafting/blacksmith';
import { applyAttune, applyInlay, applyRecut, craftLootPrng } from '@/game/crafting/jeweler';
import { createTeamArmor } from '@/game/items/armor';
import { activeImprintSigilIds } from '@/game/sigils/imprints';
import type { SigilId } from '@/game/sigils/types';
import {
  etchCost,
  etchRune,
  grantRuneGrimoireStarters,
  inscribeCost,
  inscribeRune,
  isRuneLevel,
  isRuneGrimoireUnlocked,
  runeDepthFromFirstVictories,
  runeLevelCap,
} from '@/game/runes/runes';
import type { RuneCategory, RuneId } from '@/game/runes/types';
import { redistributeAttributePoints, spendAttributePoint } from '@/game/rewards/xpRewards';
import type {
  ArmorSlot,
  AttributePoints,
  CharacterId,
  FloorRewardDefinition,
  RegularGemColor,
} from '@/game/types';
import {
  purchaseMasteryNode,
  respecMasteryDiscipline,
  type DisciplineId,
} from '@/game/weaponMastery/mastery';
import type { Act1DungeonId } from '@/game/encounters/act1';
import { createLocalStorageSavePort } from '@/shared/ports/savePort';
import { createDefaultSave, createSaveSeed, type SaveData } from './saveSchema';
import { createSaveService, type SaveService } from './saveService';

export type SaveStatus = 'idle' | 'loading' | 'ready' | 'saving' | 'error';

export interface SaveStoreState {
  data: SaveData | null;
  status: SaveStatus;
  hydrate: () => Promise<SaveData>;
  beginRun: () => Promise<SaveData>;
  commitVictory: (reward: FloorRewardDefinition) => Promise<RewardCommit>;
  spendAttributePoint: (
    characterId: CharacterId,
    attribute: keyof AttributePoints,
  ) => Promise<boolean>;
  /** Attribut-Respec: schreibt eine Neuverteilung derselben Punktsumme gegen Gold. */
  redistributeAttributePoints: (
    characterId: CharacterId,
    target: AttributePoints,
  ) => Promise<boolean>;
  buyMasteryNode: (characterId: CharacterId, nodeId: string) => Promise<boolean>;
  respecDiscipline: (characterId: CharacterId, discipline: DisciplineId) => Promise<boolean>;
  buyCrucibleNode: (nodeId: string) => Promise<boolean>;
  inscribeRune: (category: RuneCategory) => Promise<boolean>;
  etchRune: (runeId: RuneId) => Promise<boolean>;
  respecCrucible: (tree: RespeccableTreeId) => Promise<boolean>;
  temperArmor: (characterId: CharacterId, slot: ArmorSlot) => Promise<boolean>;
  masterworkArmor: (characterId: CharacterId, slot: ArmorSlot) => Promise<boolean>;
  brandArmor: (characterId: CharacterId, slot: ArmorSlot, sigilId: SigilId) => Promise<boolean>;
  inlayGem: (
    characterId: CharacterId,
    slot: ArmorSlot,
    socketIndex: number,
    color: RegularGemColor,
  ) => Promise<boolean>;
  attuneGem: (characterId: CharacterId, slot: ArmorSlot, socketIndex: number) => Promise<boolean>;
  recutGem: (characterId: CharacterId, slot: ArmorSlot, socketIndex: number) => Promise<boolean>;
  completeDungeon: (dungeonId: Act1DungeonId) => Promise<SaveData>;
  setPlaybackSpeed: (speed: SaveData['playbackSpeed']) => Promise<void>;
}

export interface SaveStoreOptions {
  /**
   * Erlaubt dem Kompositionspunkt, die Optimierung situativ zu sperren — während eines
   * Dungeon-Runs sind Respecs und der Crucible gesperrt
   * (docs/spec/PROGRESSION.md#4-checkpoints-wipe--abbruch).
   */
  canOptimize?: () => boolean;
}

/**
 * Der Plan einer schreibenden Action: `next === null` lehnt die Action ab, ohne zu speichern;
 * `result` ist in beiden Fällen ihr Rückgabewert.
 */
interface WritePlan<T> {
  next: SaveData | null;
  result: T;
}

export function createSaveStore(service: SaveService, options: SaveStoreOptions = {}) {
  const canOptimize = options.canOptimize ?? (() => true);
  let hydration: Promise<SaveData> | null = null;
  let pendingWrite: Promise<unknown> = Promise.resolve();

  return createStore<SaveStoreState>((set, get) => {
    /**
     * Serialisierter Schreibpfad aller Actions: Der Folgezustand wird erst berechnet, wenn
     * jeder vorherige Schreibvorgang abgeschlossen ist — überlappende Actions bauen damit
     * aufeinander auf, statt sich gegenseitig zu überschreiben (Lost Update). Der Helper
     * trägt die Status-Übergänge `saving` → `ready` und den Fehlerpfad.
     */
    const persist = <T>(plan: (current: SaveData) => WritePlan<T>): Promise<T> => {
      const write = async (): Promise<T> => {
        const planned = plan(requiredSave(get().data));
        if (planned.next === null) {
          return planned.result;
        }

        set({ status: 'saving' });
        try {
          await service.save(planned.next);
          set({ data: planned.next, status: 'ready' });
          return planned.result;
        } catch (error) {
          set({ status: 'error' });
          throw error;
        }
      };

      const queued = pendingWrite.then(write, write);
      pendingWrite = queued.then(
        () => undefined,
        () => undefined,
      );
      return queued;
    };

    return {
      data: null,
      status: 'idle',

      hydrate: () => {
        const loaded = get().data;
        if (loaded !== null) {
          return Promise.resolve(loaded);
        }

        if (hydration !== null) {
          return hydration;
        }

        set({ status: 'loading' });
        hydration = service
          .load()
          .then((data) => {
            set({ data, status: 'ready' });
            return data;
          })
          .catch((error: unknown) => {
            set({ status: 'error' });
            throw error;
          })
          .finally(() => {
            hydration = null;
          });

        return hydration;
      },

      beginRun: () =>
        persist((current) => {
          const next: SaveData = { ...current, runCounter: current.runCounter + 1 };
          return { next, result: next };
        }),

      commitVictory: (reward) =>
        persist((current) => {
          const commit = commitFloorVictory(current, reward);
          return { next: commit.save, result: commit };
        }),

      spendAttributePoint: (characterId, attribute) =>
        persist((current) => {
          const progression = spendAttributePoint(current.characters[characterId], attribute);
          if (progression === null) {
            return { next: null, result: false };
          }

          return {
            next: {
              ...current,
              characters: { ...current.characters, [characterId]: progression },
            },
            result: true,
          };
        }),

      redistributeAttributePoints: (characterId, target) =>
        persist((current) => {
          if (!canOptimize()) {
            return { next: null, result: false };
          }

          const respec = redistributeAttributePoints(
            current.characters[characterId],
            current.currencies.gold,
            target,
          );
          if (respec === null) {
            return { next: null, result: false };
          }

          return {
            next: {
              ...current,
              characters: { ...current.characters, [characterId]: respec.progression },
              currencies: { ...current.currencies, gold: respec.gold },
            },
            result: true,
          };
        }),

      buyMasteryNode: (characterId, nodeId) =>
        persist((current) => {
          const progression = purchaseMasteryNode(
            characterId,
            current.characters[characterId],
            nodeId,
          );
          if (progression === null) {
            return { next: null, result: false };
          }

          return {
            next: {
              ...current,
              characters: { ...current.characters, [characterId]: progression },
            },
            result: true,
          };
        }),

      respecDiscipline: (characterId, discipline) =>
        persist((current) => {
          if (!canOptimize()) {
            return { next: null, result: false };
          }

          const respec = respecMasteryDiscipline(
            current.characters[characterId],
            discipline,
            current.currencies.gold,
          );
          if (respec === null) {
            return { next: null, result: false };
          }

          return {
            next: {
              ...current,
              currencies: { ...current.currencies, gold: respec.gold },
              characters: { ...current.characters, [characterId]: respec.progression },
            },
            result: true,
          };
        }),

      buyCrucibleNode: (nodeId) =>
        persist((current) => {
          if (!canOptimize()) {
            return { next: null, result: false };
          }

          const purchase = purchaseCrucibleNode(
            current.crucible,
            current.currencies.relicShards,
            current.completedDungeons,
            nodeId,
          );
          if (purchase === null) {
            return { next: null, result: false };
          }

          return {
            next: {
              ...current,
              crucible: purchase.ranks,
              // Der Grimoire-Kauf grantet beide Starter atomar mit Rang und Bezahlung.
              runes: grantRuneGrimoireStarters(current.runes, purchase.ranks),
              // Armor-Menge und -Basis folgen atomar dem neuen Armory-Rang.
              armor: createTeamArmor(purchase.ranks),
              currencies: { ...current.currencies, relicShards: purchase.relicShards },
            },
            result: true,
          };
        }),

      // Inscribe zieht ausschließlich aus dem aktuellen, tiefen-gestaffelten Unbekannt-Pool.
      // Bezahlung, Craft-Roll, Counter und Wissensstand werden als eine Save-Transaktion geplant.
      inscribeRune: (category) =>
        persist((current) => {
          if (!canOptimize() || !isRuneGrimoireUnlocked(current.crucible)) {
            return { next: null, result: false };
          }

          const cost = inscribeCost(category);
          if (
            current.currencies.gold < cost.gold ||
            current.currencies.runewords < cost.runewords
          ) {
            return { next: null, result: false };
          }

          const outcome = inscribeRune(
            current.runes,
            category,
            runeDepthFromFirstVictories(current.firstVictories),
            craftLootPrng(current.saveSeed, current.craftCounter),
          );
          if (outcome === null) {
            return { next: null, result: false };
          }

          return {
            next: {
              ...current,
              craftCounter: current.craftCounter + 1,
              currencies: {
                ...current.currencies,
                gold: current.currencies.gold - cost.gold,
                runewords: current.currencies.runewords - cost.runewords,
              },
              runes: outcome.grimoire,
            },
            result: true,
          };
        }),

      // Etch ist RNG-frei: nur die bekannte Rune, ihre beiden Kosten und der Save ändern sich.
      etchRune: (runeId) =>
        persist((current) => {
          if (!canOptimize() || !isRuneGrimoireUnlocked(current.crucible)) {
            return { next: null, result: false };
          }

          const currentLevel = current.runes[runeId];
          if (currentLevel === undefined || !isRuneLevel(currentLevel)) {
            return { next: null, result: false };
          }
          const cost = etchCost(currentLevel);
          if (
            current.currencies.gold < cost.gold ||
            current.currencies.runewords < cost.runewords
          ) {
            return { next: null, result: false };
          }

          const runes = etchRune(current.runes, runeId, runeLevelCap(current.crucible));
          if (runes === null) {
            return { next: null, result: false };
          }

          return {
            next: {
              ...current,
              currencies: {
                ...current.currencies,
                gold: current.currencies.gold - cost.gold,
                runewords: current.currencies.runewords - cost.runewords,
              },
              runes,
            },
            result: true,
          };
        }),

      respecCrucible: (tree) =>
        persist((current) => {
          if (!canOptimize()) {
            return { next: null, result: false };
          }

          const respec = respecCrucibleTree(current.crucible, current.currencies.relicShards, tree);
          if (respec === null) {
            return { next: null, result: false };
          }

          return {
            next: {
              ...current,
              crucible: respec.ranks,
              currencies: { ...current.currencies, relicShards: respec.relicShards },
            },
            result: true,
          };
        }),

      // Beide Blacksmith-Aktionen sind RNG-frei und schreiben Item und Bezahlung in einem
      // atomaren Save (docs/spec/ITEMS.md#7-blacksmith--temper-masterwork--brand); während
      // eines Runs sperrt das Optimierungs-Prädikat (docs/spec/PROGRESSION.md#4-checkpoints-wipe--abbruch).
      temperArmor: (characterId, slot) =>
        persist((current) => {
          const item = current.armor[characterId][slot];
          if (!canOptimize() || item === undefined) {
            return { next: null, result: false };
          }

          const outcome = applyTemper(item, current.currencies.gold);
          if (outcome === null) {
            return { next: null, result: false };
          }

          return {
            next: {
              ...current,
              currencies: { ...current.currencies, gold: outcome.gold },
              armor: {
                ...current.armor,
                [characterId]: { ...current.armor[characterId], [slot]: outcome.item },
              },
            },
            result: true,
          };
        }),

      masterworkArmor: (characterId, slot) =>
        persist((current) => {
          const item = current.armor[characterId][slot];
          if (!canOptimize() || item === undefined) {
            return { next: null, result: false };
          }

          const outcome = applyMasterwork(item, current.currencies);
          if (outcome === null) {
            return { next: null, result: false };
          }

          return {
            next: {
              ...current,
              currencies: { ...current.currencies, gold: outcome.gold, cinder: outcome.cinder },
              armor: {
                ...current.armor,
                [characterId]: { ...current.armor[characterId], [slot]: outcome.item },
              },
            },
            result: true,
          };
        }),

      // Brand und Re-Brand sind wie Temper/Masterwork RNG-frei: das Zielitem, beide
      // Zahlmittel und die teamweite Sigil-Einmaligkeit werden gegen denselben Save geplant.
      brandArmor: (characterId, slot, sigilId) =>
        persist((current) => {
          const item = current.armor[characterId][slot];
          if (!canOptimize() || item === undefined) {
            return { next: null, result: false };
          }

          const outcome = applyBrand(
            item,
            sigilId,
            current.sigils,
            activeImprintSigilIds(current.armor, { characterId, slot }),
            current.currencies,
          );
          if (outcome === null) {
            return { next: null, result: false };
          }

          return {
            next: {
              ...current,
              currencies: { ...current.currencies, gold: outcome.gold, cinder: outcome.cinder },
              armor: {
                ...current.armor,
                [characterId]: { ...current.armor[characterId], [slot]: outcome.item },
              },
            },
            result: true,
          };
        }),

      // Der einzige Zufall im Handwerk: Der Roll läuft über den loot-Strom des Craft-Seeds
      // (docs/spec/ITEMS.md#8-jeweler--inlay-attune--recut); der craftCounter wird atomar mit
      // Item, Bestand und Bezahlung persistiert, ein Reload liefert denselben Roll.
      inlayGem: (characterId, slot, socketIndex, color) =>
        persist((current) => {
          const item = current.armor[characterId][slot];
          if (!canOptimize() || item === undefined) {
            return { next: null, result: false };
          }

          const outcome = applyInlay(
            item,
            socketIndex,
            color,
            { gold: current.currencies.gold, gems: current.gems },
            craftLootPrng(current.saveSeed, current.craftCounter),
          );
          if (outcome === null) {
            return { next: null, result: false };
          }

          return {
            next: {
              ...current,
              craftCounter: current.craftCounter + 1,
              currencies: { ...current.currencies, gold: outcome.gold },
              gems: outcome.gems,
              armor: {
                ...current.armor,
                [characterId]: { ...current.armor[characterId], [slot]: outcome.item },
              },
            },
            result: true,
          };
        }),

      // Attune ist RNG-frei (Positions-Erhalt in der wachsenden Range) und zahlt Gold plus
      // Fodder gleicher Farbe atomar mit dem Item (docs/spec/ITEMS.md#8-jeweler--inlay-attune--recut).
      attuneGem: (characterId, slot, socketIndex) =>
        persist((current) => {
          const item = current.armor[characterId][slot];
          if (!canOptimize() || item === undefined) {
            return { next: null, result: false };
          }

          const outcome = applyAttune(item, socketIndex, {
            gold: current.currencies.gold,
            gems: current.gems,
          });
          if (outcome === null) {
            return { next: null, result: false };
          }

          return {
            next: {
              ...current,
              currencies: { ...current.currencies, gold: outcome.gold },
              gems: outcome.gems,
              armor: {
                ...current.armor,
                [characterId]: { ...current.armor[characterId], [slot]: outcome.item },
              },
            },
            result: true,
          };
        }),

      // Recut rollt wie das Inlay über den loot-Strom des Craft-Seeds; der craftCounter
      // wird atomar mit Item und Bezahlung persistiert, ein Reload liefert denselben Wert.
      recutGem: (characterId, slot, socketIndex) =>
        persist((current) => {
          const item = current.armor[characterId][slot];
          if (!canOptimize() || item === undefined) {
            return { next: null, result: false };
          }

          const outcome = applyRecut(
            item,
            socketIndex,
            current.currencies.gold,
            craftLootPrng(current.saveSeed, current.craftCounter),
          );
          if (outcome === null) {
            return { next: null, result: false };
          }

          return {
            next: {
              ...current,
              craftCounter: current.craftCounter + 1,
              currencies: { ...current.currencies, gold: outcome.gold },
              armor: {
                ...current.armor,
                [characterId]: { ...current.armor[characterId], [slot]: outcome.item },
              },
            },
            result: true,
          };
        }),

      // Der Abschluss setzt nur das Vollendet-Flag; ein neuer Einstieg entsteht ausschließlich
      // über den Waystone-Kauf (docs/spec/PROGRESSION.md#31-anvil-sparks).
      completeDungeon: (dungeonId) =>
        persist((current) => {
          const next: SaveData = {
            ...current,
            completedDungeons: { ...current.completedDungeons, [dungeonId]: true },
          };
          return { next, result: next };
        }),

      setPlaybackSpeed: (playbackSpeed) =>
        persist((current) => ({
          next: { ...current, playbackSpeed },
          result: undefined,
        })),
    };
  });
}

function requiredSave(data: SaveData | null): SaveData {
  if (data === null) {
    throw new Error('Speicherstand wurde noch nicht geladen.');
  }

  return data;
}

/**
 * Situativer Optimierungs-Guard des Browser-Stores. Das Dungeon-Feature registriert beim Laden
 * seine Run-Sperre (dungeonRunStore.ts); ohne geladenes Dungeon-Feature existiert kein Run,
 * der Default erlaubt deshalb.
 */
let optimizationGuard: () => boolean = () => true;

export function registerOptimizationGuard(guard: () => boolean): void {
  optimizationGuard = guard;
}

const browserSaveService = createSaveService(createLocalStorageSavePort(), () =>
  createDefaultSave(createSaveSeed()),
);

export const saveStore = createSaveStore(browserSaveService, {
  canOptimize: () => optimizationGuard(),
});

export function useSaveStore<T>(selector: (state: SaveStoreState) => T): T {
  return useStore(saveStore, selector);
}

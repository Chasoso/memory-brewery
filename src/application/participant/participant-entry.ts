import { loadFixtures } from "../../adapters/fixture/load-fixtures";
import type { SakeProfile } from "../../domain/brewing/schemas";
import {
  loadParticipantExperience,
  type ParticipantExperience,
} from "./experience";
import { resolveSakeSelection } from "./sake-selection";

export type ParticipantEntry =
  | {
      status: "selected" | "defaulted";
      experience: ParticipantExperience;
      availableSakes: SakeProfile[];
    }
  | { status: "unknown" | "invalid"; availableSakes: SakeProfile[] }
  | { status: "fixture-error"; availableSakes: SakeProfile[] };

export function loadParticipantEntry(search: string): ParticipantEntry {
  try {
    const fixtures = loadFixtures();
    const selection = resolveSakeSelection(
      new URLSearchParams(search),
      fixtures,
    );
    if (selection.status === "unknown" || selection.status === "invalid") {
      return { status: selection.status, availableSakes: fixtures.sakes };
    }
    return {
      status: selection.status,
      experience: loadParticipantExperience(selection.sake.id),
      availableSakes: fixtures.sakes,
    };
  } catch {
    return { status: "fixture-error", availableSakes: [] };
  }
}

import { DEFAULT_SAKE_ID } from "../../adapters/fixture/load-fixtures";
import type { FixtureSet, SakeProfile } from "../../domain/brewing/schemas";

const sakeIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const maximumSakeIdLength = 80;

export { DEFAULT_SAKE_ID };

export type SakeSelection =
  | { status: "selected"; sake: SakeProfile }
  | { status: "defaulted"; sake: SakeProfile }
  | { status: "unknown"; requestedSakeId: string }
  | { status: "invalid" };

/**
 * Resolves the participant entry contract. IDs are case-sensitive, trimmed,
 * lowercase kebab-case fixture IDs. Multiple values are deliberately rejected.
 */
export function resolveSakeSelection(
  searchParams: URLSearchParams,
  fixtures: Pick<FixtureSet, "sakes">,
): SakeSelection {
  const values = searchParams.getAll("sake_id");
  if (values.length === 0) return defaultSelection(fixtures.sakes);
  if (values.length !== 1) return { status: "invalid" };

  const requestedSakeId = values[0]?.trim() ?? "";
  if (
    requestedSakeId === "" ||
    requestedSakeId.length > maximumSakeIdLength ||
    !sakeIdPattern.test(requestedSakeId)
  ) {
    return { status: "invalid" };
  }

  const sake = fixtures.sakes.find(
    (candidate) => candidate.id === requestedSakeId,
  );
  return sake === undefined
    ? { status: "unknown", requestedSakeId }
    : { status: "selected", sake };
}

function defaultSelection(sakes: SakeProfile[]): SakeSelection {
  const sake = sakes.find((candidate) => candidate.id === DEFAULT_SAKE_ID);
  if (sake === undefined) {
    throw new Error(`Default sake fixture is unavailable: ${DEFAULT_SAKE_ID}`);
  }
  return { status: "defaulted", sake };
}

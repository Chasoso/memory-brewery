# Sake entry

## URL contract

The participant entry accepts `/?sake_id=<id>`. Current IDs are `development-sake-snow-01` and `development-sake-water-02`; a future QR may open this same URL, but this MVP neither creates QR images nor reads cameras.

IDs are case-sensitive, trimmed lowercase kebab-case IDs. An omitted value resolves through the explicit `DEFAULT_SAKE_ID` (`development-sake-snow-01`), never through fixture array order. Empty, malformed, overlong, and repeated `sake_id` values are invalid; a syntactically valid but absent ID is unknown. Neither state silently falls back. The recovery controls replace the URL with a selected known ID, so reset and reload retain that selection.

## Synthetic fixtures and land association

Both sake fixtures are wholly synthetic and use fictional brewery/product names. They contain no real-product descriptions, images, source text, or external media. Their normalized traits and `recommendedLandMemoryIds` are hand-authored development parameters. The application resolves those IDs after fixture validation; the UI does not inspect fixture JSON or hard-code sake-specific land lists.

`development-sake-snow-01` has a quieter, water/snow-led base. `development-sake-water-02` has a brighter but fuller, rice/koji-led comparison base. Their land order deliberately differs while each has three valid synthetic LandMemory references.

## Recipe comparison and compatibility

The existing deterministic mapper uses `brightness`, `warmth`, `body`, and `motion` before applying gesture, land, and future-scenario modifiers. Consequently the two fixtures produce different base AudioRecipe values (including tempo, scale/register, density, and timbre) and VisualRecipe values (including particle count/speed and fade) for an identical seed, Clock, participant input, and land. `sakeId` remains part of canonical recipe identity.

`generatorVersion` stays `mulberry32-v1`: the random algorithm, schema, identity order, and mapping contract are unchanged; new fixtures supply different validated inputs. Existing snapshots and recipes therefore remain readable without changing protocol or snapshot versions.

## Test conditions and migration boundary

Unit tests cover URL parsing, the explicit default, invalid/unknown handling, association validation, and comparative recipes. E2E uses `VITE_ENABLE_E2E_MODE=true` plus `?test=1` for fixed seed/clock/animation; this does not enable test mode in ordinary production builds. Real sake data, a catalog, QR generation, and QR reading remain future work and require separate provenance and licensing review.

# Local venue synchronization

Issue 5 implements a local-only handoff from a participant's validated `BrewingRecipe` to venue tabs. It is intentionally limited to tabs or windows in the **same browser profile and origin**. Different browsers, devices, private-window boundaries, networks, and AWS publication are not supported.

## Protocol and snapshot

- BroadcastChannel: `memory-brewery-local-venue-v1`
- localStorage key: `memory-brewery.local-venue.snapshot.v1`
- `protocolVersion`: `1`; messages are `recipe-published` and `collection-cleared` envelopes, validated with Zod.
- `snapshotVersion`: `1`; every recipe is schema-validated on read.
- The participant publishes only after an explicit user operation. A missing venue tab is not an error because the snapshot is written first.
- BroadcastChannel provides live notification. localStorage restores the collection after reload or when a venue opens later. A storage event provides a fallback for other same-origin tabs when BroadcastChannel is unavailable.

The collection is sorted by `createdAt`, then `recipeId`, retains at most 50 recipes, and evicts the oldest deterministically. The first recipe wins for an identical ID; a later same-ID but different JSON payload is rejected rather than overwritten. Clear is confirmed in the venue UI and propagates as a versioned message.

## Aggregate and privacy

`venue-canvas-2d-v1` derives stable marks from each recipe's seed and ID, then combines counts, land IDs, and palette tokens. Identical recipe sets, size, time, renderer version, and reduced-motion configuration produce the same drawing model. The transient arrival caption is not persisted.

The adapter treats both storage and channel data as untrusted. It never inserts HTML, logs free text, retains raw pointer input, image/audio data, or personal identifiers. Storage errors do not stop a live channel notification; a failed participant save remains retryable.

## Future publication boundary

`RecipePublisher` and `LocalVenueSync` are the replacement point for a later server adapter. No AWS, deployment, WebSocket, or venue audio is included here.

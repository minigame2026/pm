# Catalog expansion and balance evidence

Use only the parts relevant to the requested task.

## Batch content without multiplying rework

- Define a machine-readable roster first: stable ID, type, region, form, name, silhouette, skill trigger/effect and art views. Different colors or animal names alone do not establish distinct silhouettes or mechanics.
- Append saved/protocol identifiers; do not insert or reorder existing numeric indices. Check old-save and offline-code compatibility alongside new content.
- Generated atlases need actual alpha inspection. A nominal equal-cell layout does not prove complete sprites: measure connected silhouettes, group detached ornaments, preserve feet, and reject contamination from neighboring sprites. Repair only failing sheets, then register measured rectangles.
- Keep original masters separate from runtime textures. Use a file-filtered conversion for new assets, retaining old UUIDs and original coordinate space; verify all actual SpriteFrames after compression. Do not re-encode the entire catalog for a small batch.
- Stabilize source/assets before the shared build. Treat importer mutations or asynchronous file changes as a reason to inspect/rebuild, not to weaken the source-fingerprint gate.

## Localization is more than key coverage

- Update translation sources and generated dictionaries together. Check dynamic strings and real rendered text, not only preference values.
- Sample narrow screens with long Latin/Cyrillic labels and connected Arabic/Indic scripts. Character-by-character wrapping can break shaping; use word-aware wrapping and appropriate line height. Inspect screenshots and scroll endpoints alongside node-boundary assertions.
- Distinguish translated UI/mechanics from an intentionally shared international proper name or fallback branded logo. Do not claim separate artwork exists for every locale when it does not.

## Balance simulation is not a traversal fixture

- Start from the production onboarding factory and actual single-starter inventory. A legacy test factory may silently grant additional pets.
- Invoke production battle, reward, hatch and breeding functions. Never lower enemy HP, grant unlocked maps/eggs, select favorable random outcomes or inspect the next RNG roll and then call the result a playthrough.
- Make bot behavior explicit: visible dice, potion/guard policy, team selection, reward choice, farm/retry budget, ads, gym bonuses and breeding selection. Report sample count, failures/censoring, seeds and source hash. Bot success is evidence of a possible path, not an actual player completion rate or optimal strategy.
- Use separate first-attempt and progression cohorts; compare hatching-only with hatching-plus-breeding when relevant. Respect opposite-sex pairing, consumption of parents, fixed inheritance and saved egg outcomes.
- Advance only a test time provider for legitimate waiting. Label simulated hatch/breed time separately from player wall-clock time; an intentionally sequential bot is not a retention forecast.
- Follow the current settlement state machine in tests. An assertion expecting an obsolete screen is not evidence of a game defect.

## Current handoff and cleanup

- Regenerate tables from executable rules, then update current entry documents; historical counts embedded in prose can remain wrong after a successful export.
- Remove replaced drafts and dead assets only after checking static, generated and dynamic path references plus platform packaging. Preserve source masters, licenses and expressly frozen legal materials. Keep history in Git, not duplicate current instructions.
- Store reusable project checks in tracked tool locations, and share only relevant skill files. Exclude local credentials, player saves, APK/build caches and generated reports. A source sync does not mean rebuilding or publishing a store version.

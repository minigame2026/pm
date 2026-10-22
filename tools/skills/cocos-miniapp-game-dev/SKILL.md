---
name: cocos-miniapp-game-dev
description: "Develop and validate Cocos Creator games for WeChat or Douyin mini games and Android or iOS apps. Use for Cocos gameplay, asset integration, mobile adaptation, platform builds, and playtesting; not for unrelated browser-only Phaser or Three.js projects."
---

# Cocos Mini Games and Mobile Apps

Deliver a playable Cocos project with evidence for the platforms requested by the user. Keep the user's game design and target platforms authoritative.

## Start from the actual project

- Read project guidance and the actual Creator version from project metadata and the installed editor. Keep an existing project's version unless a change is needed and within scope. For a new project, verify the current supported Creator version instead of hardcoding a latest release.
- Identify the project directory, editor executable, available preview/build commands, orientation, input method, and requested targets. A downloaded Dashboard installer is not an installed Creator editor.
- Reuse the project's setup. For new projects targeting multiple platforms, isolate platform services such as login, ads, sharing, storage, and payments from gameplay. Add only the services the user actually requests.
- Use Creator's TypeScript and engine APIs for production gameplay. A browser prototype may support design exploration, but does not establish a working WeChat, Douyin, or native app build.

## Edit and iterate

### Reuse the project's working conventions

- If the project has a short handoff card linked from `AGENTS.md`, read it before rediscovering paths, decisions, or commands. Follow its task-specific links only; refresh stale facts against the actual files. Update only changed facts at handoff, separating user acceptance from technical checks.
- For a new UI surface, first match an existing accepted screen and reuse its header, navigation, cards, selection/disabled states, and primary action placement. Use the project's UI reference for colors and dimensions; do not turn one game's design into a universal theme. A new surface also needs empty, waiting, ready, unavailable, and return states where relevant.
- Show the information needed for the current action. Put detailed rules behind optional help; retain consequences of spending resources or losing owned items. A familiar icon may replace text, but an ambiguous action still needs a short label.
- Prefer the project's selective validation entry point. Choose checks from the current task/change set, not every historical uncommitted file. UI work needs relevant interaction checks and inspected screenshots; rule/storage changes need the affected invariants and save recovery. Do not register an old test solely because it exists: verify that its entry point and assertions match the current game.
- Keep automated fixtures in isolated browser contexts. Use a controllable test clock for long timers. Distinguish a failing test selector from a product defect before changing game code. Report script passes separately from visual inspection and user acceptance.
- After relevant checks pass, deliver the existing playable URL. A successful browser run does not establish mini-game platform or device compatibility.

- Implement a small complete gameplay loop, then adjust controls, feedback, difficulty, assets, and UI from playtest evidence.
- Preserve asset `.meta` files and existing UUID references. Inspect the actual serialization format before changing scenes or prefabs directly; prefer supported editor operations when available and reimport to verify changes.
- Use engine facilities for input, scene transitions, audio, and resource loading. Do not assume DOM or browser-only APIs exist in mini-game or native runtimes.
- Expose frequently tuned values through component properties or the project's configuration so iteration does not require searching scattered constants.
- Check touch targets, portrait/landscape layout, safe areas, pause/resume, audio activation, and storage behavior on the intended device/runtime.
- Treat generated art as source material: check consistent scale, pivots, alpha, animation frames, import settings, and texture cost inside the game.
- When a project ships both mini games and native apps, keep rule resolution and save state shared while placing richer animation/resources behind presentation capabilities. If the user approves one effect for both targets, share that effect without enabling the entire native presentation package; verify hit timing and cleanup on the affected path.
- For localized branding that was designed as artwork, use a locale-to-asset registry rather than substituting plain translated labels as the finished logo. Load only the selected locale's image, preserve its aspect ratio, and inspect the actual localized cover at small-phone size; generic UI labels still use normal translation.

## Evidence-based checks for iterative games

For large catalog/map additions, many-language layouts, balance simulations, or cleaning a reusable handoff, read [Catalog expansion and balance evidence](references/catalog-and-balance.md). It covers alpha-based atlas checks, stable saved identifiers, actual fresh-player progression, and reference-aware cleanup; it is not a mandatory checklist for small UI edits.

- For resume/crash guarantees, distinguish in-memory state, a storage API returning, and durable persistence. Commit complete gameplay results before their animations; test restart with the same isolated profile after force-terminating only its known test process. Refresh alone does not establish process-kill durability. List every save mirror when documenting a user-authorized reset or template copy.
- Validate clipped sprites at the largest actual animation scale/displacement, with their transparent bounds and small-screen layout. A static centered screenshot is insufficient for a moving masked portrait.
- Reuse module-specific check groups and combine overlapping tasks into one build. Reuse a build only when both source/asset/config fingerprints and output fingerprints match; documentation-only checks should not launch the engine. Await asynchronous action commits in automation fixtures.
- When preparing a template or repository handoff, regenerate data from current code, check local document links, and remove superseded guidance from the current entry points. Keep asset provenance separate from gameplay truth; retain Git history instead of replaying obsolete generation/patch scripts.
## Build and validate

Read [Platform builds](references/platform-builds.md) when configuring exports, interpreting build results, or preparing target-platform tests.

- Use the installed Creator executable and version-matched documentation. Prefer saved build configurations exported from the editor over invented parameter schemas.
- Keep build artifacts separate from source. Prefer source build templates/extensions over hand edits that the next export overwrites.
- For Creator 3.8 command-line builds, the documented success exit code is **36**, not the conventional 0; 32 and 34 indicate failures. Check the actual version, logs, and resulting artifacts together before reporting success.
- Browser preview and Playwright checks help with gameplay and visual regression. Mini-game developer tools and device checks are separate validation stages. Native compilation and device launch are separate from exporting the native project.
- Report which stages actually ran, the output location, unresolved problems, and the next useful playtest. Never infer runtime success from an export folder alone.

## Editor automation and scope

- Start with project files, documented Creator command-line builds, and available computer-use tools. An MCP connector is optional; confirm its engine compatibility and actual tool responses before depending on it.
- The official `cocos/cocos-cli` contains MCP functionality, but it is not automatically interchangeable with an installed Creator 3.8 editor. Verify the relevant compatibility and build prerequisites first.
- Keep account IDs, platform SDK choices, and signing material specific to the user's project. Do not copy example AppIDs from documentation into a release configuration.
- An export or local test is distinct from uploading, submitting for review, or publishing. Follow the user's existing authorization for those external actions.

## Useful starting sources

- [Creator manual](https://docs.cocos.com/creator/3.8/manual/en/)
- [Creator downloads](https://www.cocos.com/creator-download)
- [Official Cocos CLI](https://github.com/cocos/cocos-cli)

The linked manual is the verified 3.8 reference. Switch to matching documentation when the actual project uses a different version.

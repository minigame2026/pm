# Platform builds and evidence

Use only the sections relevant to the requested target. Platform rules, package limits, SDK versions, and store requirements change: consult current first-party documents when they affect a build, rather than treating old numeric limits as permanent.

## Creator command-line builds

Use the actual installed editor, project path, and a JSON configuration exported from its Build panel. A Windows PowerShell invocation has this shape:

```powershell
& $creatorExe --project $projectDir --build "configPath=$buildConfig"
$creatorExitCode = $LASTEXITCODE
```

The variables must point to verified paths. Creator 3.8 documents exit codes 36 (success), 32 (invalid parameters), and 34 (build error). Preserve full logs in the project's intermediate-work location; show a short diagnostic summary to the user.

Distinguish `build` (export/build assets and target project) from native `make` (compile the native app). Use explicit requested targets and inspect generated files, rather than relying on whichever platform was last selected in the editor.

Source: [Command-line publishing](https://docs.cocos.com/creator/3.8/manual/en/editor/publish/publish-in-command-line.html).

## WeChat mini games

- Use Creator's WeChat target and the project's real AppID where required.
- Import the generated mini-game project into WeChat DevTools. Confirm startup, main input, game-over/restart, asset loading, and logs there.
- Verify the required domain, subpackage, remote-resource, and platform-service settings against current platform documentation when used.
- A working browser preview does not prove WeChat runtime compatibility. Record whether developer-tool tests and physical-device tests were performed.

Source: [WeChat publishing](https://docs.cocos.com/creator/3.8/manual/en/editor/publish/publish-wechatgame.html).

## Douyin mini games

- Use Creator's Douyin target; the documented build output defaults to `bytedance-mini-game`, subject to the task name/configuration.
- Import the generated project into Douyin DevTools with the appropriate project identity. Exercise gameplay, lifecycle transitions, audio, resource loading, and requested platform services.
- Keep Douyin-specific APIs behind a project adapter; do not reuse WeChat calls by renaming prefixes without checking API behavior.

Source: [Douyin publishing](https://docs.cocos.com/creator/3.8/manual/en/editor/publish/publish-bytedance-mini-game.html).

## Android apps

- Determine the SDK, NDK, JDK, Android Studio, and other build requirements from the exact Creator version and project's generated native configuration.
- Keep export, native compilation, package production, and actual installation/launch as separate reported results.
- Use the project's intended package identifier and signing setup. Do not put signing secrets into source files or logs.
- Test touch, safe areas, lifecycle pause/resume, audio, storage, and performance on the target hardware when available.

Sources: [Native environment](https://docs.cocos.com/creator/3.8/manual/en/editor/publish/setup-native-development.html), [Android publishing](https://docs.cocos.com/creator/3.8/manual/en/editor/publish/android/index.html).

## iOS apps

- Share portable gameplay and assets with the other targets, while preserving native service boundaries.
- Native iOS compilation requires macOS and Xcode; signing/distribution depends on the appropriate Apple setup. A Windows-only environment cannot complete this stage locally.
- When no Mac is available, complete the work possible on the current host and explicitly describe the remaining build/device checks. Do not claim an IPA or device run that did not occur.

Source: [iOS publishing](https://docs.cocos.com/creator/3.8/manual/en/editor/publish/ios/index.html).

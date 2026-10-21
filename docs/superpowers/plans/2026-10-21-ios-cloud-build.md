# iOS cloud build

User request: build this game on GitHub Actions macOS, reusing existing signing materials.

1. Audit the supplied P12 and App Store profile without exposing credentials.
2. Add a manual/dedicated-branch workflow using Creator 3.8.7 and Xcode 26, production settings and existing app artwork.
3. Push an isolated snapshot of current runtime files and execute the cloud build. Export an App Store IPA only with a matching distribution private key.
4. Report the actual build result and any external dependency; preserve the user's working tree.

Audit: P12 password works and includes a development private key. The App Store profile is valid for com.dice.pet.rpg through 2027-08-25 but embeds a different distribution certificate. Signed export is blocked pending its private key. Proceed with unsigned compilation verification; do not upload the mismatching development key.

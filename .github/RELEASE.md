# Release Process

We use [release-it](https://github.com/release-it/release-it) to automate the release process.

Use `pnpm release` to create a release, which should:

1. Ensure tests are passing and the project is building properly.
2. Build a new Docker image for the bot and publish it to Docker Hub.
3. Bump versions across the project.
4. Push the new commit and tag to GitHub.
5. Create a new release on GitHub.

## Versioning

The Serenity project does _not_ follow [SemVer](https://semver.org). Instead, we follow a slightly modified versioning scheme, which is described below.

Version numbers follow the structure `MAJOR.MINOR.PATCH`, where:

- **Major** is used when there has been a significant refactor/addition to the codebase.
- **Minor** is used when features have been added, removed, or refactored.
- **Patch** is used when bug fixes or performance optimizations have occurred.

## Breaking Changes

We consider a "Breaking Change" to be one that requires more work than normal on behalf of the person hosting the bot when upgrading, e.g, a migration script needs to be ran or a new configuration option needs to be set.

Breaking changes have no direct correlation to major version bumps, but they will be included in changelogs for the new release.

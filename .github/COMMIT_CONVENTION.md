# Git Commit Message Convention

> This is adapted from Angular's [commit message guidelines](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular).

# Table of Contents

- [TL;DR](#tl;dr)
- [Examples](#examples)
- [Commit Message Format](#commit-message-format)
  - [Revert](#revert)
  - [Type](#type)
  - [Scope](#scope)
  - [Subject](#subject)
  - [Body](#body)
  - [Footer](#Footer)

# Tl;DR

Messages must be matched by the following regex:

```js
/^(revert: )?(chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\(.+\))?: .{1,72}/;
```

# Examples

Appears under 'Features' header, `core` subheader:

```
feat(core): implement regex triggers for commands
```

Appears under 'Bug Fixes' header, `mute` subheader, with a link to issue #28:

```
fix(mute): don't re-mute members

Closes #28
```

Appears under 'Performance Improvements' header:

```
perf(anti-swear): optimize pattern runner
```

The following commit and commit `667ecc1` do not appear in the changelog if they are under the same release.
If not, the revert commit appears under the 'Reverts' header.

```
revert: feat(framework): implement regex triggers for commands

This reverts commit 667ecc1654a317a13331b17617d973392f415f02.
```

# Commit Message Format

A commit message consists of a **header**, **body** and **footer**. The header has a **type**, **scope** and **subject**:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

The **header** is mandatory and the **scope** of the header is optional.

## Revert

If the commit reverts a previous commit, it should begin with `revert: `, followed by the header of the reverted commit.
In the body it should say: `This reverts commit <hash>.`, where the hash is the SHA of the commit being reverted.

## Type

If the prefix is `feat`, `fix` or `perf`, it will appear in the changelog.
Other prefixes are up to your discretion. Suggested prefixes are `build`, `ci`, `docs` ,`style`, `refactor`, and `test` for non-changelog related tasks.

## Scope

The scope could be anything specifying place of the commit change. For example `framework`, `mute`, `moderation-manager`, etc...

## Subject

The subject contains a succinct description of the change:

- use the imperative, present tense: "change" not "changed" nor "changes"
- don't capitalize the first letter
- no dot (.) at the end

## Body

Just as in the **subject**, use the imperative, present tense: "change" not "changed" nor "changes".
The body should include the motivation for the change and contrast this with previous behavior.

## Footer

The footer should contain any information about **Breaking Changes** and is also the place to
reference GitHub issues that this commit **Closes**.

**Breaking Changes** should start with the word `BREAKING CHANGE:` with a space or two newlines. The rest of the commit message is then used for this.

You may want to see [RELEASE.md](./RELEASE.md) for what constitutes a breaking change for this project; our definition of a breaking change does not align with that of most other projects.

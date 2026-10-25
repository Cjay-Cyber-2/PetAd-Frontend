# Contributing to PetAd Frontend

Thanks for helping out. This guide takes you from a fresh clone to a merged pull
request. For product background see the [README](README.md); for how the app is
wired together see [docs/local-dev.md](docs/local-dev.md).

## 1. Set up

```bash
git clone https://github.com/<you>/PetAd-Frontend.git   # your fork
cd PetAd-Frontend
git remote add upstream https://github.com/amina69/PetAd-Frontend.git
npm ci
cp .env.example .env     # then adjust; see docs/local-dev.md
npm run dev
```

Node `>=20.19` is required. By default you can work entirely offline: set
`VITE_MSW=true` and the Mock Service Worker answers API calls (see "Mock API (MSW)" in the README).
Switch to the staging API when your change touches real data flow — the
[local-dev guide](docs/local-dev.md) explains when to use which.

## 2. Pick an issue and branch

Work from an issue. Comment on it so nobody duplicates the effort, then branch
from an up-to-date `main`:

```bash
git fetch upstream
git switch -c feat/123-short-description upstream/main
```

Branch names are `<type>/<issue-number>-<short-description>`, where `<type>` is
one of `feat`, `fix`, `docs`, `refactor`, `test`, `perf`, `ci` or `chore`
(e.g. `feat/606-dispute-types-schemas`, `docs/528-local-dev-workflow`).

## 3. Commit

Use [Conventional Commits](https://www.conventionalcommits.org/): a type, an
optional scope in parentheses, a short imperative summary, and the issue number
when there is one.

```
feat(dispute): add dispute domain types and comment schema (#606)
fix(a11y): support accessible category select labels
docs: add local dev vs. staging backend workflow guide
```

Keep commits focused. Do not commit `.env`, secrets, build output (`dist/`,
`coverage/`) or personal notes.

## 4. Write the change

The code is organised by feature. Cross-cutting code lives in `src/components`,
`src/hooks`, `src/lib` and `src/api`; each domain gets a folder under
`src/features/`.

### Adding a feature folder

Mirror an existing one such as `src/features/approval`:

```
src/features/<feature>/
├── api/            # service functions that call apiClient and parse responses
├── components/     # UI used only by this feature
├── hooks/          # TanStack Query hooks (queries, mutations, key factories)
├── schemas/        # Zod schemas — the single source of truth for shapes
├── types/          # types; infer them from the schemas where possible
├── __tests__/      # tests live next to the code they cover
└── index.ts        # the feature's public surface
```

Then wire it in:

1. **Page and route** — add the page under `src/pages/` and a lazy route in
   `src/App.tsx` (wrap protected routes the way neighbouring routes do).
2. **Mock API** — add handlers in `src/mocks/handlers/` and register them in
   `src/mocks/handlers/index.ts`, so the feature works offline and in tests.
3. **Docs** — describe behaviour a newcomer could not guess in
   `docs/features/<feature>.md`.

### Conventions

- TypeScript strict mode; no implicit `any`.
- Validate forms and API responses with **Zod**.
- Handle **loading, empty and error states** explicitly.
- Use `logger` from `src/lib/logger` instead of `console.*`, and never log
  personal data (see the privacy notes in the README).
- Keep components small and single-purpose.
- Make UI work with a keyboard and a screen reader. The
  [accessibility guide](docs/accessibility.md) has the checklist.
- Follow the Figma design file linked under "Design Reference" in the README.

## 5. Check locally

Run the same checks CI runs. They must all pass:

```bash
npm run type-check   # tsc -b
npm run lint
npm test
npm run build
```

Also run `npm run e2e` when you touch a user flow (it needs
`npx playwright install` once).

## 6. Open a pull request

Push your branch to your fork and open a PR against `amina69/PetAd-Frontend`
`main`. The PR description is pre-filled from the
[pull request template](.github/pull_request_template.md); fill in every section:

- [ ] `npm run type-check`, `npm run lint`, `npm test` and `npm run build` pass
- [ ] New behaviour has tests
- [ ] Accessibility checked using [docs/accessibility.md](docs/accessibility.md)
- [ ] UI changes include **screenshots next to the Figma frame** (same viewport,
      light and dark where relevant)
- [ ] Docs and [CHANGELOG.md](CHANGELOG.md) updated if behaviour changed
- [ ] The PR body says `Closes #<issue>` for each issue it resolves

CI runs on every push to the PR (see [docs/ci.md](docs/ci.md)). A PR cannot merge
while any check is red. If `main` moves and your PR conflicts, merge or rebase
`upstream/main` into your branch and re-run the checks.

## 7. Release checklist

Releases are cut by a maintainer. Staging and production deployments are
described in [docs/deploy.md](docs/deploy.md).

1. [ ] `main` is green and contains everything intended for the release.
2. [ ] Move the `[Unreleased]` entries in [CHANGELOG.md](CHANGELOG.md) under a new
       `## [x.y.z] - YYYY-MM-DD` heading and bump `version` in `package.json`.
       Merge that change to `main` through a normal PR.
3. [ ] Deploy to staging: `git push upstream main:staging`. The *Deploy*
       workflow builds with the `staging` environment values.
4. [ ] **Staging smoke test** against the staging deployment: sign in, browse
       listings and open a pet, start an adoption, receive a notification,
       open an approval and a dispute. Check the browser console for errors.
5. [ ] Tag the release: `git tag vX.Y.Z && git push upstream vX.Y.Z`.
6. [ ] **Production approval** — the production job pauses until a required
       reviewer approves it in the `production` GitHub Environment.
7. [ ] Smoke-test production the same way, then publish the GitHub release
       notes from the changelog entry.
8. [ ] **Rollback** if something is wrong: follow "Roll back" in
       [docs/deploy.md](docs/deploy.md) (promote the last known-good Vercel
       deployment), then record the incident and open a fix PR.

## Reporting bugs and proposing features

Use the issue templates: **Bug report** or **Feature request**. Search existing
issues first, and include enough detail for someone else to reproduce or
understand the need.

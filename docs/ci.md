# Continuous integration

Workflows live in `.github/workflows/`:

| Workflow | Runs on | Purpose |
| --- | --- | --- |
| `ci.yml` | pushes and PRs to `main` | Verify the change |
| `preview.yml` | PRs to `main` | Per-PR preview deployment |
| `deploy.yml` | pushes to `staging`, `v*` tags | Staging and production deploys ([docs/deploy.md](deploy.md)) |

## `ci.yml` jobs

Each job reports its own status on the PR, so you can see at a glance what
failed.

| Job (check name) | Command |
| --- | --- |
| `Install` | `npm ci`, `npm audit --audit-level=high`, lockfile unchanged check. Caches `node_modules` for the jobs below. |
| `Type check` | `npm run type-check` |
| `Lint` | `npm run lint` |
| `Unit tests` | `npm run test:coverage` (uploads the `coverage` artifact) |
| `Build` | `npm run build` (includes the production MSW guard) |
| `e2e` | `npm run test:e2e` (Playwright; uploads `playwright-report`) |
| `CI success` | Fails unless every job above succeeded |

All jobs use Node 20. A new push to the same pull request cancels the superseded
run; runs on `main` are never cancelled.

Reproduce a job locally with the same command, e.g. `npm run type-check`.

## Required status checks

The workflow cannot enforce merge rules by itself — a repository admin has to
turn them on. In **Settings → Branches → Branch protection rule for `main`**:

1. Enable **Require status checks to pass before merging** and **Require
   branches to be up to date before merging**.
2. Add **`CI success`** as a required check. It is red if any job is red,
   failed, cancelled or skipped, and it stays correct if jobs are added later
   (add the new job to its `needs` list).
3. Optionally also require `e2e` and the individual jobs for clearer messages.

If `validate` is currently a required check, replace it: that job was split into
`Install`, `Type check`, `Lint`, `Unit tests` and `Build`, so a required check
named `validate` would wait forever.

## PR previews

See [Pull request previews](deploy.md#pull-request-previews).

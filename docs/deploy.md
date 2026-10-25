# Staging and production deployments

Deployments use the `Deploy` GitHub Actions workflow and Vercel. Application
configuration is compiled into the static Vite bundle, so the correct
environment values must be selected before `vercel build` runs.

## Configure GitHub environments

Create GitHub Environments named `staging` and `production` in the repository
settings. Set `production` required reviewers and restrict its deployment
branches/tags to `v*`; GitHub pauses the production job until an authorized
reviewer approves it. Restrict `staging` to the `staging` branch.

Configure these values independently in both environments:

| Name | Type | Purpose |
| --- | --- | --- |
| `VERCEL_TOKEN` | Secret | Vercel deployment credential |
| `VERCEL_ORG_ID` | Variable | Vercel team/account ID |
| `VERCEL_PROJECT_ID` | Variable | Vercel project ID |
| `VITE_API_URL` | Variable | Environment's API base URL |
| `VITE_WEBSOCKET_URL` | Variable | Environment's `wss://` notification endpoint |
| `VITE_ENABLE_ANALYTICS` | Variable | Environment-specific analytics opt-in (`true` or `false`) |

Use staging-only API and WebSocket URLs in the staging environment, and
production-only URLs in production. Do not copy production application secrets
or API credentials into staging. `VITE_*` values are public build-time values;
never put credentials in them. Keep private credentials in server-side hosting
environment variables. Configure matching staging/production environment
values in Vercel as well for platform functions or previews that do not use
this workflow.

## Deploy

- Every push to `staging` builds with the `staging` GitHub Environment values
  and deploys a Vercel Preview deployment.
- Push a version tag such as `v1.2.3` to build the tagged commit with the
  `production` values. The production job requires the configured GitHub
  Environment approval before it can deploy.
- The workflow uses `vercel pull` to link the configured project, builds the
  Vite app with the selected environment values, then deploys the prebuilt
  output. A missing value should be fixed in the corresponding GitHub
  Environment; do not fall back to a production value in staging.

## Pull request previews

`preview.yml` deploys every pull request to its own Vercel preview, posts the
URL in a single comment that is updated on each push, and removes the
deployment when the PR is closed or merged.

Create a GitHub Environment named `preview` (no reviewers, no branch
restriction) with the same names as in the table above:

| Name | Type | Value for previews |
| --- | --- | --- |
| `VERCEL_TOKEN` | Secret | Vercel deployment credential |
| `VERCEL_ORG_ID` | Variable | Vercel team/account ID |
| `VERCEL_PROJECT_ID` | Variable | Vercel project ID |
| `VITE_API_URL` | Variable | **Staging** API base URL |
| `VITE_WEBSOCKET_URL` | Variable | **Staging** `wss://` notification endpoint |

Notes:

- Previews always use the staging API. The mock service worker (MSW) is **off**:
  it only runs in the dev server, and production builds deliberately refuse
  `VITE_MSW=true` (see the production guard in the README). Analytics are off.
- Pull requests from forks are skipped, because GitHub does not give workflows
  secrets for them. Maintainers can push the branch to this repository to get a
  preview.
- If the Vercel Git integration is also installed on the repository it posts its
  own preview too; disable it for this project if you only want one.

## Roll back

1. Open the Vercel project and select **Deployments**.
2. Identify the last known-good deployment, check its commit/tag and environment,
   and open its deployment menu.
3. Promote that deployment to production (or redeploy it, if promotion is not
   available) and confirm the production alias points to it.
4. Smoke-check the app and API/realtime connectivity, then record the incident
   and deployment IDs.

This is the rollback procedure. A real rollback still requires a project
owner to exercise it once after Vercel and GitHub Environment configuration is
available; this repository change cannot verify a live deployment.

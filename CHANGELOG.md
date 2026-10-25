# Changelog

All notable changes to PetAd Frontend are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/). Move entries from **Unreleased** to a
dated version heading when a release is cut (see the release checklist in
[CONTRIBUTING.md](CONTRIBUTING.md#7-release-checklist)).

## [Unreleased]

### Added

#### Phase 3
- **Messaging:** message thread with infinite scroll, optimistic composer,
  attachments, and live delivery/read state (`src/features/messaging`).
- **Admin console foundations:** Zod schemas, types and `adminService` for users,
  the audit log and stats, with a reusable `paginatedSchema` and a global 403
  handler that shows a friendly message instead of the raw error.
- **Approvals:** `useApprovalList` and `useApprovalDetail` hooks (with list-cache
  seeding), approval queue pagination with resilient list states.
- **Custody:** custody types and Zod schemas; `custodyService` with
  list/detail/request/extend/end; a caretaker dashboard with in-place approval.
- **Disputes:** dispute domain types, comment and submission-form schemas,
  evidence attachments on the dispute form, and a create-dispute hook.
- **Adoption:** adoption form with validation schemas and applicant step
  (validates on blur, prefilled from the signed-in user); adoption status page
  with terminal-aware polling and rejection reasons.
- **Notifications:** preferences settings UI, real-time notification stream and
  socket manager, optimistic "mark as read", and screen-reader announcements for
  new notifications.
- **Auth:** password reset request and reset screens; Freighter wallet connection.
- **Delivery:** secure deployment and dependency workflows, a Playwright
  cross-browser smoke suite in CI, and an `.env.example` listing every variable.
- **CI and docs:** split CI jobs with coverage, PR preview deployments,
  contributing guide, changelog and issue/PR templates.
- **Docs:** local-dev vs. staging guide, accessibility testing workflow and
  route audit, responsive audit of Phase 3 screens, query-cache freshness notes,
  and a Figma alignment report for the approval UI.

### Changed
- Status labels, colours and icons are centralised in `src/lib/statusConfig.ts`,
  including the custody request vocabulary.
- Route pages are split into lazy chunks and the notification dropdown is
  deferred until opened.
- Focus is managed in modal and notification flows; keyboard route navigation and
  text contrast were improved.

### Fixed
- Vulnerable npm lockfile packages were updated.
- Accessible names were added to form controls and category selects.
- React versions and auth state were stabilised.

### Security
- Builds refuse `VITE_MSW=true` for production targets so the mock service worker
  can never ship in a production bundle.

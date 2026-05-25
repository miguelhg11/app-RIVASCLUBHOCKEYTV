# YouTube Integration Governance (Rivas TV)

## Purpose

Capture the agreed rules for how this app must integrate with YouTube Live, plus the technical audit and execution plan, so the team does not lose context.

## Cross-Platform Product Direction

- The product target is an installable PWA for phones and tablets.
- Priority install/use platforms: Android and iOS.
- iOS Safari limitations must be considered explicitly; users should be guided to use Chrome when Safari behavior is not reliable for operational flows.
- The UI must remain reactive and fully responsive on desktop (Windows/macOS), tablets, Android phones, and iPhone.
- No device-specific layout should break critical flows (login, agenda, schedule, active/live monitoring, finish broadcast).

## Product Rules (Agreed)

### Core behavior

- The app is the operational layer; YouTube remains the source of truth for live objects.
- Stream keys are reusable and managed by admins.
- Stream keys are assigned to teams for organization.
- A stream key already reserved by a pending/active broadcast cannot be reused for a new scheduling.
- Users should not need to change key settings in OBS/encoder every week.

### Scheduling form rules

- `Title`: required.
- `Description`: optional.
- `Thumbnail`: auto-generated for federation-based scheduling (FMP/RFEP), manual upload/selection for manual scheduling.
- `Playlist`: must come from channel playlists synced from YouTube.
- `Made for kids`: default `No, not made for kids`.
- `Personalization`: keep YouTube defaults.
- `Visibility`: default `Unlisted`.
- If user selects `Public`, show mandatory warning + explicit confirmation:
  - "El usuario afirma que tiene autorizacion expresa del club para emitir en abierto como emision publica."
- `Date`: calendar picker.
- `Time`: hour/minute time picker.

### YouTube broadcast configuration rules

- Ingestion URL should not be manually chosen by user.
- Latency must always be `normal`.
- Auto-start must always be enabled.
- User must be able to end an active broadcast from the app.
- Remaining YouTube options should stay at defaults unless explicit product decision changes this.

## YouTube Domain Model (Operational)

- `liveStream` = ingestion endpoint + stream key; reusable.
- `liveBroadcast` = one scheduled/live event.
- One broadcast binds to one stream; one stream can be reused across broadcasts over time.
- A broadcast used by incoming signal is consumed; if started by mistake, it must be replaced by a new broadcast.

## URL Handling Rule

- Share/watch URL must be persisted in app and shown to users.
- App should not scrape YouTube Studio share modal.
- URL is derived from API `broadcastId`.

Recommended persisted URLs:

- `youtube_watch_url`: `https://www.youtube.com/watch?v={broadcastId}`
- `youtube_share_url`: `https://youtube.com/live/{broadcastId}?feature=share`
- `youtube_embed_url`: `https://www.youtube.com/embed/{broadcastId}`

## Data and Permissions Contract

### Confirmed governance decision

- `broadcasts` stores broadcasts created and governed by this app.
- `youtube_external_broadcasts` stores broadcasts detected in YouTube Studio created outside this app.
- External broadcasts are admin/diagnostic data and must not be auto-inserted into `broadcasts` with fake team/key ownership.
- External broadcasts must still participate in stream key occupancy checks so a reserved/live key cannot be reused.

### Stream keys

Minimum fields:

- `id`
- `name`
- `youtube_live_stream_id`
- `stream_key` (masked in UI/logs)
- `rtmp_url`
- `active`
- `created_at`, `updated_at`

### Team assignment

- `team_stream_keys(team_id, stream_key_id)`

### Playlists

Minimum fields:

- `id`
- `name`
- `youtube_playlist_id`
- `description` (optional)
- `active`

### User permissions

- `user_teams`
- `user_playlists`

## Availability Policy for Stream Keys

A key is selectable only when:

- Key is active.
- User has permission for team/key.
- No pending/active broadcast is currently bound to that key.

Suggested status labels:

- `free`
- `reserved` (scheduled/pending)
- `live`
- `completed`
- `cancelled`
- `unknown` (sync not confirmed)

Safety rule:

- Treat `unknown` as non-selectable until resync confirms availability.
- Occupancy must consider both app-owned broadcasts and external YouTube-detected broadcasts.

## YouTube API Capability Audit

### Verified in this project

- OAuth refresh token exchange works (`check:youtube-token` passed).
- Channel read smoke succeeded via API (playlists, broadcasts, liveStreams visible).

### API operations required and supported

- Create broadcast: `liveBroadcasts.insert`
- Bind broadcast to stream: `liveBroadcasts.bind`
- List channel broadcasts: `liveBroadcasts.list`
- Transition to end broadcast: `liveBroadcasts.transition` (`broadcastStatus=complete`)
- Create/list/update/delete streams: `liveStreams.insert/list/update/delete`
- List playlists: `playlists.list`
- Insert video into playlist: `playlistItems.insert`
- Set thumbnail: `thumbnails.set`

Required OAuth scope (minimum currently used):

- `https://www.googleapis.com/auth/youtube`

## Current Code Audit Snapshot

### Already implemented

- Real OAuth client and YouTube API integration in `src/lib/youtube/service.ts`.
- Broadcast creation with:
  - `privacyStatus: unlisted`
  - `latencyPreference: normal`
  - `enableAutoStart: true`
  - `enableAutoStop: false`
- Broadcast to stream binding and playlist insertion.
- Channel->app sync entrypoint for broadcasts in `src/actions/broadcast.actions.ts`.
- App persists watch/embed URL fields.

### Missing to satisfy final product rules

- Real-time sync for stream inventory (`liveStreams`) into admin key governance.
- Real-time sync for channel playlists into app playlists.
- Key occupancy guard based on active/scheduled YouTube state.
- User action to end active broadcast from app.
- Thumbnail automation/upload flow in production path.
- Explicit `selfDeclaredMadeForKids=false` handling.
- Public visibility confirmation gate.
- Persist/share URL in `/live/{id}` format where desired by product.
- Separate external YouTube broadcasts from app-owned broadcasts in persistence model.

## Execution Plan (Phased)

### Phase 1 - Sync foundations

1. Implement YouTube sync service for:
   - `liveStreams.list`
   - `playlists.list`
   - `liveBroadcasts.list`
2. Add admin sync command/buttons and audit log events.
3. Store external objects with `last_youtube_sync_at` and sync status.
4. Persist external broadcasts into `youtube_external_broadcasts` (not `broadcasts`).

### Phase 2 - Scheduling guardrails

1. Build key availability resolver from broadcast states.
2. Disable non-available keys in scheduling UI with explicit reason.
3. Revalidate availability server-side just before create call.

### Phase 3 - Broadcast lifecycle control

1. Add "Finalizar emision" action using `liveBroadcasts.transition(...complete)`.
2. Sync resulting state back into local broadcast rows.
3. Surface pending/live/completed/cancelled in user and admin views.

### Phase 4 - Media and policy enforcement

1. Add thumbnail generation/upload pipeline (`thumbnails.set`).
2. Enforce default `Unlisted` visibility.
3. Add public visibility legal confirmation gate.
4. Set audience policy fields explicitly where supported.

### Phase 5 - UX completion

1. Ensure scheduled broadcast cards always expose click-through URL.
2. Display both watch/share links in details when useful.
3. Add clear diagnostics for quota, OAuth, permission and occupancy errors.

### Phase 6 - PWA and responsive hardening

1. Implement installable PWA baseline:
   - `manifest.webmanifest`
   - icons set
   - service worker strategy suitable for operational dashboard use
2. Validate install flows on Android and iOS.
3. Add user-facing guidance for iOS Safari caveats and preferred Chrome usage.
4. Run responsive QA matrix across:
   - desktop web (Windows/macOS)
   - tablets
   - Android phones
   - iPhone
5. Define and enforce non-regression checks for critical mobile flows.

## Acceptance Criteria

- User can create a broadcast only with available assigned resources.
- Key already reserved/live cannot be selected.
- Created broadcast appears with valid clickable YouTube URL.
- Channel sync shows pending/live/completed broadcasts accurately.
- User can end active broadcast from app.
- Playlist options in app match channel playlists (within sync window).
- Public visibility requires explicit legal confirmation.
- App is installable as PWA on supported mobile platforms.
- Responsive behavior is correct on desktop/tablet/mobile without blocking critical actions.

## Operational Risks

- YouTube quota/rate limits.
- OAuth token revocation/invalid grant.
- Manual changes in YouTube Studio creating temporary drift.
- Unknown sync state incorrectly allowing key reuse (must be blocked by policy).

## Non-negotiable Security/Privacy Rules

- Never print tokens or stream keys in logs.
- Mask stream keys in UI.
- Keep credentials only in secure env/config.
- Avoid destructive actions without explicit user/admin intent.

## References (internal)

- `src/lib/youtube/service.ts`
- `src/actions/broadcast.actions.ts`
- `src/lib/user/queries.ts`
- `src/lib/admin/queries.ts`
- `scripts/check-env.mjs`

## Migration note

- Schema support for this governance model is introduced in `supabase/migrations/005_youtube_governance_schema.sql`.

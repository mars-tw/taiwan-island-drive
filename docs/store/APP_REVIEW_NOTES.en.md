# App Review Notes — draft for the 2.6.0 update

PREPARED. Nothing has been submitted. The submitted signed build must first be verified to contain these changes.

Island Transport Academy is an update to the existing consolidated transport app, not a new standalone flight, train or math app. It has no login, ads, in-app purchases, subscriptions or gameplay analytics SDK. All game resources are bundled in the native build. No personal details are required.

To see the new observation lesson within three minutes from a fresh install:

1. On the first screen, tap **第一課：停、看、再出發** (First lesson: stop, observe, then depart). Tap **開始這一站** (Start this stop).
2. Road crossing: hold **按住煞車** (Hold brake) for about two seconds until speed is zero. Wait about four seconds for **綠燈 · 路口空了** (Green / crossing clear). Tap **確認出發** (Confirm departure). An early departure produces guidance and cannot complete the stop.
3. Tap **下一站**, then **開始這一站**. At the platform, hold the brake until stopped. Tap **開門接客** (Open doors). Wait about four seconds for boarding; tap **關好車門** (Close doors), then confirm departure. Opening while moving or closing before boarding does not complete the task.
4. Start the runway stop. Tap **等一等** (Wait). After the runway becomes clear, confirm departure. The three-stop observation stamp appears. This is a simplified observation exercise, not operational aviation training.
5. Return to the lobby. The observation stamp remains after restarting. Each completed stop is stored locally; unfinished work restarts at the beginning of that stop. Pause and return buttons are available during play. Backgrounding pauses the exercise.

The existing **星星護照** (Star passport) opens 12 short outings across cars, trains and planes, with up to 36 rating stars and three vehicle badges. The new lesson teaches transport conditions and timing; it contains no arithmetic answer tasks. The related standalone flight/train products overlap with this consolidated app and are not intended for resubmission, according to the owner's work order.

**家長設定** (Parent settings) requires a randomized adult addition challenge. Close/cancel leaves settings inaccessible. Privacy and support are local pages inside that parent area. The app does not open external support sites, ask for a rating, or offer purchases. Optional tilt steering is parent gated and processed locally. Native speech uses an installed local Chinese voice, with text guidance if unavailable. The new observation lesson itself uses text/image guidance for parent-assisted play.

The repository uses standard Three.js, Capacitor and system/local font and speech components. The inherited standalone flight/train physics and textures are disclosed in `SHARED_ASSETS_AUDIT.md`; we do not describe them as entirely new. A distinct opening experience and the transport progression are implemented in this update.

## Evidence to complete before using this draft

- BLOCKED: a new signed iOS/Android build, physical-device lifecycle/offline replay and native screenshots from that build. Included PNGs are real headless browser captures, explicitly not native captures.
- BLOCKED: real parent/child beta feedback, tester permission records where applicable, and documented changes responding to that feedback. Automated checks are not beta testers.
- BLOCKED: account owner confirmation of content-provider identity, asset rights and direct-submission relationship for 4.2.6. No client/partner relationship is inferred by this coding task.
- PREPARED: final App Privacy / Data safety entries must match the final binary. No console declarations were changed here.

# Cognition Lab

A classroom experiment platform for **GitHub Pages + Cloudflare Workers + D1**. The frontend is static HTML/CSS/JavaScript; authentication, class rosters, enrolment, shared results and real multiplayer run on Cloudflare. No paid libraries or frontend build are required.

## Features

- Eight task pages: Navon, Posner cueing, mental rotation, dichotic listening, ASRT, weather prediction, Wisconsin card sorting and two-player prisoner's dilemma.
- Short introductions, instructions, research article links and explicit protocol descriptions.
- Instructor class creation with paste-in expected student codes and a separate secret password per class. First successful student login confirms enrolment; repeated logins don't consume additional places.
- Independent groups: class-specific roster hashes and participant IDs, data authorization, exports and multiplayer pools. The same Neptun code in two classes gets separate participant IDs.
- Individual practice without logging in; practice data never enters class datasets.
- Individual sessions upload trials every five responses, use idempotent inserts and keep a recoverable backup in the browser tab. Instructor exports include partial sessions.
- CSV or JSON download for all experiments or a checked selection, scoped to one selected class. Exports are paginated and formula-like CSV values are escaped.
- True two-classmate play, sealed choices, ten rounds and server-calculated payoffs. Partner polling every two seconds. Leaving ends the room; rooms expire after 30 minutes.

## Local setup

Use **Node 22.14 or newer** (tests use `node:sqlite`). From this folder:

```powershell
npm.cmd install
node scripts/local-setup.mjs
npm.cmd run db:local
npm.cmd run dev
```

Open the local URL printed by Wrangler (usually `http://localhost:8787`). Open **Instructor**, then use `ADMIN_SECRET` from the ignored `worker/.dev.vars` file. On first use, the create-class form is prefilled with **TEST-CLASS**, **TEST1**, **TEST2**, **TEST3**. Choose a class password (at least 12 characters), date and capacity, then click **Create independent class**. No expected student is enrolled until they log in.

To add another group, create another class and paste its codes. To add students later, choose the class and use **Add expected students**. Re-adding an existing code preserves its participant and confirmation. Real Neptun codes and the requested five-character test codes are accepted; codes are case-insensitive, 3–12 alphanumeric characters.

Secrets in `worker/.dev.vars` are **local only** and do not configure production. Do not commit this file or share the instructor secret with students.

## Deploy the Cloudflare backend

1. Authenticate the correct account:

   ```powershell
   npx.cmd wrangler login --device --scopes account:read user:read workers:write d1:write
   npx.cmd wrangler whoami
   ```

   Verify that the email is **alex.ilyes11@gmail.com**. If necessary, log out of the dashboard in your browser and sign into that account before approving the device code. No Cloudflare credentials belong in this repository.

2. Create the shared database:

   ```powershell
   npx.cmd wrangler d1 create experiment-platform
   ```

   This checkout is already bound to the database created in `alex.ilyes11@gmail.com`'s account. For a new installation in a different account, replace `database_id` in `worker/wrangler.jsonc` with the returned database ID. This is a public resource identifier, not a secret. Keep the `DB` binding name.

3. Apply migrations:

   ```powershell
   npm.cmd run db:remote
   ```

4. Set two **different, strong random production secrets** using the interactive prompts:

   ```powershell
   npx.cmd wrangler secret put ADMIN_SECRET --config worker/wrangler.jsonc
   npx.cmd wrangler secret put ROSTER_SECRET --config worker/wrangler.jsonc
   ```

   `ADMIN_SECRET` signs in the instructor. `ROSTER_SECRET` keys the class-specific student-code hashes; **keep it stable** or existing students cannot log in with their codes. Store both in your password manager. Do not put them in GitHub variables, frontend source or a committed file.

5. Deploy:

   ```powershell
   npm.cmd run deploy:api
   ```

   Record the printed `https://experiment-platform-api.<your-subdomain>.workers.dev` origin. Wrangler also deploys the static assets as a working same-origin alternative to GitHub Pages.

## Publish on GitHub Pages

The target repository is [IlyesAlex/experiment-platform](https://github.com/IlyesAlex/experiment-platform).

1. Push the source to `master` (this repository's default), or `main`; both branches are supported by the workflow.
2. In repository **Settings → Secrets and variables → Actions → Variables**, create the **repository variable** `CLOUDFLARE_API_URL` containing the Worker origin above. This is a public URL; do not add an API token.
3. Under **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
4. Run **Actions → Deploy GitHub Pages → Run workflow**, or push to `master`/`main`.
5. Open `https://ilyesalex.github.io/experiment-platform/`.

The workflow checks syntax, runs integration tests, writes the public API URL into the uploaded frontend and deploys only `public/`. It fails explicitly if the URL is missing. Hash routes work at the repository subpath without server rewrite rules.

The Cloudflare CORS origin is `https://ilyesalex.github.io` (an origin has no `/experiment-platform` path). Update `ALLOWED_ORIGIN` if moving to a custom domain.

## First production class

Open **Instructor**, enter your production `ADMIN_SECRET`, and create the prefilled **TEST-CLASS** roster with **TEST1**, **TEST2**, **TEST3**, a new secret class password and a capacity of at least three. Use **Join a class** to test the student login. To test multiplayer, use separate browser profiles/windows for two student codes; session authentication is stored per tab. Every additional class is created with the same short form.

## Data and protocol

All eight experiments share the same D1 schema. Tables: `classes`, `roster`, `sessions`, `runs`, `trials`, `rooms`, `choices`, `rate_limits`. D1 enforces foreign keys and unique run/trial identifiers. Clients never receive database credentials. Every student run is authorized against both participant and class. Instructor access spans all classes, with explicit class selection for exports.

CSV rows include class ID, participant ID, run ID, experiment, protocol, timestamps, metadata, trial index, stimulus fields, response, correctness and reaction time. Different tasks have additional columns; unused columns are empty. Raw Neptun codes and passwords are never exported. Pending expected-student status is visible in the instructor workspace using pseudonymous participant IDs; retain your original roster separately if a name/code mapping is needed.

Browser measurements are classroom demonstrations, not validated clinical or research instruments. Mental rotation uses 2D polygons, dichotic listening uses stereo tones rather than recorded speech, weather prediction uses documented log-odds probabilities, and card sorting uses a six-correct switch criterion. The original papers are conceptual references, not claims of exact replication. Each task page specifies its adaptation and trial count. ASRT exports pattern, high/low triplet, repetition/trill and block fields. Some rapid or hidden-tab responses should be excluded before analysis.

Scores and RTs are submitted by the browser and are not tamper-proof. A shared class password plus Neptun code does not verify university identity. Production use with real student data needs an appropriate institutional collection/retention policy, consent wording, backup process and access controls.

## Validation

```powershell
npm.cmd run check
npm.cmd test
```

Integration tests execute the actual Worker handlers against the migration schema in SQLite. They cover password hashing, stimulus balance, enrollment/capacity, identical codes across independent groups, forbidden cross-class uploads, export authorization/filtering, idempotent retries, roster additions, class-only multiplayer pairing, sealed choices, completed ten-round saves, CORS and login throttling.

Browser QA should additionally check stereo headphone routing, keyboard and touch input, a complete practice run, offline retry, instructor class creation/export and two real student sessions. Initial setup requires your Cloudflare authorization and GitHub Pages settings; installing the source alone does not publish it.

## References for deployment

- [Cloudflare D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)
- [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Cloudflare login commands](https://developers.cloudflare.com/workers/wrangler/commands/general/#login)
- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

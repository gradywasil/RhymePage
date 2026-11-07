# Firebase cost controls, 2026-10-26

The owner wants RhymePage to remain free or as close to free as practical while it grows. The goal is low usage and early cost controls, not a promise of a zero-dollar bill on the Blaze plan.

The Cloud Functions API is now enabled. A read-only CLI listing succeeded and returned no deployed functions. Billing is enabled on the existing project. No functions, rules, budgets, spend caps, or artifact policies were deployed or changed remotely in this pass.

## Prepared function configuration

`functions/index.mjs` now sets zero minimum instances and one maximum instance per function. The two deletion callables use one request per instance and the documented `cpu: 'gcf_gen1'` fractional CPU profile, with 256 MiB for note deletion and 512 MiB for account deletion. The Auth cleanup trigger also has zero minimum and one maximum instance; its retry policy remains enabled.

These operations can tolerate a cold start and are normally infrequent. This profile trades burst capacity and possibly latency for lower resource use. Under load, requests can queue and eventually return 429; instance settings are not monetary caps. These limits are adjustable after measured demand. No always-warm capacity is requested. [Runtime and scaling options](https://firebase.google.com/docs/functions/manage-functions).

The SDK's generated function endpoints were inspected to verify the options. All 16 isolated Firebase emulator integration checks passed after the change. Emulator host CPU/memory are not enforcement or performance evidence for the deployed limits. The tests ran using host Node 24 while the deployment runtime remains Node 22.

This backend-only configuration change does not require rebuilding the AAB. The existing release-build record retains the backend source hash from its build time.

## Sources of cost

- Functions have no-cost usage allowances, but Cloud Build and Artifact Registry are separate deployment services. Container images can incur storage charges. Configure a one-day artifact cleanup policy after the first deployment. [Functions pricing](https://firebase.google.com/docs/functions/faq-and-troubleshooting), [artifact cleanup](https://firebase.google.com/docs/functions/manage-functions#clean_up_deployment_artifacts).
- Standard Firestore includes 50,000 document reads, 20,000 writes and 20,000 deletes per day, plus storage/network allowances. Queries, transactions, rule-dependent document reads, and repeated saves all contribute. The app's two-second autosave is debounced, but sustained editing still creates writes. [Firestore pricing](https://firebase.google.com/docs/firestore/pricing).
- TTL deletes do not have a free allowance. The account-deletion security marker uses TTL for bounded retention, so those cleanups can produce small usage charges even when ordinary notebook operations fit the free quota. Preserve this privacy/security behavior. [Firestore quotas and billable features](https://firebase.google.com/docs/firestore/quotas).
- Attached audio is stored and downloaded from Cloud Storage. The `firebasestorage.app` bucket's no-cost eligibility depends on its region; the live bucket region was not verified in this pass. Do not promise a specific free audio capacity. The existing 200 MiB per-file limit is preserved; per-account totals and download controls need attention before broad release. [Firebase pricing](https://firebase.google.com/pricing).
- The standard Android app excludes the speech model and performs manual sync locally. Word lookups go directly to the existing word services. No hosted AI inference or paid language-model service is introduced.

Before broader scaling, measure audio storage/egress, add per-account audio quotas, paginate notebook reads, and review autosave write frequency. Enforce App Check only after its client and Play signing setup are working; turning enforcement on now would break unconfigured clients. Do not replace missing authorization with public read/write rules to save complexity.

## Console guardrails before deployment

1. Create a low overall project **alerts-only** budget, for example 1 unit of the billing currency per month, with threshold emails. This is an early warning, not a spending authorization or shutdown mechanism.
2. In Firebase **Settings > Usage and billing > Details & settings**, look for **Service-level spend caps**. If available, configure a low cap for Cloud Functions / the underlying Cloud Run functions service. The owner chooses the amount in the Console. No amount was configured by this work.
3. Spend caps are a Preview feature, service-specific, and delayed by usage reporting. They can pause new use after the threshold is reached, but are not guaranteed hard limits. They do not cap Firestore, Storage, Hosting, build artifacts, or every other project service. Their calculations use gross costs without savings/credits. [Spend-cap details and limitations](https://firebase.google.com/docs/projects/billing/spend-caps), [budget alerts](https://firebase.google.com/docs/projects/billing/budget-alerts).
4. After deployment, retain one day of old function build artifacts with the CLI cleanup policy. This does not delete users' uploaded audio:

```powershell
npx -y firebase-tools@latest functions:artifacts:setpolicy --days 1 --location us-central1 --project rhymepage-6b98b
```

A strict guarantee of no charges is not established by these settings. During internal testing, monitor actual billing and service usage, preserve deletion access, and adjust limits based on evidence.

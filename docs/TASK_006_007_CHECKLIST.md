# TASK-006/007 — Provjere i obaveze

Odobreno 2026-10-09. Postojeći PRD/DATABASE autoritet; nema novog grading izbora ni clouda/naplate/commita.

- [x] Reading order i live inspect.
- [x] Domain modeli/validacija; jedan context i canonical activity/attempt.
- [x] Repository transakcije, Rules, parenti, revision/lock/idempotency.
- [x] Provjere/pokušaji, projekti/povezani taskovi, jedna To-do i diplomski.
- [x] Failure/conflict/offline/archive UX i RAM draft.
- [x] Unit/Rules/SDK/E2E/static/build i vizualni pregled.
- [x] Dokumentacija/current state/roadmap/izvještaj; STOP prije TASK-008.

Additive lokalna schema v1: assessments/projects/tasks/thesis/scoreActivities/scoreAttempts već su predviđeni registryjem. Nema promjene postojećih dokumenata ni primijenjene cloud migracije. Production ostaje deny-all. Backup/impact review prije stvarne objave. Ocjene su nullable plain string; decimalni bodovi do 4 mjesta/100.000. Izračun i izbor pokušaja ostaju TASK-009/009C.

Dokazi: unit 24/24, Rules 13/13, SDK 18/18, Playwright 39 passed / 1 namjerni mobile keyboard skip; lint/typecheck/format/build PASS (bundle warning otvoren). Sintetičke desktop/mobile snimke pregledane; real OAuth/device/cloud NOT RUN. Nema novih dependencies. STOP prije TASK-008.

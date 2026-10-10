# TASK-001 — Foundation checklist

Datum: 2026-10-07. Korisnik je odobrio foundation i traži izvještaj prije dogovora o idućoj fazi. Scope ovog koraka je TASK-001, bez TASK-002 auth/persistence ili cloud aktivacije.

- [x] Inspect aktualne upute, dokumentaciju, Git stanje i runtime.
- [x] Odabrati/pinati kompatibilne Angular/Node/TypeScript i tooling verzije.
- [x] Inicijalizirati aplikaciju u postojećem workspaceu, očuvati postojeći README/docs/.git.
- [x] Standalone responsive shell, hrvatski UI, tokeni i routing bez fiktivnih studentskih podataka.
- [x] PWA manifest/static assets baseline bez private/offline data cachea.
- [x] Formatter, lint, type/template provjera, Vitest i browser smoke testovi.
- [x] Provjeriti production build i desktop/mobile prikaz, zapisati stvarne dokaze.
- [x] Ažurirati README, AGENTS, tooling dokumente, roadmap i CURRENT_STATE.
- [x] STOP nakon foundationa; predložiti TASK-002 kao sljedeću fazu.

Granice: nema Google prijave/Firestore podataka, domenskog CRUD-a, commita/pusha/deploya ni billing activationa. Emulator/Rules scriptovi dodaju se s TASK-002, bez placeholder naredbi koje lažno prolaze.

Rezultati 2026-10-08: build/typecheck/lint/format PASS; Vitest 4/4; Playwright 9 passed + 1 desktop-only skip u mobile projektu; audit 0 vulnerabilities. Detalji i granice u [CURRENT_STATE](CURRENT_STATE.md).

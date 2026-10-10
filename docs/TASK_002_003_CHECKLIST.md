# TASK-002/003 — Pristup, semestri i kolegiji

Odobreno 2026-10-08. Scope: lokalni emulator/Auth/Rules, root/dataset/revision, semestri i kolegiji. Nema cloud kreiranja, deploya, naplate ili commita/pusha. TASK-004/005 naknadno odobreni 2026-10-09.

- [x] Pročitati ugovore i pregledati live stanje; razlikovati emulator i pravi OAuth.
- [x] Pinati Firebase SDK/CLI/Rules tooling i verificirati Java/emulatore.
- [x] Implementirati odvojenu dev/production konfiguraciju, login/logout/guard i account cleanup.
- [x] Implementirati root/dataset init, server reads, revision transactions, conflict/restore/offline zaštitu.
- [x] Rules: approved/other/anonymous, zatvorena polja/tipovi/reference; deny svih budućih kolekcija.
- [x] Semestri: validirani datumi, aktivni kontekst, arhiva i eksplicitni edit.
- [x] Kolegiji: semestar, naziv, informacije, sigurni linkovi, arhiva; bez izmišljenih pravila.
- [x] Unit/Rules/integration/browser provjere, lint/type/format/build/audit i vizualni pregled.
- [x] Ažurirati ugovore, CURRENT_STATE i roadmap uz točne granice dokaza; izvještaj.

Izvedbeni izbori: local mock Google credential samo uz loopback/demo konfiguraciju; produkcija zatvorena dok nema stvarne konfiguracije. Restore upis/pointer switch nije implementiran prije ADR-004/TASK-010; postojeći restore lock odbija normalne mutacije. Nema hard delete parenta niti seeda akademskih podataka u aplikaciji.


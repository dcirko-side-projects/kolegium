# TASK-004/005 — Raspored i dolaznost

Odobreno 2026-10-09. Lokalna implementacija po PRD/attendance spec; bez cloud objave, pravih TVZ fixtures, commita/pusha ili offline queue.

- [x] Pročitati relevantne ugovore; odvojiti stvarne podatke od sintetičkih testova.
- [x] Zatvoriti preostali TASK-002/003 smoke/report i označiti dokaze.
- [x] Pure datumi/Europe-Zagreb, recurring generiranje i spajanje recorded snapshotova, odvojeni counts.
- [x] Data/Rules: templates, sessions, parent/date/time/enums, root/revision/lock, idempotent marking.
- [x] Buduća promjena kroz datum primjene i preview, bez mijenjanja recorded povijesti; otkazivanje/nadoknada/korekcija.
- [x] Raspored dan/tjedan, Početna današnja nastava, brzi unos, pregled dolaznosti i nullable uvjeti.
- [x] Unit/Rules/SDK/browser/failure tests, lint/type/format/build, vizualni pregled.
- [x] Dokumentacija/FR-TC/current state/roadmap i završni izvještaj.

Izvedba koristi virtualne unmarked termine dok nema korisničke radnje. Budući edit skraćuje prethodni predložak i kreira novu verziju u jednoj transakciji; recorded snapshotovi ostaju, a recorded budući termini unutar pogođenog razdoblja blokiraju promjenu umjesto tihog regeneriranja. Migracija je additive schema v1 samo lokalno: postojeći semesters/courses ostaju; produkcija nema podatke/deploy. Backup prije real Rules/schema objave ostaje obvezan.


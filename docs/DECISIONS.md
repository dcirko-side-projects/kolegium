# ADR index

Datum: 2026-10-07

| ADR | Odluka | Status |
|---|---|---|
| [ADR-001](decisions/ADR-001-platform.md) | Responsive web i PWA | Accepted |
| [ADR-002](decisions/ADR-002-stack.md) | Angular/TypeScript i Firebase Auth/Firestore/Hosting | Accepted |
| [ADR-003](decisions/ADR-003-access.md) | Google prijava i pristup odobrenom UID-u | Accepted |
| [ADR-004](decisions/ADR-004-safe-restore.md) | Staging kopija i atomarna aktivacija backupa | Accepted — korisnik 2026-10-10; lokalna implementacija TASK-010 |

ADR-001–003 potvrđeni razgovorom s korisnikom. Accepted ne znači implementirano ili aktivirano. ADR-004 nije zasebno potvrđen; implementirati nakon acceptancea bootstrapa ili razrješenja tog dijela.

Budžet: do 5 EUR mjesečno ukupno; početni cilj je 0 EUR kroz Spark. Plaćene usluge nisu aktivirane.

Nove ADR zapise izraditi za arhitekturno značajne, teško reverzibilne ili sigurnosno osjetljive odluke. Konkretne informacije kolegija prvo su domain zahtjevi; nisu automatski ADR.

## Cloud lokacija — potvrda 2026-10-10

Korisnik prihvatio regionalni Firestore `europe-west3` (Frankfurt) za `(default)` Standard edition bazu projekta `kolegium-c8970`. Odabir potvrđen prije kreiranja baze, za osobnu aplikaciju iz Hrvatske uz početni Spark plan. Lokacija postojeće instance nije promjenjiva; druga lokacija tražila bi novu bazu/projekt i plan migracije. Potvrda nije dokaz da je baza kreirana niti odobrenje naplate ili objave. [Firestore lokacije](https://firebase.google.com/docs/firestore/locations).


## Nastavak 2026-10-10

Korisnik odobrio nastavak TASK-010 i TASK-011/012 nakon TASK-008/009, uz preostali radni kapacitet. ADR-004 izričito prihvaćen 2026-10-10. TASK-009C čeka stvarne izvore. Odobrenje implementacije ne aktivira naplatu, ne objavljuje aplikaciju i ne dopušta commit/push; cloud koraci zahtijevaju konkretan projekt/UID i zasebno odobrenje objave.

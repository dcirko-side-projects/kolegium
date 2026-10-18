# Rate fakulteta — 2026-10-11

Korisnik je dostavio sliku s četiri rate po 645 EUR (1290 EUR po semestru, ukupno 2580 EUR) i izričito zatražio unos. Potvrdio je da je prva rata plaćena. Izvor navodi:

| Rata | Rok iz izvora | Status / provedba |
|---|---|---|
| 1. | 5.10.2026., korisnik naknadno potvrdio | 645 EUR, plaćena; dodana i readback potvrđena |
| 2. | 10.1.2027. | 645 EUR, neplaćena; dodana i readback potvrđena |
| 3. | 28.2.2027., korisnik prihvatio prijedlog | 645 EUR, neplaćena; dodana i readback potvrđena |
| 4. | 10.5.2027. | 645 EUR, neplaćena; dodana i readback potvrđena |

Administrativni unos koristi postojeći CLI račun i postojeći schema v1 installments ugovor. Prije upisa validiran je cijeli backup graf; backup je spremljen u ignored artifacts/installments/before-*.json. Dva create-only zapisa i root dataRevision+1 upisani su atomarno uz root updateTime precondition, provjeru aktivnog dataseta i restore locka. Readback usporedio payload, revision i server timestamp. Sanitized rezultat je ignored artifacts/installments/result-*.json; privremeni script .angular/tmp/cloud-installments-import.mjs nije runtime API. Nema promjene Rules, schema, dependencies ili rasporeda. Administrative dokaz ne potvrđuje browser OAuth/cross-device.

Nakon odgovora korisnika „može, prva je bila do 5.10” preostale dvije rate dodane su u drugom atomarnom create-only upisu uz zaseban backup/preconditions/readback. Ukupno četiri rate po 645 EUR, od toga plaćeno 645 EUR, neplaćeno 1935 EUR. Postojeća druga/četvrta nisu prepisane. Ponovljeni plan za sve četiri preskače postojeće zapise; ne koristiti script za edit nakon osobnog plaćanja, već normalni UI.

Korisnik želi podsjetnike u aplikaciji i na mobitelu, prihvaćen interval 30 i 7 dana. Lokalno implementirana zasebna sekcija Početne: neplaćene rate u prozoru 0–30 kalendarskih dana; zadnjih 7 dana označeno zasebnom porukom, rok danas također. Paid/past rate izostavljene; overdue ostaje u redovnim obavezama. Podsjetnik ostaje vidljiv cijeli prozor, ne samo na točan 30./7. dan. Query za rate proširen na 30 dana, ostale obaveze zadržavaju 14 dana; paging/root double-read/online refresh sačuvani. Schema/Rules/dependencies nepromijenjeni. Novi UI nije objavljen.

Za mobilni push korisnik odabrao „Pripremi prijedlog push sustava bez aktivacije naplate”. PUSH_REMINDERS_PROPOSAL.md je Proposed i sadrži arhitekturu, workload/troškovne pretpostavke i gates. Push nije implementiran/zakazan; Spark i deploy ostaju nepromijenjeni.

Nema novog deploya, commita, pusha, naplate ili brisanja. Cloud rate su stvarni administrative read/write dokaz; local UI provjere nisu browser OAuth/device/cross-device dokaz.

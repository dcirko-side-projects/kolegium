# ADR-004 — Izolirana kopija i atomarna aktivacija pri povratu

**Status:** Accepted  
**Date:** 2026-10-07  
**Decision owner:** Korisnik — izričito prihvaćen ADR-004 i implementacija 2026-10-10

## Context

FR-017 zahtijeva backup/povrat svih semestara i pokušaja bez djelomične zamjene. Višegodišnja evidencija može premašiti praktične transaction/batch i Rules lookup limite. Vlastiti server nije dio potvrđenog stacka.

## Decision

Prihvaćene su Firestore dataset generacije pod odobrenim UID-em: active pointer, izolirani staging import uz lock, validacija/readback i atomarni pointer switch. Stara kopija retained za recovery; export uključuje samo domain payload. TASK-010 implementira pojedinačne server-confirmed upise; staging se zamrzava u stanje verifying prije readbacka, da kasni upis ne može promijeniti već provjerenu kopiju.

## Why

- Neuspjeli chunk ne mijenja aktivnu evidenciju.
- Radi s odabranim Firebase pristupom bez plaćenih server funkcija.
- Restore višegodišnje kopije ne ovisi o jednom golemom batchu.

## Alternatives Considered

### Jedan atomic batch koji zamjenjuje sve

Jednostavniji model, ali neprimjeren neograničenoj evidenciji i lookup limitima. Odbijati legitimne backupe zbog broja dokumenata nije dovoljan recovery plan.

### Brisanje aktivnih podataka pa chunk import

Jednostavan upis, ali prekid ostavlja nepotpunu evidenciju; ne zadovoljava FR-017.

### Serverski restore job

Pouzdan centralni proces, ali dodatni server/runtime i naplata. Nema potvrđenog zahtjeva koji opravdava taj opseg zasad.

## Consequences

- Dodatni control/dataset dokumenti i Rules tokovi; strogo ograničeni na recovery, ne general version history.
- Više storage/read operacija; active+previous, staging samo tijekom restorea, sigurni cleanup.
- Application mora validirati cijeli graf; Rules ne dokazuju cijelu staging kopiju.
- Implementacija ovog mehanizma traži emulator interruption/concurrency dokaz prije stvarnog povrata.
- Promjenu prihvaćene odluke uskladiti s DATABASE/SECURITY/TESTING/roadmap prije pogođene implementacije.

### Follow-up Work

- [x] Korisnik prihvatio prijedlog i implementaciju 2026-10-10.
- [x] Implementirati i lokalno testirati prekid nakon locka, uploada, zamrzavanja, readbacka i prije commita te izgubljeni završni odgovor. Cloud/device smoke ostaje TASK-012.

## Supersedes

None.

## Superseded By

None.

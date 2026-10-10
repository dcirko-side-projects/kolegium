# ADR-003 — Google prijava i pristup jednom odobrenom korisniku

**Status:** Accepted  
**Date:** 2026-10-07  
**Decision owner:** Korisnik

## Context

Projekt je osobna/private aplikacija dostupna preko interneta. Potreban je jednostavan pristup na vlastitim uređajima uz privatnost podataka.

## Decision

Google prijava kroz Firebase Authentication. Podacima smije pristupiti samo unaprijed odobren korisnički UID. Prijava se zadržava na vlastitim uređajima u granicama session ponašanja providera. Nema javnog registration toka ni prava pristupa za druge Google račune.

## Why

- Jednostavna prijava bez vlastitog sustava lozinki.
- Izričito odvaja potvrdu identiteta od prava pristupa podacima.
- Odgovara trenutačnom opsegu za jednog korisnika.

## Alternatives Considered

### E-mail i lozinka

Ne ovisi o Google računu, ali uvodi upravljanje lozinkom i dodatne tokove oporavka. Korisnik je prihvatio Google prijavu.

### Javna registracija ili pristup svim prijavljenim korisnicima

Ne odgovara potvrđenom privatnom scopeu i nije odabrano.

## Consequences

- Firestore Security Rules moraju provoditi odobreni UID i validaciju web zahtjeva; UI guard nije dovoljan.
- Neodobreni račun ne smije čitati ili mijenjati podatke čak i ako je uspješno autentificiran.
- Stvarni UID određuje se u pripremi okruženja; nije potreban za discovery.
- Google OAuth/PWA ponašanje i zadržavanje prijave treba provjeriti na svim platformama.

### Follow-up Work

- [ ] Definirati postupak postavljanja odobrenog UID-a i zamjene računa.
- [ ] Testirati neprijavljenog, odobrenog i neodobrenog korisnika.
- [ ] Definirati logout i UX isteka prijave.

## Supersedes

None.

## Superseded By

None.

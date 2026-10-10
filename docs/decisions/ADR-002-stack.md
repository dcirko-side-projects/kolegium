# ADR-002 — Angular i Firebase

**Status:** Accepted  
**Date:** 2026-10-07  
**Decision owner:** Korisnik

## Context

Aplikacija ima više povezanih sekcija, forme i online pohranu za jednog korisnika. Jednostavno održavanje važnije je od infrastrukturnog opsega. Preferira se besplatno korištenje; ukupni prihvatljivi mjesečni trošak je do 5 EUR.

## Decision

- Frontend: Angular i TypeScript.
- Prijava: Firebase Authentication.
- Pohrana: Cloud Firestore.
- Web hosting: Firebase Hosting.
- Početni plan: Spark; plaćeni plan razmatra se samo uz konkretan razlog i prethodno dogovorene troškove.

Odluka ne inicijalizira aplikaciju, ne aktivira cloud usluge i ne uključuje naplatu. Konkretne verzije i dodatne biblioteke tek će biti određene.

## Why

- Angular pruža standardizirane obrasce za routing, forme i organizaciju logike.
- Firebase pokriva osnovne infrastrukturne potrebe bez održavanja vlastitog servera.
- Trenutačni opseg očekivano stane u besplatne kvote, što treba verificirati u implementaciji i korištenju.

## Alternatives Considered

### React, TypeScript, Vite i Firebase

Fleksibilan UI s istom infrastrukturom, uz više zasebnih odluka o bibliotekama i obrascima. Prednost je dana Angularovoj standardizaciji.

### Angular i Supabase/PostgreSQL sa zasebnim hostingom sučelja

Relacijska baza odgovara vezama među podacima, ali besplatni projekti mogu biti pauzirani zbog niske aktivnosti. Pro počinje od 25 USD mjesečno prema cjeniku provjerenom 2026-10-07, iznad dogovorenog budžeta.

## Consequences

- Firestore nema relacijske strane ključeve; veze, brisanje i validacija moraju biti izričito definirani.
- Postoji vezanost uz Firebase; granice pristupa podacima treba držati preglednima.
- Besplatne kvote nisu jamstvo trajne dostupnosti ili budućih cijena.
- Export/backup i povrat podataka ostaju zasebna otvorena odluka.
- Vlastiti backend nije trenutačno planiran; konačna arhitektura mora provjeriti može li zadovoljiti sva pravila bez njega.

### Follow-up Work

- [ ] Definirati domain model, podatkovne veze i Security Rules.
- [ ] Definirati backup/povrat i praćenje kvota.
- [ ] Definirati deployment i testiranje prije implementacije.

## Sources

- https://angular.dev/overview
- https://firebase.google.com/pricing
- https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
- https://supabase.com/pricing
- https://supabase.com/docs/guides/platform/free-project-pausing

## Supersedes

None.

## Superseded By

None.

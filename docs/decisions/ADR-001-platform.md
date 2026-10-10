# ADR-001 — Responsive web i PWA

**Status:** Accepted  
**Date:** 2026-10-07  
**Decision owner:** Korisnik

## Context

Osobna aplikacija treba kvalitetan mobile UX na Androidu i iPhoneu te desktop pregled na Windowsu. Podaci moraju biti zajednički i dostupni neovisno o uključenom laptopu. Online rad dovoljan je za MVP.

## Decision

Jedna responsive web aplikacija s PWA instalacijom na podržanim uređajima. MVP koristi internet za pregled i unos podataka. Offline unos i naknadna sinkronizacija nisu dio MVP-a.

## Why

- Jedan proizvod i zajednički UI za sve potvrđene platforme.
- Brz pristup ikonom na početnom ekranu uz dostupnost web poveznicom.
- Nema trenutačnog zahtjeva koji traži zasebnu native aplikaciju.

## Alternatives Considered

### Responsive web bez PWA

Jednostavan pristup poveznicom, ali slabiji praktičan pristup ikonom i samostalnim prozorom. Korisnik je odabrao PWA.

### Web i zasebna mobilna aplikacija

Veće mogućnosti integracije s uređajem, uz dodatne buildove, distribuciju i testiranje. Trenutačni MVP ne opravdava taj opseg.

## Consequences

- Instalacija i ponašanje razlikuju se po platformi i pregledniku.
- Potrebno je provjeriti browser i instalirani PWA prikaz na Androidu, iPhoneu i Windowsu.
- PWA cache ne smije biti tretiran kao odobrenje za offline spremanje ili prikaz zastarjelih podataka kao aktualnih.

### Follow-up Work

- [ ] Definirati podržane preglednike, update i cache ponašanje.
- [ ] Definirati UX bez mreže i pri neuspjelom spremanju.

## Supersedes

None.

## Superseded By

None.

# Feature Specification — Bodovi i ocjene

**Feature ID:** GRADING  
**Status:** Generički model/izračun/UX implementirani TASK-006–009; stvarna pravila TASK-009C čekaju izvore  
**Owner:** Vlasnik aplikacije  
**Last updated:** 2026-10-09

## 1. Goal

Sačuvati pojedinačne rezultate/sve pokušaje, zbrojiti bodove bez duplikata i računati ocjenu prema pravilima kolegija.

## 2. User Value

Pregled kolegija okuplja rezultate vježbi/predavanja/provjera/projekata i uvjete prolaza.

## 3. Scope

In Scope: unos, povijest, zbroj i uvjetni grade. Out of Scope: AI parser, executable formula engine, automatska best/latest policy bez pravila.

## 4. Requirements

FR-008/009/014/015 / MUST. GRADING-R1: jedan rezultat broji se jednom; GRADING-R2: missing rules/result nije grade/fail/zero; GRADING-R3: official i calculated odvojeni.

## 5. User Flow

FL-004/005. Unesi rezultat, vidi isti u izvoru/kolegiju. Missing rules ili attempt ambiguity imaju poruku nepotpunosti; ne birati pokušaj automatski.

## 6. UI / Screens

SCR-003/006/007, ResultSummary, svi pokušaji i optional bodovi/ocjena. Nova glavna grades sekcija nije potvrđena.

## 7. API Changes

None — DATABASE OP-002/007, SDK ugovori.

## 8. Database Changes

scoreActivities/scoreAttempts/gradingRules/courseOutcomes. ScoreActivities/scoreAttempts za provjere/projekte lokalno implementirani additive schema v1, bez cloud migracije. Decimalni unos do 4 mjesta / 100.000; mapping, pravila i rounding za obračun verificirati iz izvora prije TASK-009C.

## 9. Authorization

Approved UID, revision i lock; Rules types/refs. Domain calc nije credential boundary.

## 10. Validation & Edge Cases

Null/0, decimals, max/min, exact grade boundary, current/final, project include unknown, multi-attempt bez izbora i official/calculated mismatch. Skala/rounding nisu poznati.

## 11. Security Considerations

Bez executable formula iz dokumenta, raw HTML ili direct derived aggregate writea. Izvorna pravila pregledati prije konfiguracije.

## 12. Testing

TC-008/009/014/015/016. Synthetic calc tests nisu stvarno TVZ bodovanje; zasebni stvarni regression nakon izvora.

## 13. Implementation Plan

TASK-006/007/009: persistence/history pa pure calc i missing-config UX. TASK-009C za stvarna pravila. FR-015 nije potpuno verified prije izvora.

## 14. Acceptance Criteria

- [x] Unos jednom, isti canonical rezultat u provjeri/projektu/kolegiju (lokalni SDK/E2E dokaz).
- [x] Pokušaji sačuvani; izračun koristi eksplicitni izbor jednog pokušaja aktivnosti bez automatike.
- [x] Nepoznato nije nula; nema calculated grade bez pravila. Ručno unesena ocjena ostaje samostalni podatak pokušaja.
- [x] Exact decimal zbroj, inclusive/exclusive intervali, null/zero i duplicate/foreign izbor imaju sintetičke testove.
- [ ] Stvarni rules verificirani prije tvrdnje o stvarnom obračunu.

## 15. Documentation Updates

PRD/DATABASE/TESTING i izvor pravila, spec prema contract promjeni, CURRENT_STATE za dokaze. Unresolved policy nije dozvola za automatiku.

TASK-009: lecture/exercise canonical activity, editable metadata, structured komponente/intervali, source-confirmed config, explicit counted selection i official outcome. Supported rounding=none; null/drugo incomplete. Potvrda source popisa svih bodovanih aktivnosti je korisnička odgovornost prije calculated grade; to nije TVZ proof. Generic lokalni dokazi u CURRENT_STATE.

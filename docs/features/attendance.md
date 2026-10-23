# Feature Specification — Dolaznost

20.10.2026. — odobren excused: zaseban broj/badge Ispričani izostanak i opcionalna napomena max500, ne povećava present niti mijenja official total/minimum. Poništi/Prisutan/Odsutan/Otkazano uklanjaju napomenu, nadoknada je novi neoznačeni termin bez kopirane ispričnice. Uređivanje čuva original revision dok server refresh može pokazati novu oznaku, pa stale save daje konflikt. ScheduleStore sada pri offline zadržava zadnje učitane retke umjesto uništavanja otvorene note forme; auth/scope reset i dalje čiste retke. Rules i backup roundtrip opcionalnog polja pokriveni lokalnim testovima. Napomena nije u ICS izvozu.

20.10.2026. — Odabir kolegija u Dolaznosti sada se primjenjuje gumbom Pretraži; izbor u selectu ne prebacuje evidenciju. Raspored ima Dan/Tjedan/Mjesec i otvaranje dnevne SessionRow evidencije iz mreže. Za arhivsku korekciju postoji reverzibilni Uredi arhivu/Zaključaj arhivu toggle. Nastavne jedinice, prisutan/odsutan/neoznačen, canceled snapshot, minima i revision ugovori nisu mijenjani. Sandbox browser provjera pokriva selekciju prije/poslije Pretraži; puni rezultati u CURRENT_STATE.

**Feature ID:** ATTENDANCE  
**Status:** Implemented locally — TASK-004/005; real OAuth/device/cloud NOT RUN  
**Owner:** Vlasnik aplikacije  
**Last updated:** 2026-10-09

## 1. Goal

Brzo i pouzdano evidentirati dolaske po kolegiju, odvojeno za predavanja/vježbe.

## 2. User Value

Korisnik zaboravlja zapisati dolaznost; iz današnjeg termina odmah označuje prisutnost i vidi koliko dolazaka treba.

## 3. Scope

In Scope: prisutan/odsutan/neoznačen, otkazivanje, nadoknada, ispravak, official total/minimum i povijest. Out of Scope: geolocation, automatsko prepoznavanje dolaska, notifikacije i offline queue.

## 4. Requirements

FR-004–FR-007, FR-016, FR-018 / MUST. ATTENDANCE-R1: jedna session evidencija; ATTENDANCE-R2: canceled/unmarked pravila; ATTENDANCE-R3: stale revision konflikt. PRD je domain autoritet.

## 5. User Flow

FL-001/002 iz APP_FLOW. Success nakon server commit-a; failure čuva unos. Canceled term nema attendance akcije prije promjene stanja.

## 6. UI / Screens

SCR-002/003/004/005, SessionRow i SaveFeedback. Loading/empty/error/success/disabled/conflict. Mobile najviše dvije radnje za unos nakon otvaranja Početne.

## 7. API Changes

None — nema HTTP API-ja. DATABASE OP-003/004.

## 8. Database Changes

scheduleTemplates, sessions.attendance, courses.attendanceRules; revision/root transaction. Additive lokalna schema v1; production nema migracije. Virtual unmarked session materializira se pri korisničkoj radnji.

## 9. Authorization

Approved UID, active dataset bez restore lock-a. Rules, ne samo UI guard; arhiva ima izričito uređivanje.

## 10. Validation & Edge Cases

Duplicate klik/lost response, cancelled s evidencijom, budući edit, missing total/min, historical correction i DST. Jedinicu nastave provjeriti prema stvarnim pravilima.

## 11. Security Considerations

Closed enum, valid refs/date/time, revision i UID. Lokalna network provjera nije authorization.

## 12. Testing

TC-004–007, TC-016/018: pure count, emulator concurrency/Rules, E2E i stvarni mobile smoke.

## 13. Implementation Plan

TASK-004/005 nakon foundationa/semestara: helpers → ugovor → UI → failure/concurrency tests → docs/state.

## 14. Acceptance Criteria

- [x] Predavanja/vježbe imaju odvojene countove.
- [x] Retry ne duplicira dolazak; drugi lokalni SDK/browser klijent vidi server commit. Real cross-device cloud NOT RUN.
- [x] Canceled/unmarked nije absent.
- [x] Povijest ostaje nakon buduće promjene.
- [x] Device/runtime dokaz ili njegova granica točno prijavljeni.

## 15. Documentation Updates

PRD/APP_FLOW/DATABASE/TESTING prema promjeni, roadmap/CURRENT_STATE nakon rada. Bez neizvedenih PASS tvrdnji.


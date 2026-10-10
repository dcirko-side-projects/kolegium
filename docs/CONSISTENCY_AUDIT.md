# Consistency Audit

Datum: 2026-10-07. PHASE 7, nakon documentation baselinea i prije implementation roadmapa; finalna provjera poveznica/traceability ponavlja se nakon roadmapa.

## 1. Validated

| Par | Nalaz |
|---|---|
| PRD ↔ APP_FLOW | FR-001–018 imaju journeys/screenove; jedna To-do, osnovni diplomski i rate; nema skrivenih MVP integracija |
| TRD ↔ ARCHITECTURE | Angular PWA, Firebase Auth/Firestore/Hosting, jedan UID, online-only, 0 EUR cilj/do 5 EUR granica |
| ARCHITECTURE ↔ DATABASE | Pure domain/data separation, snapshot nastave, canonical scoreAttempt, revision transactions i active dataset pointer |
| ARCHITECTURE ↔ SECURITY | Firebase serverska granica; UI guards nisu authorization; default deny i odobreni UID |
| APP_FLOW ↔ data operations | FL-001–009 koriste OP-001–009; nema ad hoc HTTP endpointa |
| DATABASE ↔ SECURITY | Approved UID, closed schema, parent refs, lock/revision, staging/active rules i init bootstrap |
| DESIGN_SYSTEM ↔ APP_FLOW | Mobile bottom nav/desktop sidebar, sve sekcije, SessionRow i state feedback; isti podaci |
| PRD ↔ TESTING | 18 unique FR IDs, TC-001–018 pokrivaju svaki FR; stvarni rules/device/OAuth odvojeni od sintetičkih dokaza |
| AGENTS ↔ dokumentacija | Scope/priority/authority/workflow, update matrix i STOP gate; Proposed ADR nije predstavljena potvrđena odluka |

## 2. Conflicts Found i popravci

- Raniji discovery tretirao ocjene kao buduću ideju/ručni konačni zbroj. Najnovija korisnikova uputa potvrđuje MUST automatski zbroj/ocjenu. PRD/DATABASE/features/TESTING usklađeni; DISCOVERY je povijesni ledger, ne paralelni autoritet.
- Auto zbroj i čuvanje svih pokušaja mogu dvostruko pribrojiti bodove. Canonical rezultat i eksplicitna obračunska konfiguracija, bez best/latest pretpostavke; unresolved izbor vidljiv. Stvarni obračun ne označava se complete.
- Jedna velika replace operacija ne pokriva rast backupa; chunk replacement bi ostavio mixed podatke. Predložen staging dataset/lock/atomic pointer mehanizam ADR-004. Status Proposed izričito naveden i gate u roadmapu.
- Entity refs/root revision bez first-run inicijalizacije ostavili bi neuporabljiv prazan projekt. Dodan OP-009 i server-side initialize ugovor.
- PWA instalacija mogla bi se zamijeniti s offline funkcijom. Cache samo static shell; private writes online, persistent offline nije uključen, UI failure states definirani.
- Dates/UTC mogle bi pomaknuti rokove. Date-only stringovi i Europe/Zagreb satnica odvojeni od server updatedAt.
- Firestore kao relacijska baza mogao bi dati lažnu sigurnost kaskada. Parent hard delete konzervativno odbijen; archive i reference validation izričito opisani.
- Generički grade 1–5/50% prag nije potvrđen. Grade string i configured thresholds; nema izmišljenih stvarnih skala.

## 3. Missing Decisions / readiness

| Stavka | Readiness | Što čeka / posljedica |
|---|---|---|
| Product scope, platforma i stack | Ready | Potvrđeno razgovorom |
| Osnovni tokovi, UI smjer i model | Ready | Baseline s izvedbenim izborima za pregled |
| Stvarna pravila bodovanja/dolaznosti | Partially defined | Izvori nisu dostupni; generički unos/foundation mogu napredovati, actual configured grading ne može biti verified |
| Obračunski izbor pokušaja | Partially defined | Korisniku trenutno nebitno; gate samo za complete calc, ne history |
| Staged restore | Partially defined | ADR-004 Proposed; acceptance bootstrapa ili odluka prije FR-017 implementacije |
| Cloud UID/project/location | Partially defined | Runtime konfiguracija u deploy pripremi; nema aktivacije tijekom bootstrapa |
| Dependency verzije | Partially defined | Foundation provjerava kompatibilnost i pin; to je task, ne izmišljeno installed stanje |
| Runtime, device i release dokazi | Nisu izvedeni | Nema appa; planning nije PASS runtime provjera |

Nema Blocked za foundation zbog nedostajućih kolegija. Pogođene konfiguracije imaju gate. Konačni naziv i license nisu blocker osobnog MVP-a.

## 4. Recommended Fixes / pravila kasnijeg rada

- Po dolasku svih izvora: mapirati components, thresholds, attempt selection, attendance jedinice i decimal granice; uskladiti PRD/DATABASE i sintetičke/stvarne test scenarije.
- Ne označiti FR-015 ili puni stvarni MVP verified dok obračun ne odgovara dostavljenim pravilima.
- ADR-004 accept/revise u bootstrap reviewu prije backup implementacije; ako se izmijeni, ponoviti audit podataka/sigurnosti/recoverya.
- Verificirati SDK/Rules limite, OAuth Safari i EU lokaciju prije cloud koraka.
- Ako stvarni kolegij traži nestandardno ponderiranje, formulu ili drugu vrstu nastave, prijaviti domain contract change; ne prikriti ga generic metadata poljem.

## 5. Izvedene dokumentacijske provjere

- Početno: 24 Markdown datoteke, 18 unique FR IDs, sve FR reference u TESTING. Nema neizbalansiranih code fenceova ili nenamjernih template placeholders izvan templates.
- Tri tada nedostajuće poveznice upućivale su na ovaj audit i budući roadmap. Nakon njihove izrade finalni scan: 26 Markdown datoteka, 0 nepostojećih lokalnih poveznica, 0 fence problema, 0 nenamjernih placeholders izvan templates. Svih 18 FR ima reference u TESTING i IMPLEMENTATION_PLAN.
- Izračun osnovnog kontrasta (WCAG luminance formula): white/Quantum Blue 5.41:1; main text/Ice Glass 14.37:1; muted/white 6.98:1. To nije kompletna rendered UI accessibility provjera.
- Semantički pregled parova gore je dokumentacijski audit, ne test aplikacije, Rules ili hosted CI-ja.

## 6. Zaključak audita

Dokumentacijski baseline može voditi neovisni foundation i MVP razvoj nakon korisnikova odobrenja. Otvorene stvarne konfiguracije i Proposed backup odluka vidljive su i ograničavaju pogođene taskove. Nema skrivene odluke o pravilima kolegija, nema tvrdnje da app postoji i nema odobrenja implementacije. PHASE 8 izrađen je poslije ovog semantičkog audita; finalno je provjereno PRD ↔ IMPLEMENTATION_PLAN: svi MUST FR mapirani, nijedan LATER feature nije u TASK-001–012, ovisnosti/gates vidljivi i nema taska koji tvrdi da je dovršen.

## Izvedbeni audit 2026-10-10

Povijesni bootstrap status iznad vrijedi za 2026-10-07, ne za aktualnu provedbu. ADR-004 sada je Accepted od korisnika; TASK-010/011/012 nastavak odobren. Usklađeni su DECISIONS/ADR, AGENTS, TRD/ARCHITECTURE, DATABASE recovery stanja/freeze/readback/active switch, SECURITY i implementation/current-state statusi. Produkcijski deny-all/config nisu zamijenjeni lokalnim test UID-em. Novi public PWA cache ne uvodi offline/private-data scope. TASK-009C i real FR-015 acceptance čekaju izvore, a cloud/device release gates ostaju vidljivi u RELEASE_CHECKLIST i CURRENT_STATE.

Nema novog feature scopea ni stack/dependency promjene. Restore chunk1 i grading cap6/100 su verificirane izvedbene granice; real izvori moraju se pregledati bez trunciranja. Lokalni dokazi ne zamjenjuju fizičke uređaje, OAuth, cloud indekse ili potrošnju.

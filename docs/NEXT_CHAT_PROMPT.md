# Prompt za nastavak Kolegiuma

## Aktualna uputa za novi laptop — 2026-10-18

Nastavljamo postojeći Kolegium u trenutno otvorenom checkoutu privatnog repozitorija https://github.com/dcirko-side-projects/kolegium. Putanja checkouta može biti drukčija nego na starom laptopu. Prvo pročitaj AGENTS.md i ovaj dokument, zatim aktualne dokumente prema reading orderu, posebno CURRENT_STATE.md, IMPLEMENTATION_PLAN.md, COURSE_SOURCE_REVIEW.md i NEW_LAPTOP_SETUP.md. Provjeri live Git status i očuvaj radne izmjene. Ne ponavljaj bootstrap.

Korisnik 18.10. izričito naložio commit/push aktualnog projektnog checkpointa radi prijenosa na novi laptop. Git čuva source/testove/dokumentaciju, ne chat history, osobne privitke ili bazu. Git hash i status provjeri uživo. Nalog ne dopušta buduće automatske push/deploy/billing/public-repo ili destructive cloud akcije.

## Stack i cloud

Privatni faculty organizer: Angular/TypeScript PWA + Firebase Google Auth/Firestore/Hosting, hrvatski UI, quantum blue #2457FF / ice glass #DFF7FF. Android/iPhone/Windows. Firebase kolegium-c8970, Frankfurt europe-west3, Spark; cilj 0 EUR, ukupni maksimum 5 EUR/mjesečno. Bez aktivacije naplate. Online: https://kolegium-c8970.firebaseapp.com. Aplikacija radi neovisno o laptopu.

Default build i firebase.json ostaju zatvoreni; odvojeni release config koristi odobreni owner UID. Postoji online rasporedna verzija, ali lokalni reminder UI još nije deployan. Nema automatskog deploy workflowa. Javne Firebase config vrijednosti nisu admin credentials; privatni CLI store nije u repozitoriju.

## Što je već u stvarnom cloudu — ne unositi ponovno

- Pet kolegija i 174 pojedinačna termina, 5.10.2026.–6.2.2027. Baze su isključene. Web servisi vježbe 18:00–19:30, Bihevioralno 19:00–20:30. Datumi semestra izvedeni iz rasporeda, nisu dokaz službenog akademskog kalendara.
- Četiri rate po 645 EUR: 5.10.2026. plaćena; 10.1.2027., 28.2.2027. i 10.5.2027. neplaćene prema potvrđenom unosu 11.10. Naknadne korisnikove izmjene u aplikaciji imaju prednost pred ovim snapshotom.
- Nastavne informacije/linkovi za svih pet kolegija prema četiri PDF-a/ZIP-u/dvama screenshotovima obrađenima 15.10. Četiri projects (Web AutoDnevnik, Web REST/SOAP seminar, RMA mobilna aplikacija, BU timski seminar), dva BU kolokvija 4.12.2026./5.2.2027. te šest canonical scoreActivities s praznim bodovima. Nisu dodani prijava/Mendeley taskovi niti izmišljeni projekti za inovacije/NoSQL.

Rasporedni upis 11.10. i sadržajni upis 15.10. imaju backup/preconditions/atomic commit/readback dokaze u CURRENT_STATE/SCHEDULE_IMPORT/INSTALLMENTS_IMPORT/COURSE_SOURCE_REVIEW. Zadnji potvrđeni sadržajni read-only plan daje 0 updates/0 creates; root revision tada 4. To je povijesni snapshot, ne tvrditi da je i danas aktualan bez čitanja. Administrativni read/write nije browser/other-UID/cross-device dokaz.

## Odabrani putevi i otvorena pravila

- Web: korisnik radi veliki projekt AutoDnevnik i individualni seminar o usporedbi REST/SOAP web servisa. Potvrdio odabrani put bez obveze redovitih predavanja/labosa/tjednih zadataka. Izvor daje omjer 70 % projekt + 30 % prezentacija/seminar, prolaz ≥60 % i tablicu ocjena. Ne pretvarati udjele u 70/30 sirovih bodova, ne izmišljati decimalne granice ili rounding. PHP/CMS/API zahtjevi zabilježeni iz projektnog ZIP-a.
- RMA: vlastita mobilna aplikacija, tema/tehnologija/opseg s nastavnicom tek za dogovor. Korisnik je put nazvao trećim odabirom, ali značenje je projekt, ne natjecanje. Nema potvrđenog fiksnog roka/bodova/dolaznosti.
- Bihevioralno: četiri člana tima, radna tema toksično okruženje u firmi. Seminar/prezentacija i aktivnost uvjeti su, minimum dolaznosti 50 %, ali jedinica/agregacija i fond nisu definirani; ne izračunati minimum iz ICS counta. PDF navodi subotu 14.11. kao zamjenu za 20.11./27.11., bez satnice/lokacije; zabilježeno, raspored nije mijenjan. Tekst „16.10. odrađeno” nije dokaz korisnikove prisutnosti.
- Inovacije: screenshot traži tim do četiri člana/prijavu područja do 15.10.; samo informacija, bez taska. Tema/bodovi/drugi uvjeti nisu poznati.
- NoSQL: Klepčev uvod 164 stranice sažet kao sadržaj; ne sadrži pravila polaganja/bodovanja/dolaznosti ili korisnikovu temu. Ti podaci ostaju prazni.

TASK-009C i puni stvarni FR-015 nisu završeni dok nedostaju pravila. Svi pokušaji se čuvaju; nema best/latest automatizma ili zbrajanja svih pokušaja. Structured config trenutačno ima ukupni limit šest komponenti+intervala i 100 izbora. Unknown nije zero. Izmjene ugovora traže impact/backup i pripadajuće type/Rules/test dokumente.

## Potvrđeno i prvo sljedeće

Korisnik 15.10. potvrdio: „Faza 1 gotova, sve radi” za Google prijavu/pregled podataka na mobitelu i laptopu. Bilježeno PASS prema korisniku, ne agent-observed niti dokaz svake OS/browser/PWA kombinacije. Ne ponavljati fazu 1 kao da nije odrađena.

Faza 2 još nije potvrđena: dogovoreni To-do unos na mobitelu → server potvrda → refresh na laptopu → completion na laptopu → refresh/reopen na mobitelu, zatim provjera oba uređaja. Conflict/offline zasebno. Dalje dopuna pravila, stvarna provjera izračuna, backup/cloud recovery i TASK-011/012 dependency/performance/CSP/device/PWA gates. Novi deploy ili cloud restore traži zaseban nalog.

Podsjetnike korisnik odgodio. Lokalni in-app prozor 30/7 dana implementiran/provjeren i čuva se u sourceu, nije objavljen. Mobile push samo Proposed u PUSH_REMINDERS_PROPOSAL.md, bez naplate/infrastrukture.

## Lokalni rad i dokazi

Postojeći moduli implementirani su lokalno; bez novih featurea dok korisnik ne zatraži. README/package.json/NEW_LAPTOP_SETUP daju stvarne naredbe. Node22/npm11/JDK21 baseline, pinned dependencies iz lockfilea. Dev demo-kolegium 9099/8080 nikad se ne prazni testovima. Rules/SDK/browser suiteovi resetiraju samo izolirani demo-kolegium-tests 19099/18080 i izvode se sekvencijalno.

Dosadašnji unit 41/41; targeted schedule SDK6/6, browser10/10 + import axe/320px2/2; Planning SDK5/5 i targeted browser4/4. Release build/PWA PASS uz poznati 833.54kB/500kB bundle warning, bez podizanja budgeta. To su prijašnji lokalni dokazi; za najnoviji checkpoint pogledaj CURRENT_STATE. Fizički uređaji/OAuth/cross-device/recovery imaju odvojene granice, ne pretvarati sintetičke prolaze u stvarni dokaz.

Svježe provjere checkpointa 18.10.: unit41/41, Rules17/17, puni SDK33/33 i targeted Playwright schedule/planning18/18 PASS. Typecheck/lint/format/release build/PWA smoke PASS uz isti bundle warning. Potvrđena ignore granica i candidate secret-pattern scan bez nalaza. Nije izvršen cloud/deploy/data rewrite niti ponovljen puni Playwright/device acceptance.

## Lokalni materijali izvan Gita

artifacts/, .angular/, .firebase-cli/, .emulator-data/, node_modules/, dist/, .env i .codex-remote-attachments/ ignorirani su. Originalni PDF/ZIP/ICS u Downloads i osobni backupi ne prenose se Gitom. Ako budu potrebni, korisnik ih prenosi privatno; ne kopirati credentials ili tuđe identifikatore u source. Informacije su već u cloudu; nedostatak lokalnih artefakata nije razlog za ponovni seed ili restore. Stare putanje u dokazima odnose se na stari laptop.

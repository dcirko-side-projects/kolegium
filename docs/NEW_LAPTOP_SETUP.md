# Nastavak Kolegiuma na novom laptopu

Aktualizacija23.10.2026.: lokalno zakrpani build/CLI21.2.28, Vitest4.1.12 i Firebase CLI15.34.1; Node minimum22.22.2 i runtime/compiler21.2.25 nepromijenjeni. Svježi audit0runtime/5moderateCLI, bez high/critical. WebKit i privatni backup sandbox test dostupni opt-in prema README; testni suiteovi i dalje strogo sekvencijalni. Tab skip-link fokus popravljen izričitim tabindex0, emulator koristi long-polling/5s idle radi WebKit/Windows stream kompatibilnosti, production transport nije promijenjen. Konačni lokalni kandidat08e81c515a7f1629ce7e nije objavljen; online f1cf18a3673985c5f1fe već sadrži podsjetnike/ICS i excused. Snapshot23.10.root28/188sessions/2tasks je read-only dokaz, ne seed nalog. Najnoviji rezultati u CURRENT_STATE; izmjene još nisu commitirane/pushane.

Aktualizacija 19.10.2026.: Node minimum je **22.22.2** radi sigurnosne re2 zakrpe (verificirano 22.23.3). U cloudu je nakon korisnikovih korekcija **188 sessions uključujući otkazane i 5 projekata**; FoodLoop, nove vježbe inovacija utorkom i PHP izuzeće već su primijenjeni. Ne ponavljati seed. Nova frontend verzija 276da58dcec7220b4701 objavljena je po zasebnom nalogu; postojeći in-app reminder UI uključen, mobile push ostaje odgođen. Točne provjere i preostali završni koraci su u CURRENT_STATE/FINAL_ACCEPTANCE. Snapshoti od 18.10. ispod su povijest prijenosa.

Online update 2026-10-19: korisnik izričito odobrio i provedena je Hosting-only objava cijelog aktualnog frontenda s redizajnom i postojećim in-app podsjetnicima. Release 276da58dcec7220b4701; build/release PWA/hosted HTTP i desktop/mobile login smoke PASS. Raniji navodi da je UI/reminder samo lokalan opisuju stanje prije ove objave. Bez mobile push aktivacije, data/Rules migracije, naplate ili Git commit/pusha. Dokazi i granice u CURRENT_STATE/DEPLOYMENT.

Datum: 2026-10-18. Privatni repozitorij: https://github.com/dcirko-side-projects/kolegium. Ovaj dokument i NEXT_CHAT_PROMPT prenose projektni kontekst; ne predstavljaju izvoz razgovora ili lokalnih privatnih datoteka.

## 1. Preuzimanje projekta i konteksta

Prijavi Git/GitHub pristup računu koji smije čitati privatni repozitorij. U odabranoj lokalnoj mapi:

```powershell
git clone https://github.com/dcirko-side-projects/kolegium.git
cd kolegium
git status --short --branch
git log -1 --oneline
```

Ako checkout već postoji, prvo provjeri lokalne izmjene; `git pull --ff-only` koristi samo kada je primjeren postojećem stanju. Ne resetirati ili prepisivati lokalni rad radi usklađivanja.

Otvori kloniranu mapu kao projekt. Za novi chat možeš poslati:

> Nastavljamo postojeći Kolegium u trenutno otvorenom checkoutu. Prvo pročitaj AGENTS.md i docs/NEXT_CHAT_PROMPT.md, zatim aktualne dokumente prema reading orderu, posebno CURRENT_STATE, IMPLEMENTATION_PLAN i COURSE_SOURCE_REVIEW. Provjeri git status i očuvaj lokalne izmjene. Nemoj ponavljati bootstrap ili cloud seed. Faza 1 prijave/pregleda je korisnički potvrđena; sljedeća je cross-device provjera spremanja. Podsjetnici su odgođeni. Bez novog naloga nemoj commitati, pushati, deployati, aktivirati naplatu ili brisati cloud podatke.

Stare apsolutne putanje u povijesnim dokazima odnose se na stari laptop. Za source i naredbe koristi stvarnu putanju novog checkouta.

## 2. Već objavljena aplikacija

https://kolegium-c8970.firebaseapp.com radi neovisno o laptopu. Za korištenje nije potrebno instalirati razvojne alate. Google prijava mora koristiti postojeći odobreni račun; novi laptop nije razlog za novi Firebase projekt, promjenu owner UID-a ili unos rasporeda ispočetka.

U cloudu su već:

- 5 kolegija i 174 termina; baze isključene, Web vježbe u 18:00, Bihevioralno u 19:00.
- Četiri rate po 645 EUR: 5.10.2026. plaćena; 10.1.2027., 28.2.2027. i 10.5.2027. neplaćene prema zadnjem potvrđenom unosu. Korisnikovo naknadno označavanje u appu ima prednost pred ovim snapshotom.
- Informacije/linkovi kolegija prema izvorima od 15.10., četiri projekta/seminara, BU kolokviji 4.12.2026. i 5.2.2027., šest canonical aktivnosti bez izmišljenih bodova. Nisu dodani prijava/Mendeley taskovi.

Buduće osobne izmjene u aplikaciji ne vide se u Gitu; Firestore je izvor aktualne evidencije. Git čuva implementaciju i dokumentirane dokaze, nije backup baze.

## 3. Razvojno okruženje

Slijedi postojeći README/package.json: Node 22.x, najmanje 22.22.2 (verificirano 22.23.3; sigurnosna zakrpa re2), npm 11, Git i Java JDK 21 za emulatore. `JAVA_HOME` treba pokazivati na JDK; provjeri `node --version`, `npm.cmd --version`, `java -version` i `git --version`. Ne nadograđivati framework/dependencies samo zbog novog laptopa.

Instalacija zaključanih dependencies, kao u README-u:

```powershell
npm.cmd exec --yes --package=npm@11.21.0 -- npm ci
```

Lokalni razvoj koristi sintetički demo projekt, bez cloud podataka. U prvom terminalu:

```powershell
npm.cmd run emulators:start
```

U drugom terminalu:

```powershell
npm.cmd run auth:seed
npm.cmd run start
```

Otvori http://127.0.0.1:4200 i koristi testni Google login. Dev je `demo-kolegium` (9099/8080); to nije production prijava. Default build/deploy konfiguracija ostaje zatvorena. Odvojeni release config postoji, ali nova objava traži zaseban nalog.

Osnovne provjere:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run format:check
npm.cmd test
npm.cmd run build
npm.cmd run test:pwa
```

Za Rules/integration/e2e pokreni `npm.cmd run emulators:test` u zasebnom terminalu i `npm.cmd run start:e2e` u drugom. Testovi prazne samo `demo-kolegium-tests` (19099/18080). Instalacija testnog Chromiuma:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Get-Location) '.playwright-browsers'
npx.cmd playwright install chromium
```

Zatim sekvencijalno `test:rules`, `test:integration`, `test:e2e`; ne paralelno jer dijele potrošnu testnu bazu. Testovi nikad ne smiju resetirati dev ili cloud.

## 4. Što se ne prenosi Gitom

Credentials, `.firebase-cli`, `.env`, `.emulator-data`, `.angular`, `node_modules`, `dist`, `artifacts` i `.codex-remote-attachments` namjerno su ignorirani. Nema service-account ključeva ili deploy tokena u repozitoriju. Ako kasnije bude potreban Firebase CLI pristup, prijavi alat na novom laptopu; ne kopirati credential store u Git.

Izvorni PDF-ovi/ZIP/ICS i osobni backup JSON-ovi ostaju na starom laptopu. Ako će trebati daljnja analiza izvornih materijala, prenesi ih zasebno privatnim putem. Dokumenti COURSE_SOURCE_REVIEW i SCHEDULE_IMPORT sadrže source mapu i relevantne nalaze; runtime ne ovisi o prisutnosti izvornog Downloads direktorija. Točni sažeci već su spremljeni u cloud i mogu se urediti u aplikaciji. Ne pokušavati vratiti staru cloud kopiju samo zato što lokalni artefakti nedostaju.

## 5. Prvi preostali koraci

1. Faza 2: To-do unos na mobitelu → server potvrda → refresh na laptopu → dovršavanje na laptopu → refresh/reopen na mobitelu. Conflict/offline provjeriti zasebno; još nije potvrđeno.
2. TASK-009C: dopuniti nepoznate teme i službena pravila. RMA korisnik odabrao vlastitu mobilnu aplikaciju; Web veliki projekt+seminar uz iznimku dolazaka; BU radna tema toksično okruženje u firmi, tim 4. Inovacije/NoSQL nemaju izmišljenu osobnu temu/projekt. Postotke ne pretvarati u raw bodove bez izvora, unknown nije zero.
3. Dovršiti backup/recovery, dependency, performance, CSP i stvarne device/PWA gates prema CURRENT_STATE/RELEASE_CHECKLIST. Lokalni prolazi nisu dokaz svih stvarnih uređaja.
4. Podsjetnici su odgođeni. Lokalni kod in-app 30/7 dana čuva se u sourceu, ali nije deployan; mobile push samo Proposed, bez aktivirane naplate.

Commit/push nalog od 18.10. pokriva prijenos ovog checkpointa. Ne daje trajnu dozvolu za buduće push/deploy/billing ili brisanje podataka.

# Release evidencija — TASK-012

Najnovije23.10. — korisnik izričito odobrio commit/push/online:00bdce9 checkpoint pushan na postojeći privatni main, Hosting-only **08e81c515a7f1629ce7e PASS**. Hosted18ruta/cache/42assets SHA-256/production login1440-390px PASS;43Hostingdatoteke. Bez Rules/index/data/billing/visibility promjene; privatni artefakti izvan Gita. Release-evidence docs naknadno commitirane/pushane u istom nalogu. WebKit/native/grading/cloudrestore gates ostaju otvoreni; stariji navodi lokalnog kandidata ispod su povijest.

Konačni23.10.: Chromium **65PASS/1namjerni mobile keyboard skip/0failed/0flaky**, unit52/Rules18/SDK34/releaseRules2/privatni svježi backup sandbox2 i static/build/oba PWA PASS. Read-only production Rules odgovaraju odobrenom izvoru; anonymous403. **WebKit reload ostaje OPEN**, reproduciran i na čistom SDK-u bez aplikacije u više prolaza, uključujući pagehide unsubscribe pokušaj; nema punog WebKit/Safari/device PASS. Lokalni kandidat08e81c515a7f1629ce7e nije objavljen. CURRENT_STATE/BUGS_AND_IMPROVEMENTS čuvaju granice i sljedeći korak.

23.10.2026.: lokalne alatne zakrpe i dodatne provjere po nalogu „dovrši sve što možeš”. Runtime audit0, puni5moderate/0high/critical; build i oba PWA smokea PASS. Prvotni alatni artefakt bio je identičan online objavi; naknadni Tab fokus ispravak/emulator transport daju novi lokalni kandidat08e81c515a7f1629ce7e,42assets. Online ostaje f1cf18a3673985c5f1fe, bez novog deploya. Aktualni cloud backup root28 read-only validiran; lokalni oporavak i dodatni WebKit rezultati u CURRENT_STATE, ne zatvaraju fizički/cloud restore gate. Korisnik potvrdio Outlook import, alarm još ne.

Najnovija objava 20.10.2026.: izričito odobreni owner Firestore Rules za excused/absenceNote i Hosting aplikacije **f1cf18a3673985c5f1fe**, oba deploya PASS. Pre-release backup root26/188sessions validiran; Rules readback odgovara lokalnom izvoru, anonimni root403. Podsjetnici svih pet vrsta s privatnim .ics izvozom, ispričnice i preglednije informacije su online. Nema promjene indeksa, novog data upisa pri deployu, naplate ili Git commit/pusha. Fizički kalendarski import/alarmi i postojeći device/cross-device/grading/recovery gates ostaju otvoreni; ovo nije zatvaranje cijelog TASK-012.

Završni javni smoke najnovije objave PASS:18ruta/cache provjera,42assets SHA-256 identično releaseu, produkcijski login1440/390px bez overflowa/testnog gumba. Worker na oba origina odgovara f1cf18a3673985c5f1fe. Početni mrežni reseti i load timeout nisu aplikacijski PASS; završni puni javni run nakon ograničenih retryja/domcontentloaded provjere PASS. CURRENT_STATE navodi točne granice.

Ranija konkretna objava 20.10.2026.: po nalogu „objavi online” Hosting-only release **26a5b1aedb998aa9f514** s kalendarom Dan/Tjedan/Mjesec i filtrima/arhivom objavljen. Release build/PWA PASS bez warninga; 16 HTTP/cache provjera na oba origina, svih 40 javnih datoteka SHA-256 identično buildu i produkcijski login 1440/390px PASS. Bez Rules/index/data/billing/Git promjene. Prethodni otvoreni stvarni device/cross-device/grading/recovery gates nisu zatvoreni tom objavom.

Aktualno 19.10.2026.: owner Google OAuth, course/project server-confirmed writes, preuzeti/validirani cloud backup i desktop PWA waiting-update→nova objavljena verzija opaženi u stvarnom Chromeu na Windowsu. Novi utorci, PHP izuzeće i FoodLoop upisani uz backup/atomic preconditions/full readback; TASK-009C ostaje djelomičan zbog nepoznatih brojčanih pravila. Po zasebnom nalogu iz paralelnog rada frontend 276da58dcec7220b4701 već je online. Initial 361.07 kB bez 500 kB warninga; runtime audit 0, puni CLI audit 11 (7 high/4 moderate) nakon ciljane re2 zakrpe. Real physical/cross-device/conflict/offline, native install, mid-range performance, Safari i cloud restore gates ostaju otvoreni. FINAL_ACCEPTANCE navodi korisničke završne korake. Stariji gate redci ispod treba čitati uz ovu dopunu i CURRENT_STATE.

Najnovije 2026-10-15: korisnik potvrdio „Faza 1 gotova, sve radi” za predloženu Google prijavu i pregled podataka na mobitelu/laptopu. PASS — korisnička potvrda owner pristupa/pregleda, bez agentova neposrednog opažanja ili popisa OS/browser verzija. Cross-device mutacije/refresh/reopen, other UID, PWA native install/update i recovery i dalje čekaju zasebne dokaze. Stariji NOT RUN zapisi o owner pristupu opisuju stanje prije te potvrde.

Stanje 2026-10-10: korisnik potvrdio da Firebase projekt još nije napravljen. Ovo je lokalna priprema, bez objave i naplate. Projekt od početka ostaje Spark, preferirano 0 EUR, ukupni odobreni limit 5 EUR/mjesečno ne dopušta automatski Blaze upgrade.

Naknadni update: korisnik kreirao projekt i dostavio ID `kolegium-c8970` te web konfiguraciju. Potrebne javne vrijednosti unesene u `app-environment.ts`; mode ostaje unconfigured, approved UID prazan, production Rules deny-all. Nema Analytics importa/inicijalizacije ni measurementId u aplikaciji. Stvarni Spark plan, Google provider, UID, baza/lokacija i cloud pristup još nisu verificirani. Raniji zapis o nepostojećem projektu opisuje stanje prije ovog updatea.

| Gate | Status | Dokaz / sljedeći korak |
|---|---|---|
| Lokalni build i testovi | PASS lokalno | Završni brojevi u CURRENT_STATE |
| Production pristup zatvoren | PASS lokalno | Unconfigured environment i deny-all production Rules |
| Firebase projekt / EU lokacija baze | PASS projekt/baza | CLI ACTIVE, default Standard/Native europe-west3/freeTier=true; Spark korisnik potvrdio |
| Google Auth / approved UID | PASS owner podskup | Korisnička potvrda 15.10.; agent-observed Chrome/Windows owner Google login i course/project writes 19.10. Other UID/session edge cases na stvarnom cloudu otvoreni |
| Web konfiguracija / isti auth domain | PARTIAL real | Hosting OAuth popup i rezervirani helper rade na firebaseapp.com; Safari/mobile redirect provjera još otvorena |
| Production Rules i indeksi | PARTIAL cloud | Rules compile/deploy PASS; cloud indeksi READY 10/10. Owner Rules emulator PASS 2/2, anonymous cloud 403; real owner/other Google data test otvoren |
| CSP / Hosting headers | PARTIAL cloud | HTTPS/app/auth-helper/worker/manifest HTTP smoke PASS; HTML no-cache ispravljen i potvrđen. CSP Report-Only, OAuth enforcement još otvoren |
| Runtime dependencies | PASS snapshot 0 | DEPENDENCY_REVIEW; nije potpuna sigurnosna revizija |
| Dev/deploy dependencies | OPEN 5 moderate | 23.10. kompatibilne alatne zakrpe: 0 high/critical, runtime0; preostalih5moderate u CLI Pub/Sub/OpenTelemetry i gaxios/uuid lancima, DEPENDENCY_REVIEW |
| Stvarni kolegiji / grading | PARTIAL | Izvori i teme/raspored primijenjeni 15./19.10.; puna brojčana konfiguracija TASK-009C još nedostaje |
| Fizički Android/iPhone/Windows | NOT RUN | Browser + instalirani prikaz, login/logout, današnja dolaznost, unos i update |
| Cloud write/read / drugi uređaj / backup | PARTIAL real | Desktop owner UI writes/read/export i admin atomic/readback PASS 19.10.; physical cross-device i cloud restore/recovery otvoreni |
| Mobile performance / kvote | NOT RUN physical | Initial 361.07 kB bez starog warninga; stvarni reprezentativni uređaj/3 s i potrošnja još nisu izmjereni |
| Objava / URL | PASS aktualna objava | Zasebno odobreni Rules + Hosting deploy 20.10., f1cf18a3673985c5f1fe; primarni URL kolegium-c8970.firebaseapp.com. Buduće objave traže novi nalog |

## Redoslijed povezivanja

CLI prijava i read-only projekt/baza pregled PASS: ACTIVE kolegium-c8970, default Standard Native baza europe-west3/freeTier=true; Spark prema korisniku. Cloud indeksi prazni. First online candidate pripremljen u RELEASE_CANDIDATE uz odvojeni release config/build; real data/device acceptance ostaje NOT RUN. Objava još čeka konkretan korisnikov nalog.

Najnovija potvrda: korisnik potvrdio Spark; screenshot Firestore Rules za `(default)` pokazuje `allow read, write: if false`. To je dokaz prikazanog deny-all Rules sadržaja, uz prethodni anonymous HTTP 403 smoke. Owner Rules kandidat nije objavljen. Frankfurt je potvrđen korisnikom. Prije real releasea slijedi CLI prijava i read-only provjera projekta; wrapper `node scripts/firebase-cloud.mjs login --reauth` čuva credentials u ignoriranom workspace `.firebase-cli`, dopušta samo login/login:list/projects:list i ne može deployati. Ne slati lozinku, CLI authorization code niti token u razgovor.

Korisnik naknadno potvrdio kreiranu bazu u Frankfurtu. Za dobivanje vlastitog UID-a pripremljen je lokalni Auth-only helper prema DEPLOYMENT (`localhost:4402`); production app i Rules ostaju zatvoreni. Kreiranje baze je korisnikova potvrda, cloud Rules/Spark/OAuth još treba provjeriti.

### Prvi korisnikov korak — priprema računa i projekta

Provjera 2026-10-10: `.firebaserc` ne postoji; lokalni Firebase CLI `login:list --non-interactive` prijavio je da nema autoriziranih računa. CLI je također prijavio neuspješnu provjeru update config storea; nije izvedena cloud provjera niti izmjena dozvola tog direktorija.

1. Otvoriti [Firebase Console](https://console.firebase.google.com/) na vlastitom Google računu i kreirati projekt naziva **Kolegium**. Zabilježiti stvarni jedinstveni project ID koji console predloži; display name i ID nisu isto.
2. Google Analytics i opcionalnu Gemini pomoć ostaviti isključene. Zadržati **Spark**, bez povezivanja billing accounta.
3. Registrirati web app preko ikone `</>`, s internim nazivom **Kolegium Web**. SDK već postoji u ovom repozitoriju; ne inicijalizirati novu aplikaciju i ne pokretati automatski deploy iz čarobnjaka.
4. Dostaviti project ID i javni `firebaseConfig` objekt. Service-account ključ, CLI token i lozinka nisu potrebni.
5. Korisnik naknadno potvrdio lokaciju i Google provider: kreirati **Standard edition, `(default)`, regionalni `europe-west3` (Frankfurt), Production mode**. Nakon kreiranja baze provjeriti deny-all Rules prije aplikacijskog pristupa. Stvarno kreiranje još nije potvrđeno.

Sljedeći batch nakon projekta: Google provider, stvarni approved UID i same-origin Auth konfiguracija, zatim lokalni review production konfiguracije i Rules. Stvarnu objavu odobriti tek uz konkretan release. TASK-012 ostaje djelomično pripremljen.

Provjereni izvori: [kreiranje projekta i registracija web aplikacije](https://firebase.google.com/docs/web/setup), [Spark i billing account](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans), [Firestore lokacije i nepromjenjivost odabrane lokacije](https://firebase.google.com/docs/firestore/locations).

1. Kreirati Firebase projekt na vlastitom računu bez billing accounta. Poslati project ID i public web konfiguraciju; ne slati tajne.
2. Dogovoriti i zabilježiti lokaciju Firestore baze prije kreiranja. Postaviti Google Auth i authorized Hosting domain. Production ne koristi emulator mock ni test mode Rules.
3. Povezati web konfiguraciju i approved Google UID u production environment/Rules. Frontend UID sam nije authorization. Ne zamijeniti deny-all Rules lokalnim `local-owner` pravilima.
4. Ponoviti gates, pregledati indekse i release dependency nalaze, testirati konfiguraciju bez stvarnih podataka. Nema automatskog deploymenta.
5. Odobriti konkretnu objavu, zatim Rules/indeksi/Hosting uz provjeru kompatibilnosti. Firebase rezervirane `/__/auth/*` putanje moraju ostati dostupne.
6. Provesti real OAuth, cross-device i backup/device smoke; zabilježiti URL, verzije uređaja i rezultate. Tek to dokazuje samostalan pristup s mobitela.

Hosting rollback vraća kod, ne podatke. Prije promjene ugovora preuzeti validiran export; prethodna dataset kopija ostaje zaštićena. PWA cache sadržava samo javni kod/ikone; stare javne verzije zadržavaju se radi otvorenih tabova i mogu se ukloniti čišćenjem podataka web-stranice kada nema nespremljenog unosa. To briše browser prijavu, ne Firestore evidenciju.

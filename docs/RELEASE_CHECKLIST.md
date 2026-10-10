# Release evidencija — TASK-012

Stanje 2026-10-10: korisnik potvrdio da Firebase projekt još nije napravljen. Ovo je lokalna priprema, bez objave i naplate. Projekt od početka ostaje Spark, preferirano 0 EUR, ukupni odobreni limit 5 EUR/mjesečno ne dopušta automatski Blaze upgrade.

Naknadni update: korisnik kreirao projekt i dostavio ID `kolegium-c8970` te web konfiguraciju. Potrebne javne vrijednosti unesene u `app-environment.ts`; mode ostaje unconfigured, approved UID prazan, production Rules deny-all. Nema Analytics importa/inicijalizacije ni measurementId u aplikaciji. Stvarni Spark plan, Google provider, UID, baza/lokacija i cloud pristup još nisu verificirani. Raniji zapis o nepostojećem projektu opisuje stanje prije ovog updatea.

| Gate | Status | Dokaz / sljedeći korak |
|---|---|---|
| Lokalni build i testovi | PASS lokalno | Završni brojevi u CURRENT_STATE |
| Production pristup zatvoren | PASS lokalno | Unconfigured environment i deny-all production Rules |
| Firebase projekt / EU lokacija baze | PASS projekt/baza | CLI ACTIVE, default Standard/Native europe-west3/freeTier=true; Spark korisnik potvrdio |
| Google Auth / approved UID | PARTIAL | Google provider i UID potvrđeni korisnikom; agent nije neposredno verificirao real OAuth/device tok |
| Web konfiguracija / isti auth domain | NOT RUN | Public web config, bez service-account ključa; OAuth redirect provjeriti na Hosting domeni |
| Production Rules i indeksi | PARTIAL cloud | Rules compile/deploy PASS; cloud indeksi READY 10/10. Owner Rules emulator PASS 2/2, anonymous cloud 403; real owner/other Google data test otvoren |
| CSP / Hosting headers | PARTIAL cloud | HTTPS/app/auth-helper/worker/manifest HTTP smoke PASS; HTML no-cache ispravljen i potvrđen. CSP Report-Only, OAuth enforcement još otvoren |
| Runtime dependencies | PASS snapshot 0 | DEPENDENCY_REVIEW; nije potpuna sigurnosna revizija |
| Dev/deploy dependencies | OPEN | CLI nalazi nisu riješeni; procjena kompatibilne zakrpe prije deploya |
| Stvarni kolegiji / grading | NOT RUN | TASK-009C čeka izvore; app ih ne izmišlja |
| Fizički Android/iPhone/Windows | NOT RUN | Browser + instalirani prikaz, login/logout, današnja dolaznost, unos i update |
| Cloud write/read / drugi uređaj / backup | NOT RUN | Testni zapisi odvojeno od stvarne evidencije, potvrditi povrat i oporavak |
| Mobile performance / kvote | NOT RUN | Reprezentativni uređaj i potrošnja; bundle warning ostaje |
| Objava / URL | PASS prva testna objava | Korisnik odobrio 2026-10-10; Rules/indeksi/Hosting objavljeni. Primarni URL kolegium-c8970.firebaseapp.com; device/private-data acceptance još otvoren |

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

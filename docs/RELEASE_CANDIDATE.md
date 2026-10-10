# Prva online testna verzija — Kolegium

Datum: 2026-10-10. Korisnik izričito odobrio i agent objavio prvu online testnu verziju: Firestore Rules/10 indeksa, zatim Firebase Hosting. Ovo nije završni acceptance cijelog MVP-a. Primarni URL: https://kolegium-c8970.firebaseapp.com (isti authDomain). Hosting alias: https://kolegium-c8970.web.app.

## Konkretna objava za pregled

Projekt `kolegium-c8970`, postojeća `(default)` Firestore Standard/Native baza u `europe-west3`, freeTier=true verificirano read-only CLI pozivom. Korisnik potvrdio Spark plan. Hosting origin za prvi test: `https://kolegium-c8970.firebaseapp.com`, isti kao authDomain radi mobile redirect toka. Javni app shell; privatni podaci dostupni isključivo odobrenom UID-u prema Rules. Nema Analyticsa, seedanja kolegija niti plaćenih servisa.

Build: `npm run release:build`. Konfiguracija: `firebase.release.json` bira `firebase/firestore.release.rules` i postojeće indekse. Kandidat ima production mode; default `npm run build` ostaje unconfigured, `firebase.json` ostaje deny-all. Zajednički javni config/UID je `src/app/core/config/firebase-project.ts`, bez admin credentials. CLI credentials ostaju ignorirani i ne ulaze u build.

Plan nakon korisnikova naloga objave:

1. Provjeriti da nema postojeće evidencije; ako je ima, prije promjene uzeti validiran backup i provjeriti kompatibilnost. Ne seedati ni brisati cloud podatke.
2. Objaviti pregledana Rules/indekse samo u ovaj projekt, provjeriti index readiness.
3. Objaviti kandidata na Firebase Hosting uz eksplicitan project/config/only izbor. Nema Functions, Storage, App Hosting, billing upgradea ni automatskog CI deploya.
4. Provjeriti real OAuth/owner/forbidden pristup, header/auth helper ponašanje, prvi server-confirmed zapis, drugi uređaj i backup. Sintetičke test zapise izdvojiti od osobne evidencije; destructive restore/cleanup ne izvoditi bez konkretnog plana i odobrenja.
5. Tek nakon fizičkog Android/iPhone/Windows i recovery/performance provjera završiti odgovarajuće TASK-011/012 gates.

## Dokazi i otvorene granice

- CLI prijava uspješna; projekt ACTIVE i prava read-only pregleda potvrđena. Cloud composite indeksi trenutno prazni.
- Release Rules 2/2 na izoliranom emulatoru; isti domain ugovor kao lokalni Rules uz owner konstantu. Anonymous cloud root GET odbijen; stvarni approved/other OAuth data test još nije izveden.
- Release build i PWA smoke PASS: real config prikazuje Google login gumb, javni cache i update ugovor prolaze bez prijave ili privatnih podataka. Build 833.54 kB initial / 220.74 kB estimated transfer; postojeći 500 kB warning nije uklonjen povećanjem budžeta.
- CSP ostaje Report-Only kandidat radi real OAuth provjere. Nije enforced zaštita ni završni security release PASS.
- Puni dependency audit i dalje 12 nalaza (7 high / 5 moderate), runtime snapshot ranije 0. Nema audit fix --force. Scope procjena CLI puta u DEPENDENCY_REVIEW; nalazi nisu nestali.
- Device/OAuth/cross-device/cloud restore/performance i TASK-009C stvarna pravila još nisu PASS. Prva objava služi provjeri tih tokova; ne tvrditi puni release DoD prije njih.

Hosting rollback vraća samo kod. Ne vraća bazu. Prethodni dataset recovery ugovor ostaje isti; nema schema promjene ili migracije osobnih podataka u ovom kandidatu.

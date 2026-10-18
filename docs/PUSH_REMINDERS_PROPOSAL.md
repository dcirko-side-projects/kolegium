# Prijedlog mobilnih podsjetnika za rate

Datum: 2026-10-11. Status: **Proposed**, korisnik zatražio prijedlog bez aktivacije naplate. Ovo nije odobrenje Blaze plana, novog backend sustava, schema/Rules promjene ili deploya. Lokalni podsjetnici na Početnoj već su zasebno implementirani; mobilni push nije implementiran niti aktiviran.

## Predloženo ponašanje

Podsjetnik za svaku neplaćenu ratu 30 i 7 kalendarskih dana prije dueOn. Predloženo vrijeme 09:00 Europe/Zagreb čeka potvrdu prije implementacije. Plaćene rate preskaču se. Ne tražiti dozvolu na početnom učitavanju: Postavke → Omogući obavijesti, izričit korisnikov klik, provjera podrške i dozvole, registracija ovog uređaja. Odbijena dozvola ima jasnu poruku; in-app pregled nastavlja raditi. Korisnik može isključiti uređaj/podsjetnike. Klik obavijesti otvara /installments nakon normalne Google prijave.

Na zaključanom ekranu predloženi tekst je samo „Kolegium: približava se rok plaćanja rate”, bez iznosa, naziva ili osobnih podataka. Izvor istine ostaje postojeći installment zapis. Push nije potvrda plaćanja niti jamstvo isporuke u točnu minutu.

Za trenutne neplaćene rate datumi su:

| Rok | 30 dana prije | 7 dana prije |
|---|---|---|
| 10.1.2027. | 11.12.2026. | 3.1.2027. |
| 28.2.2027. | 29.1.2027. | 21.2.2027. |
| 10.5.2027. | 10.4.2027. | 3.5.2027. |

Prva rata je plaćena i ne dobiva podsjetnike. Ovo su planirani datumi, ništa nije zakazano.

## Izvedba koja najbolje odgovara postojećem Firebase stacku

Firebase Cloud Messaging (FCM) + postojeći service worker + jedna scheduled Cloud Function 2nd gen u europe-west3 + jedan Cloud Scheduler job. Predloženi dnevni job čita aktualni root/pointer i neplaćene rate koje dospijevaju za 7/30 dana; ne čita cijeli raspored. Preskače restore lock, validira schema i provjerava current root/record revision neposredno prije slanja. Retry isti dan ima ograničen broj pokušaja. Prekidi dulji od dana daju vidljiv dijagnostički status; naknadni catch-up zahtijeva izričit ugovor, bez nasumičnog slanja starih podsjetnika.

FCM zahtijeva pouzdan serverski pošiljatelj; privileged credentials nikad ne idu u Angular. Funkcija ima dedicated identity s najmanjim potrebnim IAM pravima, IAM-authenticated scheduler, bez javnog arbitrary-send endpointa. FCM tokeni privatni su podaci i ne smiju biti u logovima, Git-u ili backupu. Web VAPID javni ključ smije biti u configu; secrets ostaju serverski.

Predloženi novi owner-only operativni podaci izvan dataset generacija: notificationDevices, notificationPreferences i serverski notificationDeliveries ledger. Nisu primijenjeni. Potrebni su DATABASE/SECURITY/types/Rules testovi prije uvođenja, veličinski limiti i ograničen broj uređaja. Ledger može mijenjati samo server, owner može upravljati vlastitim uređajima/preferences uz zatvorena pravila. Restore ne smije ponovno aktivirati stare tokene ili receiptove; sender uvijek provjerava aktualni dataset. Backup format ostaje domain-only. Izmjena dueOn ili paid stanja poništava buduće odluke o slanju; idempotency ključ uključuje dataset, installment ID, dueOn, leadDays i uređaj.

Ledger koristi claim/lease i rezultat slanja; exponential retry i uklanjanje invalid tokena. Firestore commit i FCM send ne mogu biti jedna atomarna transakcija: pad nakon slanja prije zapisivanja receipt-a može ponoviti poruku. Stabilni notification tag može smanjiti vidljive duplikate, ali ne obećavati exactly-once dostavu. Plaćanje u trenutku slanja također ima mali race koji finalni re-read smanjuje, ne uklanja potpuno.

Service worker mora zadržati sadašnji static-only cache i zaštitu updatea; push obrada ne smije dodati auth/private response cache ili automatski reload otvorenog taba. Android/Chrome je primarni device gate. iPhone podržava Web Push za Home Screen web app na iOS 16.4+, uz korisničku dozvolu; obvezno testirati konkretni Safari/PWA uređaj, FCM podršku i token lifecycle. Ne tvrditi device uspjeh iz desktop emulacije.

## Trošak i granice

Službeni cjenici pregledani 11.10.2026. FCM je bez naknade. Cloud Functions zahtijeva Blaze/billing. Jedan Scheduler job ima cijenu **0,10 USD/mjesečno** izvan allowancea od tri joba po billing accountu. Free allowance može već biti potrošen drugim projektima.

Planirani workload: oko 31 dnevno pokretanje mjesečno; pretpostavljen gornji normalni runtime 10 s/run, 1 vCPU, 256 MiB, minInstances=0, maxInstances=1, timeout 30 s. To je oko 310 vCPU-sekundi i 77,5 GiB-sekundi mjesečno. Četiri rate/dva uređaja daju najviše šesnaest redovnih delivery pokušaja u mjesecu ako oba podsjetnika svih rata padnu u taj mjesec; trenutni godišnji raspored ima samo šest reminder događaja po uređaju. Bounded reads reda nekoliko stotina mjesečno, ne puni dataset scan. Ovo su procjene, ne izmjerena potrošnja.

Za tako mali promet očekuje se uglavnom besplatni allowance i vrlo malen trošak izvan njega. Radna rezerva **0–1 EUR/mjesečno dodatno** služi planiranju, nije ponudbena cijena ni zajamčen limit. Finalnu procjenu prije odluke napraviti za Frankfurt, stvarnu generaciju/CPU/memory, postojeću potrošnju billing accounta, build/Artifact Registry retention, logove, mrežu, poreze i valutu. Gen2 compute provjeriti kroz Cloud Run cjenik; ne prenijeti gen1 kvote na gen2 bez provjere.

Ukupan projektni cilj ostaje 0 EUR, najviše 5 EUR/mjesečno. Blaze **nema pouzdan hard cap na 5 EUR**; budget alert to ne jamči. Min/max instance, timeout, bounded retries i ograničenje jobova smanjuju potrošnju, nisu računovodstveni limit. Zahtjev za strogo zajamčenim maksimumom nije riješen ovim prijedlogom.

Moguće je ostaviti Firebase na Sparku uz zaseban pouzdan host/scheduler za FCM; to nije tehnički zabranjeno, ali dodaje novi provider, credentials/IAM, ograničenja besplatnog plana i nadzor. Takva opcija traži zaseban konkretni izbor i procjenu prije izvedbe. Mobilni kalendar ostaje moguća jednostavnija alternativa, ali korisnik je u ovom koraku zatražio prijedlog push sustava.

## Prije aktivacije

1. Potvrditi arhitekturu, 09:00 satnicu i prihvatljivost Blaze rizika ili konkretan vanjski host. Pripremiti Accepted ADR tek nakon odluke.
2. Implementirati lokalno i provjeriti owner/other/anonymous Rules, token registration/revocation, paid/changed-date suppression, DST, lease/retry, restore lock/pointer change i izostanak auth/private cachea.
3. Zaseban nalog za billing i release. Deploy nije odobren postojećim nalogom.
4. Stvarna Android/iPhone dozvola, pozadinska poruka dok je app zatvoren, klik/login i isključenje; odvojeno dokumentirati provider acceptance i device delivery.

## Službeni izvori

- [FCM trusted server i tokeni](https://firebase.google.com/docs/cloud-messaging/server-environment)
- [Firebase cjenik](https://firebase.google.com/pricing)
- [Scheduled Functions](https://firebase.google.com/docs/functions/schedule-functions)
- [Cloud Scheduler cjenik](https://cloud.google.com/scheduler/pricing)
- [Cloud Run cjenik za gen2 compute](https://cloud.google.com/run/pricing)
- [WebKit iOS Home Screen Web Push](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)

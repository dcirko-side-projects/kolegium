# Završna provjera Kolegiuma — 19.10.2026.

23.10.naknadno: odobreni Git checkpoint00bdce9 i Hosting-only08e81c515a7f1629ce7e izvršeni, hosted smoke PASS. Korisnik može učitati novu verziju na postojećem URL-u; candidate-not-published navodi ispod su povijest. WebKit/physical/cross-device/Outlook alarm i stvarni cloud restore ostaju zasebne provjere, bez novih privatnih upisa.

23.10.2026.: korisnik potvrdio uvoz .ics datoteke u Outlook. Import više nije nepoznat; mobilni alarm/dozvole još treba potvrditi. Dodana je lokalna provjera vlastitog backupa i dodatna WebKit regresija; točni završni rezultati u CURRENT_STATE. Stvarni cloud restore nije izvođen jer mijenja aktivnu produkcijsku evidenciju; lokalni dokaz ne zatvara taj gate. Alatne zakrpe same nisu promijenile frontend; naknadni Tab fokus ispravak daje novi lokalni kandidat08e81c515a7f1629ce7e koji još nije objavljen.

20.10.2026. — novi korisnički koraci nakon .ics/ispričnica: u Podsjetnicima preuzmi datoteku, uvezi u zaseban kalendar Kolegium te na stvarnom telefonu provjeri jedan nadolazeći alarm i dozvole kalendara. Nakon promjene roka/plaćanja/otkazivanja ručno zamijeni prethodni uvoz; izvoz nije pretplata. Odvojeno provjeri ispričnicu s opcionalnom napomenom nakon refresha na drugom uređaju i uklanjanje napomene pri promjeni oznake. Treba najprije učitati novu PWA verziju koja poznaje excused. Popis zapisanih faza i ograničenja sada je i u aplikaciji na Podsjetnici → Zapisane sljedeće faze i poznata ograničenja. Sandbox/ICS byte testovi ne zamjenjuju fizičku isporuku alarma.

Temeljni moduli postoje; ovo odvaja završenu lokalnu provjeru od stvarnih uređaja i još nepoznatih pravila. Aktualna evidencija i zadnji rezultati su u CURRENT_STATE.

## Stvarni podaci

- Inovacije: seminar FoodLoop s korisnikovim opisom, vježbe utorkom 17:30–19:00, predavanja četvrtkom. Četrnaest novih termina čuva nastavne pauze; učionica nije pretpostavljena.
- PHP: AutoDnevnik + REST vs SOAP, potvrđeno oslobođenje od nastave; buduća nastava otkazana.
- Bihevioralno: isti seminar s radnom temom Toksično okruženje u tvrtkama, bez novog duplikata.
- Sačuvani su prošli termini, sva dolaznost, rate, kolokviji i rezultati. Validirani backup prije promjena i puni readback poslije promjena PASS. Novi snapshot ima 188 sessions, uključujući otkazane; 5 projekata, 2 kolokvija i 6 bodovnih aktivnosti. To nije uputa za seed.

## Što korisnik provjerava na kraju

1. Na mobitelu i laptopu otvori online aplikaciju, spremi otvoreni unos pa odaberi Učitaj novu verziju ako je ponuđeno. Provjeri FoodLoop, nove utorke, četvrtak i PHP izuzeće. Nova objavljena verzija početno skriva otkazane termine; Upravljanje rasporedom → Prikaži otkazane termine otvara povijest.
2. Na mobitelu dodaj samostalni To-do „Provjera sinkronizacije” i pričekaj potvrdu spremanja. Na laptopu osvježi, dovrši isti zadatak, a zatim osvježi mobitel. Ponovno otvori aplikaciju na oba uređaja i potvrdi isti status. Time se provjerava stvarni cross-device tok bez promjene ocjena ili dolaznosti.
3. Provjeri instalirani PWA i obični preglednik: navigacija, povratak nakon zatvaranja, ponuda nove verzije. Otvoreni nespremljeni unos mora blokirati update; nakon spremanja update treba raditi. Zabilježi uređaj/preglednik/verziju.
4. U nespremljenom To-do obrascu isključi mrežu: spremanje je onemogućeno, unos ostaje vidljiv. Vrati vezu, pričekaj osvježavanje pa spremi ili odustani. Na dva uređaja otvori isti zapis prije izmjene i provjeri da zastarjeli unos nudi konflikt umjesto tihog prepisivanja.
5. Preuzmi backup iz Postavki i čuvaj datoteku privatno. Stvarni cloud restore nije izveden u ovom nastavku; zamjena aktivne evidencije zahtijeva zaseban konkretan dogovor i kontrolirani test.

## Otvorene granice

Potpuni automatski izračun stvarnih ocjena i dalje čeka nedostajuća pravila/normalizaciju/pragove i politiku pokušaja gdje je potrebna. Ne bira se best/latest i ne pretpostavlja minimum dolaznosti. Native Android/iPhone/Safari, mid-range brzina, stvarni cross-device konflikt/offline i cloud restore nisu zamijenjeni sintetičkim testovima. CSP ostaje Report-Only dok stvarni OAuth/device tokovi nisu potvrđeni.

U paralelnom radu korisnik je zasebno odobrio „Ažuriraj full i online”; frontend 276da58dcec7220b4701 objavljen je 19.10., uključujući postojeći in-app prikaz podsjetnika. Novi mobile push rad ostaje odgođen; nema nove push infrastrukture ili naplate. Ovaj nastavak nije sam izvršio deploy, commit ili push. Buduće objave traže zaseban nalog prema AGENTS.md. U checkoutu su sačuvane paralelne UI izmjene; njihovi dokazi su u UI_REDESIGN/CURRENT_STATE.

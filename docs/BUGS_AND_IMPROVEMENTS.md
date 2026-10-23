# Nalazi i poboljšanja

## 23.10.2026. — tehničko održavanje i završne provjere

- WebKit/Windows Tab preskakao je Preskoči na sadržaj. Ponovljeno na izoliranom HTML-u; eksplicitni tabindex0 vraća anchor u redoslijed. Stvarni aplikacijski desktop WebKit keyboard test PASS nakon ispravka.
- **OTVORENO: WebKit/Windows reload/restore pouzdanost.** Lokalni emulator povremeno ostaje u učitavanju poslije reloada ili otvaranja drugog browser contexta. Forced long-polling/5s idle samo u emulator modu poboljšao je ciljane prolaze, ali nije pouzdano uklonio zastoj: isti restore scenarij prošao je oko17s pa kasnije pao na ponovnom učitavanju/otvaranju drugog klijenta i uz120s ukupni rok. Nema blanket skipa, aplikacijskog tihog retryja ili proglašenja punog WebKit PASS. Produkcijski SDK transport nije promijenjen; treba reproducirati na stvarnom Safari/iPhoneu i izolirati SDK/engine uzrok prije dodatne produkcijske intervencije. Ovo nije dokaz uzroka u upstreamu niti dokaz gubitka podataka: SDK/Chromium/privatni backup payload provjere prolaze.
- Dodan semantički aria-busy na glavni sadržaj: obavještava pomoćne tehnologije o inicijalnom učitavanju/mutaciji. Login helper pozitivno čeka završetak tog stanja; odsutnost teksta učitavanja mogla je proći prije početka čitanja. To uklanja nedovoljno precizan testni preduvjet, ne tvrdi da je riješen gornji WebKit zastoj.
- WebKit zastoj izoliran na minimalnom Firebase SDK12.19.0 reproduceru bez Angulara, naših storeova/forma i service workera: dva browser contexta, samo read/watch, ponavljana navigacija; prvih5prolaza~0.5–0.7s, šesti ostao pending do15s timeouta. Nije dokaz točnog upstream sloja niti fizičkog Safari ponašanja.12.19.0 je zadnji dostupni12.x prema registryju23.10.; nema neprovjerenog SDK13/Node major skoka. Potrebna je izolirana SDK/engine analiza ili stvarni Safari dokaz prije produkcijskog workarounda.
- Sigurnosni snapshot postojećeg lockfilea porastao na16nalaza (8high/7moderate/1low). Kompatibilne alatne zakrpe i ip-address patch spustili su ga na5moderate, bez high/critical; runtime0. Preostali CLI OpenTelemetry/uuid lanci traže kompatibilan upstream popravak, nisu skriveni ni forsirani major overrideom.
- Kalendar test pretpostavljao je početni odabir kolegija prema redoslijedu slučajnih ID-ova. Jedan mobile Chromium pad otkrio je nedeterministički testni preduvjet; sada izričito bira Analiza + Pretraži prije provjere da pending izbor Programiranje ne mijenja rezultate. Nema promjene produktnog filtra.
- Dodana ponovljiva opt-in provjera vlastite JSON kopije na izoliranom emulatoru, uključujući puni payload roundtrip i prekid/abort/cleanup. To ne zamjenjuje stvarni cloud restore.
- WebKit desktop/iPhone-emulation projekti dostupni opt-in; konačni rezultati i eventualni nalazi u CURRENT_STATE. Fizički uređaj ostaje zaseban dokaz.
- Korisnik potvrdio uvoz ICS-a u Outlook; isporuka konkretnog mobilnog alarma još nije potvrđena.

## 20.10.2026. — podsjetnici, ispričnice i kolegiji

| Nalaz | Status | Provedba / sljedeći korak |
|---|---|---|
| Gubitak otvorenog retka pri odlasku offline mogao je ukloniti nespremljenu ispričnicu | Popravljeno | ScheduleStore zadržava zadnji prikaz bez mreže, blokira spremanje i osvježava pri povratku. Browser test čuva istu napomenu kroz offline/reconnect. |
| Refresh retka tijekom pisanja ispričnice mogao bi promijeniti reviziju nad kojom se sprema | Spriječeno u novoj izvedbi | Forma čuva izvorni occurrence/revision; drugi klijent ne biva tiho prepisan. Stale SDK i dvoklijentski browser dokaz. |
| Kopiranje izvornog termina u nadoknadu moglo bi prenijeti ispričnicu na novi termin | Spriječeno u novoj izvedbi | Nadoknada ostaje unmarked, bez napomene. Otkazivanje i promjena oznake čiste napomenu. |
| Informacije o kolegiju bile su jedan dugačak blok | Popravljeno | Naslovi i odlomci, sadržajna navigacija i cjelovit izvorni tekst; pohranjeni sadržaj ostaje isti. |
| Mobilni podsjetnici nisu imali aktivnu izvedbu bez naplate | Odabrana besplatna alternativa | Privatni .ics izvoz za svih pet izvora, alarmi i upute. Nije automatski push niti sinkronizacija. |
| Izvoz učitanog dijela mogao bi izgledati kao cjelovit kalendar | Spriječeno | Preuzimanje blokirano dok postoje dodatne stranice/kolegiji, greška, offline ili različiti dataset/revision snapshotovi. |

## Otvorene provjere i ograničenja

- Provjeriti stvarni uvoz i barem jedan alarm na konkretnom Android/iPhone kalendaru. Browser test preuzete ICS datoteke ne dokazuje isporuku na zaključani ekran. Neki importeri traže računalo i mogu drukčije postupati s alarmima; u aplikaciji su upute i izričita provjera dozvola/alarmi.
- Nakon promjene roka, dovršavanja, plaćanja ili otkazivanja korisnik treba zamijeniti prethodni uvoz u zasebnom kalendaru Kolegium. Stari događaji iz prethodnog uvoza ne brišu se sami; stabilni UID smanjuje nedosljednost, ali ne jamči postupak svakog importera.
- Zadaci/projekti bez roka i kolokviji bez poznate satnice ne dobivaju izmišljene rokove/satnice. Potonji se izvoze kao cjelodnevni događaji s izričito odabranom satnicom alarma.
- Naslijeđeno iz COURSE_SOURCE_REVIEW: za BU je navedena zamjena 14.11. bez satnice/lokacije. Ne mijenjati raspored bez tih podataka.
- Naslijeđeno iz FINAL_ACCEPTANCE: stvarni cross-device write/refresh/reopen/conflict/offline, native PWA/Safari/performance, cloud restore/recovery i nedostajuća brojčana pravila bodovanja ostaju zasebne faze.
- Nakon uvođenja stanja excused stari frontend ga ne zna čitati. Otvoreni tab/PWA mora učitati novu verziju; za rollback koristiti kompatibilan frontend, ne prepisivati osobnu evidenciju.

Ova evidencija razlikuje opažene i popravljene probleme od preventivno pokrivenih rubnih slučajeva i otvorenih stvarnih device provjera. Nema tvrdnje o novom sigurnosnom auditu ili potvrđenoj isporuci mobilnih alarma.

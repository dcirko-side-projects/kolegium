# TASK-009C — pregled nastavnih izvora 15.10.2026.

## Dopuna korisnika 19.10.2026. — primijenjeno

- Projektiranje inovacija: seminar **FoodLoop – predviđanje i smanjenje bacanja hrane**. Sustav za restorane, pekarnice, menze i trgovine spaja predviđanje potražnje s pravovremenom prodajom ili donacijom viškova; cilj su manji financijski gubici, manje otpada i održivije poslovanje. Opis je spremljen u postojeći kolegij i dodan jedan projekt/seminar bez izmišljenog roka ili bodova.
- Vježbe inovacija ubuduće su utorkom **17:30–19:00**; četvrtkom ostaju postojeća predavanja. Druge buduće grupe vježbi otkazane su. Četrnaest novih termina prati postojeće nastavne tjedne (20.10.–15.12. i 5.1.–2.2.); pauze nisu popunjene, učionica je nepoznata. Prošli termini ostaju neizmijenjeni.
- PHP/Web: postojeći **AutoDnevnik** i individualni seminar **REST vs SOAP** ostaju isti izvori. Korisnik izričito potvrđuje oslobođenje od predavanja i vježbi. Time je za njegov odabrani put razriješena ranija nejasnoća opće odredbe dolaznosti; buduća PHP nastava otkazana je, bez izmišljanja brojčanog minimuma 0.
- Bihevioralno: postojeći seminar preimenovan u **Toksično okruženje u tvrtkama** (radna tema; tim 4); usklađen naziv iste canonical aktivnosti. To nije potvrda nastavnice o konačnom naslovu.

Izvedba: stvarna browser Google prijava i course/project spremanja; zatim izričito odobren administrativni pristup konkretnom Firebase projektu, validirani backup i jedan atomic commit s root/document updateTime preconditions, revizijama i server timestamps. Dva PHP termina prethodno otkazana kroz UI, preostala 52 buduća termina otkazana atomarno uz 14 novih i jednu name-only izmjenu scoreActivity. Puni readback svih kolekcija/payloadova/revizija i nepromijenjenih zapisa PASS; dataRevision=17. Završni read-only plan: 0 operacija. Evidencija sada ima 188 sessions (uključuje sačuvane otkazane), 5 projekata, 2 assessments i 6 scoreActivities. Privatni dokazi/backupi u ignoriranom artifacts/completion-2026-10-19/. Nema schema/Rules/deploy promjene, novih pokušaja, ocjena ili zadataka.

Brojčana pravila bodovanja i preostali attendance ugovori i dalje nedostaju: TASK-009C nije puni Done. Ostatak dokumenta opisuje izvore od 15.10.; ova dopuna ima prednost gdje se podaci razlikuju.

Status: **sadržaj upisan u cloud i puni readback potvrđen** 15.10.2026. nakon korisnikova suženja opsega. Pet course updates + 12 novih domain zapisa (četiri projects, dva assessments, šest scoreActivities), bez tasks. Automatska provjera isprva je odbila miješanu plan/write skriptu; zatim je dopušten zaseban stvarno read-only plan te konkretna --apply write akcija za suženi nalog. Ovo nije OAuth/device dokaz niti odobrenje deploya.

## Izvori i pregled

| Kolegij | Izvor | Obuhvat |
|---|---|---|
| Web servisi | Uvodno predavanje (16).pdf | 29 PDF stranica; pravila, izabrani i alternativni put, seminar, bodovanje, ocjene i Kahoot |
| Web servisi | Dostavljeni ZIP | Jedini sadržaj je ntpws-readme.md, 16.967 bytes; svih 18 poglavlja projektnih uputa pročitano, ništa iz arhive nije izvršavano |
| Web servisi | Korisnikova izjava i screenshot upisa | Preuzet samo korisnikov redak, bez drugih studenata, identifikatora ili kontakata |
| RMA | 0. RMA - Info i polaganje kolegija (1).pdf | 26 PDF stranica; odabrani projektni put odvojen od alternativnih putova i primjera |
| Bihevioralno upravljanje | Bihevioralno_upravljanje_UVODNO_FINAL_prosireno (1).pdf | 29 PDF stranica; dolaznost, dva kolokvija, seminar, prvi zadatak i sadržaj |
| NoSQL/BDA | Uvod_NOSQL_BDA_Klepac.pdf | 164 PDF stranice; tekst i kontaktni pregled svih renderiranih stranica; gradivo i primjeri, bez pravila polaganja |
| Projektiranje inovacija | Naknadno dostavljen screenshot „Formiranje timova i teme” | Objavljeno 8.10.2026.; rok iz tijela poruke 15.10.2026., najviše četiri člana |

Ekstrakcija je označena fizičkim brojem PDF stranice, ne otisnutim brojem slajda. Ključne Web str. 26/27, Bihevioralno 7/8 i RMA 11 dodatno su renderirane i vizualno pregledane. Hash manifest, ekstrakcije, rendere i točan content-plan.json čuvaju ignored artifacts/courses/2026-10-15/. Pristupna lozinka iz Web PDF-a nije prenesena u informacije, dokumentaciju ili cloud payload. Ne kopirati privatne identifikatore sa screenshota.

## Potvrđeno i ostavljeno otvoreno

### Web servisi

- Izabrani veliki projekt: AutoDnevnik; screenshot Grupa 09/status OK potvrđuje prijavu teme, ne dovršenost. Seminar o usporedbi REST i SOAP servisa individualan je.
- PDF str. 26: projekt 70 %, prezentacija projekta/seminar zajedno 30 %, prolaz ≥60 %. Alternativni put 20 % zadaci / 20 % projekt / 60 % ispit nije korisnikov odabir i nije dodan kao obaveza.
- PDF str. 27: ocjene 90–100→5, 80–89→4, 70–79→3, 60–69→2, <60→1. Decimalne granice i zaokruživanje nisu riješeni. Ne uvoditi poluotvorene intervale ili raw 70/30 bodova bez dogovora/izvora.
- ZIP izričito traži PHP backend, relacijsku bazu, javni frontend, CMS vijesti i kategorija, korisničke uloge, REST API, JSON ili XML, schemu, vanjski API, sigurnost, kontinuiran GitHub, dokumentaciju, testove i obranu. Te obaveze vrijede i kada osobna tema nije portal vijesti.
- PDF str. 10 oslobađa projektne studente dolazaka i tjednih zadataka; str. 27 općenito traži redovite dolaske. Odabrani projektni put i iznimka jasno su zabilježeni; primjena opće odredbe unresolved. Ne mijenjati attendanceRules u total/minimum=0.
- Kahoot ≥35 % jest pravilo priznavanja prisutnosti pri evidenciji kvizom, nije prag prolaza kolegija.

### Razvoj mobilnih aplikacija

- Korisnik odabrao izradu mobilne aplikacije; tema/tehnologija/opseg još nisu određeni. Str. 11 dopušta bilo koju mobilnu tehnologiju uz individualni dogovor s nastavnicom.
- Prijave kroz akademsku godinu; izrada i polaganje mogu poslije semestra. Nema izmišljenog fiksnog roka, bodova, skale ocjena ili minimuma dolaznosti.
- Prezentacija, istraživački rad i natjecanje alternativni su putovi, ne dodatne obaveze odabranog projekta. 2.11. odnosi se na prijavu prezentacije; MIPRO 2025./2026. datumi nisu aktualni rokovi osobnog projekta.

### Bihevioralno upravljanje

- Str. 7: 50 % dolaznosti, seminarski rad/prezentacija i aktivno sudjelovanje; kolokviji 4.12.2026. i 5.2.2027. Satnice, bodovi i pravilo agregiranja dolaznosti nisu navedeni.
- Korisnik: četiri člana tima, radna tema toksično okruženje u firmi. Ne predstavljati radni naslov kao službeno odobren.
- Str. 17: prvi zadatak 15 članaka i unos u Mendeley; rok nepoznat.
- Str. 8: subota 14.11. zamjenjuje 20.11. i 27.11.; nedostaje satnica/lokacija. Zabilježena razlika prema ICS-u; raspored i recorded snapshotovi ostaju netaknuti do potvrde konkretne korekcije. „16.10. odrađeno” nije dokaz korisnikove prisutnosti.

### Projektiranje inovacija

- Slika: tim do četiri člana, razmisliti o temi i prijaviti tim/područje inovacije do 15.10.2026. Nije naveden sat roka ili potvrda obavljenog.
- „[ARHIVA] / traje do 11.10. u 23h” je metapodatak objave. Kao rok prijave korišten je eksplicitni 15. listopada iz tijela, bez arhiviranja kolegija.
- Tema, članovi, bodovi, uvjeti dolaznosti i detalji projekta ostaju prazni. Predložen je samo postojeći Project zapis kao organizacijski spremnik; ne tvrdi da je tema odobrena ili da postoji objavljen bodovni kriterij.

### NoSQL i napredna big data analitika

- Dostavljeni materijal obrađuje poslovno odlučivanje, izvore/obradu podataka, vrijednost kupca, rano upozorenje/SNA/text mining, fraud detection, Benford/ekstreme, ekspertne/fuzzy modele i multimedijske preporuke.
- Zadaci 4 (str. 133) i 5 (str. 163) navedeni su u informacijama, bez izmišljene bodovanosti ili rokova i bez automatskih zadataka za predaju.
- Nema podataka o polaganju, bodovima, dolaznosti, osobnoj temi ili seminaru. Sve ostaje prazno. Brojevi unutar statističkih primjera nisu pravila ocjenjivanja.

## Konačni data ugovor i opseg upisa

Koristiti postojeću schema v1; nema production codea, dependencyja, Rules promjene ili nove kolekcije. Pet information polja ima prilagođene tekstualne sekcije po kolegiju i prazna mjesta za nepoznate informacije; postojeći Uredi kolegij omogućuje dopunu. Sigurne http/https poveznice dolaze iz materijala. Brojčani max/min ostaju null i dostupni postojećim formama za bodovanje/dolaznost.

Korisnik je nakon pitanja izričito isključio prijavu/Mendeley zadatke i potvrdio odabrani projektni put za RMA te veliki projekt+seminar bez nastave za Web. Neodabrani putovi nisu njegove dodatne obaveze. RMA je u odgovoru nazvao „3. odabir”, dok PDF numerira projekt kao 4.; značenje izbora je vlastita mobilna aplikacija, ne natjecanje, pa redni broj nije korišten kao poslovno pravilo.

Izvršeni opseg:

- Dopuniti information/links pet postojećih courses, uz očuvanje name/semesterId/archive/attendanceRules.
- Dodati četiri projects organizacijska zapisa (Web projekt, Web seminar, RMA projekt, Bihevioralno seminar), bez izmišljenih rokova. Za inovacije i NoSQL nije otvoren projekt bez potvrđene teme/puta.
- Dodati dva assessments za potvrđene kolokvije Bihevioralnog, scheduledAt=null.
- Ne dodavati tasks: korisnik je izričito isključio prijavu i Mendeley. Izvorne informacije o njima ostaju u tekstualnom pregledu kolegija, bez otvorenih taskova ili tvrdnje o dovršenosti.
- Šest canonical scoreActivities za četiri poznata projektna/seminarska izvora i dva kolokvija; max/min/componentKey=null, bez pokušaja ili ocjene. Za inovacijsko rješenje ne dodavati bodovnu aktivnost bez pravila.

Ukupno pet izmjena i 12 novih domain zapisa, plus jedan root dataRevision update u istom commitu. GradingRules, scoreAttempts i courseOutcomes ostaju bez izmišljenih konfiguracija/rezultata; svi izvorni postoci i skala dostupni su tekstualno. Puni automatski FR-015 za stvarne kolegije ostaje djelomičan. U postojećem engineu nedostaje potvrđena normalizacija pondera/decimalnih granica i postoji ukupni limit šest komponenti+intervala; ne proširivati ugovor ili skraćivati pravila u sklopu ovog unosa.

## Izvršene zaštite i dokazi

Read-only inspect prije pripreme potvrdio je pet kolegija s praznim information/links, 174 sessions, četiri installments i bez projekata/kolokvija/bodovnih aktivnosti. Izmjene od 11.10. ostaju necommitirane i očuvane. Lokalna domain/backup-graph provjera konačnog scopea PASS. Zaseban read-only plan PASS: 5 updates / 12 creates / 0 tasks. Prije upisa ponovno pročitan i validiran puni graf, odbijen neočekivani postojeći sadržaj/duplikati, provjeren nezaključan aktivni dataset, spremljen domain backup; create-only za nove zapise i updateTime/revision preconditions za postojeće/root. Atomic commit PASS, root dataRevision=4. Puni readback svih kolekcija/refs/payloadova i revizija promijenjenih zapisa PASS, uspoređene i sve nepromijenjene kolekcije. Nije korišten restore ili aktivirana nova generacija; raspored/rate nisu ponovno seedani. Backup i sanitized rezultat su ignored artifacts/courses/2026-10-15/before-cloud-*.json i cloud-result-*.json.

Read-only inspect jest administrativni dokaz trenutnog sadržaja, nije browser OAuth ili cross-device dokaz. Nema novog commita/pusha/deploya/naplate.

Završni zaseban read-only plan nakon upisa: **0 updates / 0 creates**, potvrđuje da isti sadržaj ne bi ponovno stvarao obaveze ili mijenjao kolegije.

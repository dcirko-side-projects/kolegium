import {
  Firestore,
  Timestamp,
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  query,
  orderBy,
  documentId,
  limit,
  startAfter,
  runTransaction,
  serverTimestamp,
  writeBatch,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { AcademicRepository } from './academic.repository';
import {
  BackupEnvelope,
  BackupRow,
  backupCollections,
  backupRecords,
  validateBackup,
  canonical,
} from '../domain/backup';
import { ApplicationError, asApplicationError } from '../core/errors/application-error';
import { recordId } from '../domain/academic.validation';
export interface RestoreTicket {
  uid: string;
  oldId: string;
  newId: string;
  token: string;
}
export type RestorePhase =
  'locked' | 'uploaded' | 'frozen' | 'verified' | 'beforeCommit' | 'committed' | 'exportRead';
export class BackupRepository {
  constructor(
    private readonly db: Firestore,
    private readonly online: () => boolean = () => true,
    private readonly checkpoint: (phase: RestorePhase) => Promise<void> = async () => {},
  ) {}
  private connected() {
    if (!this.online())
      throw new ApplicationError(
        'offline',
        'Sigurnosna kopija i povrat zahtijevaju internetsku vezu.',
      );
  }
  private root(uid: string) {
    return doc(this.db, 'users', recordId(uid));
  }
  private dataset(uid: string, id: string) {
    return doc(this.db, 'users', recordId(uid), 'datasets', recordId(id));
  }
  private async read(uid: string, dataset: string) {
    this.connected();
    const collections = {} as BackupEnvelope['collections'];
    let count = 0;
    for (const name of backupCollections) {
      const rows: BackupRow[] = [];
      if (name === 'preferences' || name === 'thesis') {
        const snap = await getDocFromServer(
          doc(
            this.db,
            'users',
            uid,
            'datasets',
            dataset,
            name,
            name === 'preferences' ? 'app' : 'main',
          ),
        );
        if (snap.exists()) {
          const raw = snap.data();
          if (
            raw['id'] !== snap.id ||
            !Number.isSafeInteger(raw['revision']) ||
            raw['revision'] < 1 ||
            !(raw['updatedAt'] instanceof Timestamp)
          )
            throw new ApplicationError('invalidBackup', 'Podatke nije moguće sigurno izvesti.');
          const { revision, updatedAt, ...payload } = raw;
          void revision;
          void updatedAt;
          rows.push(payload as BackupRow);
          count++;
        }
        collections[name] = rows;
        continue;
      }
      let cursor: QueryDocumentSnapshot | undefined;
      do {
        const base = collection(this.db, 'users', uid, 'datasets', dataset, name);
        const page = await getDocsFromServer(
          query(base, orderBy(documentId()), ...(cursor ? [startAfter(cursor)] : []), limit(50)),
        );
        for (const snapshot of page.docs) {
          const raw = snapshot.data();
          if (
            raw['id'] !== snapshot.id ||
            !Number.isSafeInteger(raw['revision']) ||
            raw['revision'] < 1 ||
            !(raw['updatedAt'] instanceof Timestamp)
          )
            throw new ApplicationError('invalidBackup', 'Podatke nije moguće sigurno izvesti.');
          const { revision, updatedAt, ...payload } = raw;
          void revision;
          void updatedAt;
          rows.push(payload as BackupRow);
          if (++count > backupRecords)
            throw new ApplicationError(
              'invalidBackup',
              'Kopija prelazi ograničenje od 10.000 zapisa.',
            );
        }
        cursor = page.size === 50 ? page.docs.at(-1) : undefined;
      } while (cursor);
      collections[name] = rows;
    }
    return validateBackup({
      format: 'kolegium-backup',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      collections,
    });
  }
  async export(uid: string, previous = false): Promise<BackupEnvelope> {
    const repo = new AcademicRepository(this.db, this.online),
      before = await repo.readControl(uid);
    if (before.restoreToken)
      throw new ApplicationError('restoreInProgress', 'Najprije dovrši ili prekini povrat.');
    const dataset = previous ? before.previousDatasetId : before.activeDatasetId;
    if (!dataset) throw new ApplicationError('notFound', 'Prethodna kopija još ne postoji.');
    const result = await this.read(uid, dataset),
      after = await (async () => {
        await this.checkpoint('exportRead');
        return repo.readControl(uid);
      })();
    if (
      before.activeDatasetId !== after.activeDatasetId ||
      before.previousDatasetId !== after.previousDatasetId ||
      before.dataRevision !== after.dataRevision ||
      after.restoreToken
    )
      throw new ApplicationError(
        'conflict',
        'Podaci su se promijenili tijekom izvoza. Ponovi izvoz.',
      );
    return result;
  }
  async start(uid: string, expectedRevision: number): Promise<RestoreTicket> {
    this.connected();
    const token = crypto.randomUUID(),
      newId = crypto.randomUUID();
    let oldId = '';
    await runTransaction(this.db, async (tx) => {
      const root = await tx.get(this.root(uid)),
        r = root.data();
      if (!r) throw new ApplicationError('notFound', 'Podaci nisu pronađeni.');
      if (r['restoreToken'] !== null)
        throw new ApplicationError('restoreInProgress', 'Povrat je već u tijeku.');
      if (r['dataRevision'] !== expectedRevision)
        throw new ApplicationError(
          'conflict',
          'Podaci su se promijenili. Osvježi ih i ponovno potvrdi povrat.',
        );
      oldId = recordId(r['activeDatasetId']);
      tx.update(root.ref, {
        restoreToken: token,
        stagingDatasetId: newId,
        dataRevision: expectedRevision + 1,
        updatedAt: serverTimestamp(),
      });
      tx.set(this.dataset(uid, newId), {
        schemaVersion: 1,
        state: 'staging',
        createdAt: serverTimestamp(),
      });
    });
    return { uid, oldId, newId, token };
  }
  private assertTicket(r: Record<string, unknown> | undefined, t: RestoreTicket) {
    if (
      !r ||
      r['activeDatasetId'] !== t.oldId ||
      r['stagingDatasetId'] !== t.newId ||
      r['restoreToken'] !== t.token
    )
      throw new ApplicationError(
        'conflict',
        'Povrat je prekinut ili ga je promijenio drugi uređaj.',
      );
  }
  async upload(
    t: RestoreTicket,
    input: BackupEnvelope,
    progress: (done: number, total: number) => void = () => {},
  ) {
    const backup = validateBackup(input);
    let done = 0;
    const total = backupCollections.reduce((n, c) => n + backup.collections[c].length, 0);
    for (const name of backupCollections) {
      const rows = [...backup.collections[name]];
      if (name === 'sessions') {
        const ordered: BackupRow[] = [],
          pending = new Map(rows.map((r) => [r.id, r]));
        while (pending.size) {
          let moved = false;
          for (const [id, row] of pending)
            if (row['replacementForId'] === null || !pending.has(String(row['replacementForId']))) {
              ordered.push(row);
              pending.delete(id);
              moved = true;
            }
          if (!moved) throw new ApplicationError('invalidBackup', 'Nadoknade tvore kružnu vezu.');
        }
        rows.splice(0, rows.length, ...ordered);
      }
      for (const row of rows) {
        this.connected();
        const batch = writeBatch(this.db);
        batch.set(doc(this.db, 'users', t.uid, 'datasets', t.newId, name, row.id), {
          ...row,
          revision: 1,
          updatedAt: serverTimestamp(),
        });
        await batch.commit();
        progress(++done, total);
      }
    }
  }
  async freeze(t: RestoreTicket) {
    this.connected();
    await runTransaction(this.db, async (tx) => {
      const root = await tx.get(this.root(t.uid)),
        stage = await tx.get(this.dataset(t.uid, t.newId));
      this.assertTicket(root.data(), t);
      if (stage.data()?.['state'] !== 'staging')
        throw new ApplicationError('conflict', 'Kopija već prešla u provjeru.');
      tx.update(stage.ref, { state: 'verifying' });
    });
  }
  async verify(t: RestoreTicket, expected: BackupEnvelope) {
    this.connected();
    const actual = await this.read(t.uid, t.newId);
    if (canonical(actual.collections) !== canonical(validateBackup(expected).collections))
      throw new ApplicationError(
        'invalidBackup',
        'Pročitana kopija nije jednaka datoteci. Aktivni podaci nisu promijenjeni.',
      );
  }
  async activate(t: RestoreTicket) {
    this.connected();
    try {
      await runTransaction(this.db, async (tx) => {
        const root = await tx.get(this.root(t.uid)),
          stage = await tx.get(this.dataset(t.uid, t.newId)),
          old = await tx.get(this.dataset(t.uid, t.oldId));
        this.assertTicket(root.data(), t);
        if (stage.data()?.['state'] !== 'verifying' || old.data()?.['state'] !== 'active')
          throw new ApplicationError('conflict', 'Kopija nije spremna za aktivaciju.');
        tx.update(root.ref, {
          activeDatasetId: t.newId,
          previousDatasetId: t.oldId,
          stagingDatasetId: null,
          restoreToken: null,
          dataRevision: root.data()!['dataRevision'] + 1,
          updatedAt: serverTimestamp(),
        });
        tx.update(stage.ref, { state: 'active' });
        tx.update(old.ref, { state: 'retained' });
      });
      await this.checkpoint('committed');
    } catch (error) {
      const root = await new AcademicRepository(this.db, this.online).readControl(t.uid);
      if (root.activeDatasetId === t.newId && root.restoreToken === null) return;
      throw asApplicationError(error);
    }
  }
  async restore(
    uid: string,
    input: BackupEnvelope,
    expectedRevision: number,
    progress: (done: number, total: number) => void = () => {},
  ) {
    const backup = validateBackup(input),
      ticket = await this.start(uid, expectedRevision);
    await this.checkpoint('locked');
    await this.upload(ticket, backup, progress);
    await this.checkpoint('uploaded');
    await this.freeze(ticket);
    await this.checkpoint('frozen');
    await this.verify(ticket, backup);
    await this.checkpoint('verified');
    await this.checkpoint('beforeCommit');
    await this.activate(ticket);
    return ticket.newId;
  }
  async abort(uid: string) {
    this.connected();
    await runTransaction(this.db, async (tx) => {
      const root = await tx.get(this.root(uid)),
        r = root.data();
      if (!r?.['restoreToken'] || !r['stagingDatasetId'])
        throw new ApplicationError('conflict', 'Povrat više nije u tijeku.');
      const stage = await tx.get(this.dataset(uid, r['stagingDatasetId']));
      if (!['staging', 'verifying'].includes(stage.data()?.['state']))
        throw new ApplicationError('conflict', 'Kopija nije u povratu.');
      tx.update(root.ref, {
        restoreToken: null,
        stagingDatasetId: null,
        dataRevision: r['dataRevision'] + 1,
        updatedAt: serverTimestamp(),
      });
      tx.update(stage.ref, { state: 'abandoned' });
    });
  }
  async orphans(uid: string): Promise<string[]> {
    this.connected();
    const root = await new AcademicRepository(this.db, this.online).readControl(uid),
      metadata = await getDocsFromServer(collection(this.db, 'users', uid, 'datasets'));
    return metadata.docs
      .filter(
        (d) =>
          !['active', 'staging', 'verifying'].includes(d.data()['state']) &&
          ![root.activeDatasetId, root.previousDatasetId, root.stagingDatasetId].includes(d.id),
      )
      .map((d) => d.id);
  }
  async cleanup(uid: string, id: string) {
    this.connected();
    const safe = async () => {
      const root = await new AcademicRepository(this.db, this.online).readControl(uid),
        meta = await getDocFromServer(this.dataset(uid, id));
      if (
        [root.activeDatasetId, root.previousDatasetId, root.stagingDatasetId].includes(id) ||
        !['abandoned', 'retained'].includes(meta.data()?.['state'])
      )
        throw new ApplicationError(
          'forbidden',
          'Aktivnu, prethodnu ili staging kopiju nije dopušteno brisati.',
        );
    };
    await safe();
    for (const name of backupCollections) {
      let more = true;
      while (more) {
        const page = await getDocsFromServer(
          query(collection(this.db, 'users', uid, 'datasets', id, name), limit(5)),
        );
        more = page.size === 5;
        const batch = writeBatch(this.db);
        page.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    }
    await safe();
    const batch = writeBatch(this.db);
    batch.delete(this.dataset(uid, id));
    await batch.commit();
  }
}

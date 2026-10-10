const testing = process.argv[2] === 'test';
const project = testing ? 'demo-kolegium-tests' : 'demo-kolegium',
  port = testing ? 19099 : 9099;
const endpoint = `http://127.0.0.1:${port}/identitytoolkit.googleapis.com/v1/projects/${project}`;
const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer owner' };
const existingResponse = await fetch(`${endpoint}/accounts:lookup`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ localId: ['local-owner'] }),
});
if (!existingResponse.ok) throw new Error('Start the local Auth emulator before seeding.');
const existing = await existingResponse.json();
if (existing.users?.length) {
  const owner = existing.users[0];
  if (
    owner.localId !== 'local-owner' ||
    owner.email !== 'owner@example.test' ||
    !owner.providerUserInfo?.some(
      (provider) => provider.providerId === 'google.com' && provider.rawId === 'local-owner-google',
    )
  )
    throw new Error('Existing local account differs from the fixture; no account was overwritten.');
  console.log(`Synthetic Google account already exists in ${project}. No data changed.`);
  process.exit(0);
}
const response = await fetch(`${endpoint}/accounts:batchCreate`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    users: [
      {
        localId: 'local-owner',
        email: 'owner@example.test',
        emailVerified: true,
        displayName: 'Lokalni testni račun',
        providerUserInfo: [
          {
            providerId: 'google.com',
            rawId: 'local-owner-google',
            email: 'owner@example.test',
            displayName: 'Lokalni testni račun',
          },
        ],
      },
    ],
  }),
});
if (!response.ok)
  throw new Error(
    `Local Auth seed failed (${response.status}). Start the ${testing ? 'test' : 'development'} emulators first.`,
  );
const result = await response.json();
if (result.error?.length) throw new Error('Local Auth seed rejected a fixture.');
console.log(`Synthetic Google account ready in ${project}. No academic data seeded.`);

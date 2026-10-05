// In-memory store used when MSSQL_CONNECTION_STRING is not set (tests, quick demos).
// Data is lost when the process stops.
import initialState from '../seed.js';

export function createMemoryRepo() {
  const state = initialState();
  const users = [];
  const sessions = new Map();
  let queue = Promise.resolve();
  const kinds = ['artists', 'styles', 'services', 'portfolio', 'blog'];

  const tx = {
    saveStudio(studio) { state.studio = structuredClone(studio); },
    save(kind, item) {
      if (!kinds.includes(kind)) throw new Error('Unknown kind ' + kind);
      const index = state[kind].findIndex(x => x.id === item.id);
      if (index >= 0) state[kind][index] = structuredClone(item); else state[kind].push(structuredClone(item));
    },
    remove(kind, id) { state[kind] = state[kind].filter(x => x.id !== id); },
    insertBooking(booking) { state.bookings.unshift(structuredClone(booking)); },
    updateBooking(booking) {
      const index = state.bookings.findIndex(x => x.id === booking.id);
      state.bookings[index] = structuredClone(booking);
    }
  };

  return {
    kind: 'memory',
    async read() { return structuredClone(state); },
    // Writes run one at a time so availability checks and inserts cannot interleave.
    mutate(fn) {
      const run = queue.then(() => fn(structuredClone(state), tx));
      queue = run.catch(() => {});
      return run;
    },
    async countUsers() { return users.length; },
    async createUser(username, salt, hash) { users.push({ id: users.length + 1, username, salt, hash }); },
    async findUser(username) { return users.find(u => u.username === username) || null; },
    async createSession(token, userId, expiresAt) {
      for (const [key, value] of sessions) if (value.expiresAt < Date.now()) sessions.delete(key);
      sessions.set(token, { userId, expiresAt });
    },
    async validSession(token) { const s = sessions.get(token); return !!s && s.expiresAt > Date.now(); },
    async deleteSession(token) { sessions.delete(token); }
  };
}

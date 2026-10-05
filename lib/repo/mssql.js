// Microsoft SQL Server store. Tables are defined in db/schema.sql.
import sql from 'mssql';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import initialState from '../seed.js';

const list = value => (value ? String(value).split(',').filter(Boolean) : []);
const dayList = value => list(value).map(Number);

// Column mapping for admin-managed content: kind -> table and fields written on save.
const tables = {
  styles: { table: 'TattooStyles', columns: s => ({ Name: s.name, Description: s.description || '' }) },
  artists: { table: 'Artists', columns: a => ({ Name: a.name, Specialty: a.specialty, Years: a.years, Bio: a.bio || '', Image: a.image || '', WorkDays: a.workDays.join(','), DaysOff: a.daysOff.join(','), Visible: !!a.visible }) },
  services: { table: 'Services', columns: s => ({ Name: s.name, Price: s.price, Description: s.description || '', Duration: s.duration, Visible: !!s.visible }) },
  portfolio: { table: 'PortfolioItems', columns: p => ({ ArtistId: p.artistId, StyleId: p.styleId, Title: p.title, Placement: p.placement, Image: p.image || '', Description: p.description || '', Gradient: p.gradient || '', Visible: !!p.visible }) },
  blog: { table: 'BlogPosts', columns: b => ({ Title: b.title, Tag: b.tag, Excerpt: b.excerpt, Content: b.content, Visible: !!b.visible }) }
};

function request(target, params = {}) {
  const r = target.request ? target.request() : new sql.Request(target);
  // SQL types are inferred from JS values (string -> NVARCHAR, epoch ms -> BIGINT, boolean -> BIT).
  for (const [key, value] of Object.entries(params)) r.input(key, value);
  return r;
}

function databaseName(connectionString) {
  const part = connectionString.split(';').map(p => p.split('=')).find(([k]) => /^\s*(database|initial catalog)\s*$/i.test(k));
  return part?.[1]?.trim();
}

async function connect(connectionString) {
  try {
    return await new sql.ConnectionPool(connectionString).connect();
  } catch (error) {
    // 4060: database does not exist yet. Create it from master, then reconnect.
    const name = databaseName(connectionString);
    if (error.originalError?.info?.number !== 4060 && !/Cannot open database/i.test(error.message)) throw error;
    if (!name || !/^[A-Za-z0-9_]+$/.test(name)) throw error;
    const master = await new sql.ConnectionPool(connectionString.replace(/(database|initial catalog)\s*=\s*[^;]+/i, 'Database=master')).connect();
    await master.request().query(`IF DB_ID(N'${name}') IS NULL CREATE DATABASE [${name}]`);
    await master.close();
    return await new sql.ConnectionPool(connectionString).connect();
  }
}

async function readAll(target) {
  const { recordsets: [studios, styles, artists, artistStyles, services, portfolio, blog, bookings, history] } = await request(target).query(`
    SELECT * FROM dbo.Studios WHERE Id = 1;
    SELECT Id, Name, Description FROM dbo.TattooStyles ORDER BY Seq;
    SELECT Id, Name, Specialty, Years, Bio, Image, WorkDays, DaysOff, Visible FROM dbo.Artists ORDER BY Seq;
    SELECT ArtistId, StyleId FROM dbo.ArtistStyles ORDER BY ArtistId, Position;
    SELECT Id, Name, Price, Description, Duration, Visible FROM dbo.Services ORDER BY Seq;
    SELECT Id, ArtistId, StyleId, Title, Placement, Image, Description, Gradient, Visible FROM dbo.PortfolioItems ORDER BY Seq;
    SELECT Id, Title, Tag, Excerpt, Content, Visible FROM dbo.BlogPosts ORDER BY Seq;
    SELECT Id, ArtistId, ServiceId, CustomerName, Phone, Email, CONVERT(char(10), BookingDate, 23) AS BookingDate, StartTime, Duration, Placement, Size, Notes, Reference, Status, CreatedAt FROM dbo.Bookings ORDER BY CreatedAt DESC;
    SELECT BookingId, Status, Action, FromSlot, ToSlot, At FROM dbo.BookingHistory ORDER BY Id;`);
  const s = studios[0];
  return {
    studio: s && { name: s.Name, logo: s.Logo, address: s.Address, phone: s.Phone, email: s.Email, social: s.Social, hours: s.Hours, heroTitle: s.HeroTitle, heroText: s.HeroText, about: s.About, policy: s.Policy, openTime: s.OpenTime.trim(), closeTime: s.CloseTime.trim(), slotStep: s.SlotStep, openDays: dayList(s.OpenDays) },
    styles: styles.map(x => ({ id: x.Id, name: x.Name, description: x.Description })),
    artists: artists.map(x => ({ id: x.Id, name: x.Name, specialty: x.Specialty, years: x.Years, bio: x.Bio, image: x.Image, workDays: dayList(x.WorkDays), daysOff: list(x.DaysOff), visible: x.Visible, styleIds: artistStyles.filter(l => l.ArtistId === x.Id).map(l => l.StyleId) })),
    services: services.map(x => ({ id: x.Id, name: x.Name, price: x.Price, description: x.Description, duration: x.Duration, visible: x.Visible })),
    portfolio: portfolio.map(x => ({ id: x.Id, artistId: x.ArtistId, styleId: x.StyleId, title: x.Title, placement: x.Placement, image: x.Image, description: x.Description, gradient: x.Gradient, visible: x.Visible })),
    blog: blog.map(x => ({ id: x.Id, title: x.Title, tag: x.Tag, excerpt: x.Excerpt, content: x.Content, visible: x.Visible })),
    bookings: bookings.map(x => ({
      id: x.Id, artistId: x.ArtistId, serviceId: x.ServiceId, customerName: x.CustomerName, phone: x.Phone, email: x.Email, date: x.BookingDate, time: x.StartTime.trim(), duration: x.Duration, placement: x.Placement, size: x.Size, notes: x.Notes, reference: x.Reference, status: x.Status, createdAt: x.CreatedAt.toISOString(),
      history: history.filter(h => h.BookingId === x.Id).map(h => h.Action ? { action: h.Action, from: h.FromSlot, to: h.ToSlot, at: h.At.toISOString() } : { status: h.Status, at: h.At.toISOString() })
    }))
  };
}

function writer(t) {
  const bookingColumns = b => ({ ArtistId: b.artistId, ServiceId: b.serviceId, CustomerName: b.customerName, Phone: b.phone, Email: b.email || '', BookingDate: b.date, StartTime: b.time, Duration: b.duration, Placement: b.placement, Size: b.size || '', Notes: b.notes, Reference: b.reference || '', Status: b.status });
  async function upsert(table, id, columns) {
    const names = Object.keys(columns);
    await request(t, { id, ...columns }).query(`
      UPDATE dbo.${table} SET ${names.map(n => `${n} = @${n}`).join(', ')} WHERE Id = @id;
      IF @@ROWCOUNT = 0 INSERT INTO dbo.${table} (Id, ${names.join(', ')}) VALUES (@id, ${names.map(n => '@' + n).join(', ')});`);
  }
  async function writeHistory(booking) {
    await request(t, { id: booking.id }).query('DELETE FROM dbo.BookingHistory WHERE BookingId = @id');
    for (const h of booking.history) {
      await request(t, { id: booking.id, status: h.status ?? null, action: h.action ?? null, from: h.from ?? null, to: h.to ?? null, at: new Date(h.at) })
        .query('INSERT INTO dbo.BookingHistory (BookingId, Status, Action, FromSlot, ToSlot, At) VALUES (@id, @status, @action, @from, @to, @at)');
    }
  }
  return {
    async saveStudio(s) {
      await upsert('Studios', 1, { Name: s.name, Logo: s.logo || '', Address: s.address, Phone: s.phone, Email: s.email, Social: s.social || '', Hours: s.hours || '', HeroTitle: s.heroTitle, HeroText: s.heroText || '', About: s.about || '', Policy: s.policy, OpenTime: s.openTime, CloseTime: s.closeTime, SlotStep: s.slotStep, OpenDays: s.openDays.join(',') });
    },
    async save(kind, item) {
      const { table, columns } = tables[kind];
      await upsert(table, item.id, columns(item));
      if (kind === 'artists') {
        await request(t, { id: item.id }).query('DELETE FROM dbo.ArtistStyles WHERE ArtistId = @id');
        for (const [position, styleId] of item.styleIds.entries()) await request(t, { id: item.id, styleId, position }).query('INSERT INTO dbo.ArtistStyles (ArtistId, StyleId, Position) VALUES (@id, @styleId, @position)');
      }
    },
    async remove(kind, id) { await request(t, { id }).query(`DELETE FROM dbo.${tables[kind].table} WHERE Id = @id`); },
    async insertBooking(b) {
      const columns = bookingColumns(b);
      await request(t, { id: b.id, ...columns, CreatedAt: new Date(b.createdAt) }).query(`INSERT INTO dbo.Bookings (Id, ${Object.keys(columns).join(', ')}, CreatedAt) VALUES (@id, ${Object.keys(columns).map(n => '@' + n).join(', ')}, @CreatedAt)`);
      await writeHistory(b);
    },
    async updateBooking(b) {
      const columns = bookingColumns(b);
      await request(t, { id: b.id, ...columns }).query(`UPDATE dbo.Bookings SET ${Object.keys(columns).map(n => `${n} = @${n}`).join(', ')} WHERE Id = @id`);
      await writeHistory(b);
    }
  };
}

export async function createMssqlRepo(connectionString) {
  const pool = await connect(connectionString);
  const schema = readFileSync(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8');
  for (const batch of schema.split(/^\s*GO\s*$/im).map(b => b.trim()).filter(Boolean)) await pool.request().batch(batch);

  async function mutate(fn) {
    const t = new sql.Transaction(pool);
    await t.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);
    try {
      // One writer at a time across all app instances: availability is checked and the booking
      // inserted under the same lock, so two customers cannot take overlapping slots.
      await request(t).query("DECLARE @r INT; EXEC @r = sp_getapplock @Resource = N'inkline-write', @LockMode = N'Exclusive', @LockOwner = N'Transaction', @LockTimeout = 15000; IF @r < 0 THROW 50001, N'Write lock timeout', 1;");
      const result = await fn(await readAll(t), writer(t));
      await t.commit();
      return result;
    } catch (error) {
      await t.rollback().catch(() => {});
      throw error;
    }
  }

  await mutate(async (state, tx) => {
    if (state.studio) return;
    const seed = initialState();
    await tx.saveStudio(seed.studio);
    for (const kind of ['styles', 'artists', 'services', 'portfolio', 'blog']) for (const item of seed[kind]) await tx.save(kind, item);
  });

  return {
    kind: 'mssql',
    read: () => readAll(pool),
    mutate,
    async countUsers() { return (await pool.request().query('SELECT COUNT(*) AS n FROM dbo.Users')).recordset[0].n; },
    async createUser(username, salt, hash) { await request(pool, { username, salt, hash }).query('INSERT INTO dbo.Users (Username, Salt, PasswordHash) VALUES (@username, @salt, @hash)'); },
    async findUser(username) {
      const row = (await request(pool, { username }).query('SELECT Id, Username, Salt, PasswordHash FROM dbo.Users WHERE Username = @username')).recordset[0];
      return row ? { id: row.Id, username: row.Username, salt: row.Salt, hash: row.PasswordHash } : null;
    },
    async createSession(token, userId, expiresAt) {
      await request(pool, { token, userId, expiresAt, now: Date.now() }).query('DELETE FROM dbo.Sessions WHERE ExpiresAt < @now; INSERT INTO dbo.Sessions (Token, UserId, ExpiresAt) VALUES (@token, @userId, @expiresAt)');
    },
    async validSession(token) { return (await request(pool, { token, now: Date.now() }).query('SELECT 1 AS ok FROM dbo.Sessions WHERE Token = @token AND ExpiresAt > @now')).recordset.length > 0; },
    async deleteSession(token) { await request(pool, { token }).query('DELETE FROM dbo.Sessions WHERE Token = @token'); }
  };
}

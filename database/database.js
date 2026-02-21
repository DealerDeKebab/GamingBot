const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'bot.db'));
db.pragma('journal_mode = WAL');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS levels (
      user_id TEXT NOT NULL, guild_id TEXT NOT NULL,
      xp INTEGER DEFAULT 0, level INTEGER DEFAULT 0,
      messages INTEGER DEFAULT 0, last_xp INTEGER DEFAULT 0,
      PRIMARY KEY (user_id, guild_id)
    );
    CREATE TABLE IF NOT EXISTS warns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL, guild_id TEXT NOT NULL,
      moderator_id TEXT NOT NULL, reason TEXT NOT NULL, timestamp INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS birthdays (
      user_id TEXT NOT NULL, guild_id TEXT NOT NULL,
      day INTEGER NOT NULL, month INTEGER NOT NULL, year INTEGER,
      PRIMARY KEY (user_id, guild_id)
    );
    CREATE TABLE IF NOT EXISTS giveaways (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id TEXT UNIQUE, channel_id TEXT NOT NULL, guild_id TEXT NOT NULL,
      prize TEXT NOT NULL, winners INTEGER DEFAULT 1, end_time INTEGER NOT NULL,
      host_id TEXT NOT NULL, participants TEXT DEFAULT '[]',
      ended INTEGER DEFAULT 0, winner_ids TEXT DEFAULT '[]'
    );
    CREATE TABLE IF NOT EXISTS verified (
      user_id TEXT NOT NULL, guild_id TEXT NOT NULL, timestamp INTEGER NOT NULL,
      PRIMARY KEY (user_id, guild_id)
    );
    CREATE TABLE IF NOT EXISTS captcha_pending (
      user_id TEXT NOT NULL, guild_id TEXT NOT NULL,
      code TEXT NOT NULL, attempts INTEGER DEFAULT 0, timestamp INTEGER NOT NULL,
      PRIMARY KEY (user_id, guild_id)
    );
    CREATE TABLE IF NOT EXISTS posted_games (
      game_id TEXT NOT NULL, source TEXT NOT NULL, posted_at INTEGER NOT NULL,
      PRIMARY KEY (game_id, source)
    );
    CREATE TABLE IF NOT EXISTS posted_instagram (
      post_id TEXT PRIMARY KEY, posted_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id TEXT UNIQUE, channel_id TEXT NOT NULL, guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL, content TEXT NOT NULL,
      status TEXT DEFAULT 'pending', upvotes INTEGER DEFAULT 0, downvotes INTEGER DEFAULT 0,
      timestamp INTEGER NOT NULL, admin_response TEXT DEFAULT NULL
    );
    CREATE TABLE IF NOT EXISTS daily_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL, date TEXT NOT NULL,
      type TEXT NOT NULL, target INTEGER NOT NULL,
      progress INTEGER DEFAULT 0, contributors TEXT DEFAULT '{}',
      status TEXT DEFAULT 'active', message_id TEXT DEFAULT NULL
    );
    CREATE TABLE IF NOT EXISTS bets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id TEXT UNIQUE, channel_id TEXT NOT NULL, guild_id TEXT NOT NULL,
      title TEXT NOT NULL, options TEXT NOT NULL, bets_data TEXT DEFAULT '{}',
      end_time INTEGER NOT NULL, creator_id TEXT NOT NULL,
      status TEXT DEFAULT 'active', winner_option TEXT DEFAULT NULL
    );
    CREATE TABLE IF NOT EXISTS temp_voice (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id TEXT UNIQUE NOT NULL,
      owner_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      achievement_id TEXT NOT NULL,
      unlocked_at INTEGER NOT NULL,
      UNIQUE(user_id, guild_id, achievement_id)
    );
    CREATE TABLE IF NOT EXISTS economy (
      user_id TEXT NOT NULL, guild_id TEXT NOT NULL,
      wallet INTEGER DEFAULT 0, bank INTEGER DEFAULT 0,
      last_daily INTEGER DEFAULT 0, streak INTEGER DEFAULT 0,
      PRIMARY KEY (user_id, guild_id)
    );
    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT NOT NULL, guild_id TEXT NOT NULL,
      bio TEXT DEFAULT 'Aucune bio pour le moment... 🎮',
      banner_color TEXT DEFAULT '#5865F2',
      pseudo_rocket_league TEXT DEFAULT '',
      pseudo_cs2 TEXT DEFAULT '',
      pseudo_valorant TEXT DEFAULT '',
      pseudo_league_of_legends TEXT DEFAULT '',
      pseudo_fortnite TEXT DEFAULT '',
      pseudo_minecraft TEXT DEFAULT '',
      PRIMARY KEY (user_id, guild_id)
    );
    CREATE TABLE IF NOT EXISTS raid_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL, timestamp INTEGER NOT NULL,
      members_count INTEGER NOT NULL, action TEXT NOT NULL
    );
  `);
  console.log('✅ Base de données initialisée');
}

const xp = {
  getUser:    (uid, gid) => db.prepare('SELECT * FROM levels WHERE user_id=? AND guild_id=?').get(uid, gid),
  create:     (uid, gid) => db.prepare('INSERT OR IGNORE INTO levels (user_id,guild_id) VALUES(?,?)').run(uid, gid),
  addXP:      (uid, gid, amount) => {
    xp.create(uid, gid);
    db.prepare('UPDATE levels SET xp=xp+?, messages=messages+1, last_xp=? WHERE user_id=? AND guild_id=?')
      .run(amount, Date.now(), uid, gid);
  },
  setLevel:   (uid, gid, level, xpVal) =>
    db.prepare('UPDATE levels SET level=?, xp=? WHERE user_id=? AND guild_id=?').run(level, xpVal, uid, gid),
  leaderboard:(gid, limit=10) =>
    db.prepare('SELECT * FROM levels WHERE guild_id=? ORDER BY level DESC, xp DESC LIMIT ?').all(gid, limit),
  xpForLevel: (level) => Math.floor(100 * Math.pow(1.5, level)),
};

const warn = {
  add:    (uid, gid, mod, reason) =>
    db.prepare('INSERT INTO warns(user_id,guild_id,moderator_id,reason,timestamp) VALUES(?,?,?,?,?)').run(uid,gid,mod,reason,Date.now()),
  list:   (uid, gid) =>
    db.prepare('SELECT * FROM warns WHERE user_id=? AND guild_id=? ORDER BY timestamp DESC').all(uid, gid),
  remove: (id)       => db.prepare('DELETE FROM warns WHERE id=?').run(id),
  clear:  (uid, gid) => db.prepare('DELETE FROM warns WHERE user_id=? AND guild_id=?').run(uid, gid),
};

const birthday = {
  set:   (uid, gid, day, month, year=null) =>
    db.prepare('INSERT OR REPLACE INTO birthdays(user_id,guild_id,day,month,year) VALUES(?,?,?,?,?)').run(uid,gid,day,month,year),
  get:   (uid, gid) => db.prepare('SELECT * FROM birthdays WHERE user_id=? AND guild_id=?').get(uid, gid),
  today: (gid) => {
    const d = new Date();
    return db.prepare('SELECT * FROM birthdays WHERE guild_id=? AND day=? AND month=?').all(gid, d.getDate(), d.getMonth()+1);
  },
  all:   (gid) => db.prepare('SELECT * FROM birthdays WHERE guild_id=?').all(gid),
};

const giveaway = {
  create:     (data) =>
    db.prepare('INSERT INTO giveaways(message_id,channel_id,guild_id,prize,winners,end_time,host_id) VALUES(?,?,?,?,?,?,?)')
      .run(data.messageId, data.channelId, data.guildId, data.prize, data.winners, data.endTime, data.hostId),
  getByMsg:   (msgId) => db.prepare('SELECT * FROM giveaways WHERE message_id=?').get(msgId),
  active:     (gid)   => db.prepare('SELECT * FROM giveaways WHERE guild_id=? AND ended=0').all(gid),
  expired:    ()      => db.prepare('SELECT * FROM giveaways WHERE ended=0 AND end_time<=?').all(Date.now()),
  updatePart: (msgId, parts) =>
    db.prepare('UPDATE giveaways SET participants=? WHERE message_id=?').run(JSON.stringify(parts), msgId),
  end:        (msgId, winnerIds) =>
    db.prepare('UPDATE giveaways SET ended=1, winner_ids=? WHERE message_id=?').run(JSON.stringify(winnerIds), msgId),
};

const verify = {
  isVerified: (uid, gid) => !!db.prepare('SELECT 1 FROM verified WHERE user_id=? AND guild_id=?').get(uid, gid),
  verify:     (uid, gid) =>
    db.prepare('INSERT OR IGNORE INTO verified(user_id,guild_id,timestamp) VALUES(?,?,?)').run(uid, gid, Date.now()),
};

const captcha = {
  set:    (uid, gid, code) =>
    db.prepare('INSERT OR REPLACE INTO captcha_pending(user_id,guild_id,code,attempts,timestamp) VALUES(?,?,?,0,?)').run(uid,gid,code,Date.now()),
  get:    (uid, gid) => db.prepare('SELECT * FROM captcha_pending WHERE user_id=? AND guild_id=?').get(uid, gid),
  incr:   (uid, gid) => db.prepare('UPDATE captcha_pending SET attempts=attempts+1 WHERE user_id=? AND guild_id=?').run(uid, gid),
  remove: (uid, gid) => db.prepare('DELETE FROM captcha_pending WHERE user_id=? AND guild_id=?').run(uid, gid),
};

const postedGames = {
  isPosted:   (gameId, source) => !!db.prepare('SELECT 1 FROM posted_games WHERE game_id=? AND source=?').get(gameId, source),
  markPosted: (gameId, source) =>
    db.prepare('INSERT OR IGNORE INTO posted_games(game_id,source,posted_at) VALUES(?,?,?)').run(gameId, source, Date.now()),
};

const postedInstagram = {
  isPosted:   (postId) => !!db.prepare('SELECT 1 FROM posted_instagram WHERE post_id=?').get(postId),
  markPosted: (postId) =>
    db.prepare('INSERT OR IGNORE INTO posted_instagram(post_id,posted_at) VALUES(?,?)').run(postId, Date.now()),
};

const economy = {
  get:         (uid, gid) => db.prepare('SELECT * FROM economy WHERE user_id=? AND guild_id=?').get(uid, gid),
  create:      (uid, gid) => db.prepare('INSERT OR IGNORE INTO economy(user_id,guild_id) VALUES(?,?)').run(uid, gid),
  addWallet:   (uid, gid, amount) => db.prepare('UPDATE economy SET wallet=wallet+? WHERE user_id=? AND guild_id=?').run(amount, uid, gid),
  addBank:     (uid, gid, amount) => db.prepare('UPDATE economy SET bank=bank+? WHERE user_id=? AND guild_id=?').run(amount, uid, gid),
  transfer:    (uid, gid, amount, dir) => {
    if (dir === 'wallet_to_bank') { db.prepare('UPDATE economy SET wallet=wallet-?, bank=bank+? WHERE user_id=? AND guild_id=?').run(amount, amount, uid, gid); }
    else { db.prepare('UPDATE economy SET bank=bank-?, wallet=wallet+? WHERE user_id=? AND guild_id=?').run(amount, amount, uid, gid); }
  },
  setDaily:    (uid, gid, time, streak) => db.prepare('UPDATE economy SET last_daily=?, streak=? WHERE user_id=? AND guild_id=?').run(time, streak, uid, gid),
  leaderboard: (gid, limit=10) => db.prepare('SELECT * FROM economy WHERE guild_id=? ORDER BY (wallet+bank) DESC LIMIT ?').all(gid, limit),
};

const profile = {
  get:    (uid, gid) => db.prepare('SELECT * FROM profiles WHERE user_id=? AND guild_id=?').get(uid, gid),
  create: (uid, gid) => db.prepare('INSERT OR IGNORE INTO profiles (user_id, guild_id) VALUES (?,?)').run(uid, gid),
  setBio: (uid, gid, bio) => {
    profile.create(uid, gid);
    db.prepare('UPDATE profiles SET bio=? WHERE user_id=? AND guild_id=?').run(bio, uid, gid);
  },
  setPseudo: (uid, gid, game, pseudo) => {
    profile.create(uid, gid);
    const key = `pseudo_${game.toLowerCase().replace(/\s/g,'_')}`;
    db.prepare(`UPDATE profiles SET ${key}=? WHERE user_id=? AND guild_id=?`).run(pseudo, uid, gid);
  },
  setBanner: (uid, gid, color) => {
    profile.create(uid, gid);
    db.prepare('UPDATE profiles SET banner_color=? WHERE user_id=? AND guild_id=?').run(color, uid, gid);
  },
};


const betting = {
  create: (data) => db.prepare('INSERT INTO bets(message_id,channel_id,guild_id,title,options,end_time,creator_id) VALUES(?,?,?,?,?,?,?)')
    .run(data.messageId, data.channelId, data.guildId, data.title, JSON.stringify(data.options), data.endTime, data.creatorId),
  get: (msgId) => db.prepare('SELECT * FROM bets WHERE message_id=?').get(msgId),
  active: (gid) => db.prepare('SELECT * FROM bets WHERE guild_id=? AND status="active"').all(gid),
  updateBets: (msgId, betsData) => db.prepare('UPDATE bets SET bets_data=? WHERE message_id=?').run(JSON.stringify(betsData), msgId),
  finish: (msgId, winner) => db.prepare('UPDATE bets SET status="finished", winner_option=? WHERE message_id=?').run(winner, msgId),
  cancel: (msgId) => db.prepare('UPDATE bets SET status="cancelled" WHERE message_id=?').run(msgId),
};


const suggestions = {
  create: (data) => db.prepare('INSERT INTO suggestions(message_id,channel_id,guild_id,user_id,content,timestamp) VALUES(?,?,?,?,?,?)')
    .run(data.messageId, data.channelId, data.guildId, data.userId, data.content, data.timestamp),
  get: (msgId) => db.prepare('SELECT * FROM suggestions WHERE message_id=?').get(msgId),
  updateVotes: (msgId, up, down) => db.prepare('UPDATE suggestions SET upvotes=?, downvotes=? WHERE message_id=?').run(up, down, msgId),
  approve: (msgId, response) => db.prepare('UPDATE suggestions SET status="approved", admin_response=? WHERE message_id=?').run(response, msgId),
  reject: (msgId, response) => db.prepare('UPDATE suggestions SET status="rejected", admin_response=? WHERE message_id=?').run(response, msgId),
  pending: (gid) => db.prepare('SELECT * FROM suggestions WHERE guild_id=? AND status="pending"').all(gid),
};

const challenges = {
  getCurrent: (gid) => db.prepare('SELECT * FROM daily_challenges WHERE guild_id=? AND date=? LIMIT 1').get(gid, new Date().toISOString().split('T')[0]),
  create: (data) => db.prepare('INSERT INTO daily_challenges(guild_id,date,type,target,progress,contributors,status) VALUES(?,?,?,?,?,?,?)').run(data.guildId, data.date, data.type, data.target, 0, '{}', 'active'),
  updateProgress: (id, progress, contributors) => db.prepare('UPDATE daily_challenges SET progress=?, contributors=? WHERE id=?').run(progress, JSON.stringify(contributors), id),
  complete: (id) => db.prepare('UPDATE daily_challenges SET status="completed" WHERE id=?').run(id),
  fail: (id) => db.prepare('UPDATE daily_challenges SET status="failed" WHERE id=?').run(id),
  getHistory: (gid) => db.prepare('SELECT * FROM daily_challenges WHERE guild_id=? ORDER BY date DESC LIMIT 10').all(gid),
  getUserStats: (gid, uid) => {
    const allChallenges = db.prepare('SELECT * FROM daily_challenges WHERE guild_id=?').all(gid);
    let totalContributions = 0;
    for (const c of allChallenges) {
      const contributors = JSON.parse(c.contributors || '{}');
      totalContributions += contributors[uid] || 0;
    }
    return totalContributions;
  },
};

const tempVoice = {
  create: (channelId, ownerId, guildId) => db.prepare('INSERT INTO temp_voice(channel_id,owner_id,guild_id,created_at) VALUES(?,?,?,?)').run(channelId, ownerId, guildId, Date.now()),
  get: (channelId) => db.prepare('SELECT * FROM temp_voice WHERE channel_id=?').get(channelId),
  getByOwner: (ownerId) => db.prepare('SELECT * FROM temp_voice WHERE owner_id=?').get(ownerId),
  delete: (channelId) => db.prepare('DELETE FROM temp_voice WHERE channel_id=?').run(channelId),
  getAll: (guildId) => db.prepare('SELECT * FROM temp_voice WHERE guild_id=?').all(guildId),
};

const achievements = {
  unlock: (userId, guildId, achievementId) => {
    const existing = db.prepare('SELECT * FROM achievements WHERE user_id=? AND guild_id=? AND achievement_id=?').get(userId, guildId, achievementId);
    if (existing) return false;
    db.prepare('INSERT INTO achievements(user_id,guild_id,achievement_id,unlocked_at) VALUES(?,?,?,?)').run(userId, guildId, achievementId, Date.now());
    return true;
  },
  getUser: (userId, guildId) => db.prepare('SELECT * FROM achievements WHERE user_id=? AND guild_id=?').all(userId, guildId),
  has: (userId, guildId, achievementId) => {
    const result = db.prepare('SELECT * FROM achievements WHERE user_id=? AND guild_id=? AND achievement_id=?').get(userId, guildId, achievementId);
    return !!result;
  },
  getAll: (guildId) => db.prepare('SELECT * FROM achievements WHERE guild_id=?').all(guildId),
};

module.exports = { db, initDatabase, xp, warn, birthday, giveaway, verify, captcha, postedGames, postedInstagram, profile, economy, betting, suggestions, challenges, tempVoice, achievements };


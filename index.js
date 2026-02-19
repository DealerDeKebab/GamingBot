require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { initDatabase } = require('./database/database');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents }   = require('./handlers/eventHandler');
const cron = require('node-cron');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember, Partials.User],
});

client.commands    = new Collection();
client.musicQueues = new Map();   // file musique par guild
client.spamMap     = new Map();   // anti-spam : compteurs
client.joinTracker = new Map();   // anti-raid  : timestamps de joins
client.raidActive  = new Map();   // anti-raid  : flag mode raid activé

async function main() {
  console.log('🚀 Démarrage du bot Gaming v2...');
  initDatabase();
  await loadCommands(client);
  await loadEvents(client);
  await client.login(process.env.DISCORD_TOKEN);
}

client.once('ready', () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
  console.log(`📡 ${client.guilds.cache.size} serveur(s)`);

  // ── Tâches planifiées ──────────────────────────────────────
  const { checkBirthdays }  = require('./utils/birthdayChecker');
  const { checkGiveaways }  = require('./utils/giveawayChecker');
  const { checkTwitch }     = require('./utils/twitchChecker');
  const { checkFreeGames }  = require('./utils/freeGamesChecker');
const { createDailyChallenge, checkExpiredChallenges } = require('./utils/challengeManager');
  const { updateStats }     = require('./utils/statsUpdater');
  const { checkInstagram }  = require('./utils/instagramChecker');

  cron.schedule('0 9 * * *',     () => checkBirthdays(client));   // tous les jours à 9h
  cron.schedule('*/30 * * * * *',() => checkGiveaways(client));   // toutes les 30s
  cron.schedule('*/5 * * * *',   () => checkTwitch(client));      // toutes les 5min
  cron.schedule('0 * * * *',     () => checkFreeGames(client));   // toutes les heures
cron.schedule('0 0 * * *',     () => { createDailyChallenge(client); checkExpiredChallenges(client); }); // minuit
  cron.schedule('*/15 * * * *',  () => checkInstagram(client));   // toutes les 15min
  cron.schedule('*/10 * * * *',   () => updateStats(client));    // stats toutes les 10min
});

main().catch(console.error);
module.exports = client;

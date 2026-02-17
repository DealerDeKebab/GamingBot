const { giveaway } = require('../database/database');

async function checkGiveaways(client) {
  const expired = giveaway.expired();
  for (const g of expired) {
    try {
      const guild = client.guilds.cache.get(g.guild_id);
      if (!guild) continue;
      const { endGiveaway } = require('../commands/giveaway/giveaway');
      await endGiveaway(g.message_id, client, guild);
    } catch (e) { console.error('giveawayChecker error:', e.message); }
  }
}
module.exports = { checkGiveaways };

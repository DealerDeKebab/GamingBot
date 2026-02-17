const { ChannelType } = require('discord.js');

async function updateStats(client) {
  for (const [, guild] of client.guilds.cache) {
    try {
      // Fetch les membres pour avoir les données à jour
      await guild.members.fetch();

      const category = guild.channels.cache.find(
        c => c.name === '📊 STATISTIQUES' && c.type === ChannelType.GuildCategory
      );
      if (!category) continue;

      const children = guild.channels.cache.filter(c => c.parentId === category.id);

      const totalMembers = guild.memberCount;
      const botCount     = guild.members.cache.filter(m => m.user.bot).size;
      const humanCount   = totalMembers - botCount;
      const onlineCount  = guild.members.cache.filter(m =>
        m.presence?.status && m.presence.status !== 'offline'
      ).size;
      const voiceCount   = guild.channels.cache
        .filter(c => c.type === ChannelType.GuildVoice && c.members?.size > 0)
        .reduce((acc, c) => acc + c.members.size, 0);
      const boostCount   = guild.premiumSubscriptionCount || 0;

      for (const [, ch] of children) {
        const name = ch.name;
        let newName = null;

        if (name.startsWith('👥'))  newName = `👥 Membres : ${totalMembers}`;
        if (name.startsWith('🟢'))  newName = `🟢 En ligne : ${onlineCount}`;
        if (name.startsWith('🎮'))  newName = `🎮 En vocal : ${voiceCount}`;
        if (name.startsWith('💎'))  newName = `💎 Boosts : ${boostCount}`;
        if (name.startsWith('🤖'))  newName = `🤖 Bots : ${botCount}`;

        // Ne met à jour que si le nom a changé (évite le rate limit Discord)
        if (newName && newName !== name) {
          await ch.setName(newName).catch(() => {});
          // Pause obligatoire — Discord rate-limite le renommage de salons
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    } catch (e) {
      // Silencieux — pas critique si une mise à jour rate
    }
  }
}

module.exports = { updateStats };

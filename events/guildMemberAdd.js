const { EmbedBuilder } = require('discord.js');
const { captcha, db }  = require('../database/database');

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    const { guild } = member;
    const now = Date.now();

    // ══════════════════════════════════════════════════════
    //  ANTI-RAID — Détection d'afflux de membres
    // ══════════════════════════════════════════════════════
    const threshold = parseInt(process.env.ANTIRAID_THRESHOLD) || 7;
    const action    = (process.env.ANTIRAID_ACTION || 'alert').toLowerCase();

    // Stocke les timestamps de join des 30 dernières secondes
    const joins = (client.joinTracker.get(guild.id) || []).filter(t => now - t < 30000);
    joins.push(now);
    client.joinTracker.set(guild.id, joins);

    // Activation du mode raid
    if (joins.length >= threshold) {
      const raidWasActive = client.raidActive.get(guild.id);

      if (!raidWasActive) {
        client.raidActive.set(guild.id, true);
        // Reset automatique après 2 minutes
        setTimeout(() => client.raidActive.delete(guild.id), 2 * 60 * 1000);

        const logCh = guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
        if (logCh) {
          const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🚨 MODE RAID ACTIVÉ')
            .setDescription(
              `**${joins.length} membres** ont rejoint en moins de 30 secondes !\n\n` +
              `⚙️ **Action configurée :** \`${action}\`\n` +
              `⏱️ Mode raid actif pendant **2 minutes**.`
            )
            .setTimestamp();
          logCh.send({ content: '@here', embeds: [embed] });
        }
      }

      // Action anti-raid sur le nouveau membre
      if (action === 'kick') {
        try {
          await member.send('🚨 Le serveur est en **mode anti-raid**. Rejoins à nouveau dans quelques minutes.').catch(() => {});
          await member.kick('Anti-raid automatique');
          return;
        } catch {}
      } else if (action === 'ban') {
        try {
          await member.ban({ reason: 'Anti-raid automatique', deleteMessageSeconds: 0 });
          return;
        } catch {}
      }
      // 'alert' = laisse entrer mais log
    }

    // ══════════════════════════════════════════════════════
    //  CAPTCHA en DM
    // ══════════════════════════════════════════════════════
    const code = genCode();
    captcha.set(member.id, guild.id, code);

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`🎮 Bienvenue sur ${guild.name} !`)
      .setDescription(
        `Salut **${member.user.username}** ! Pour accéder au serveur, prouve que tu n'es pas un bot.\n\n` +
        `**Ton code captcha :**\n` +
        `\`\`\`\n${code}\n\`\`\`\n` +
        `✏️ Réponds à ce message avec exactement ce code.\n` +
        `⚠️ **3 tentatives** — **10 minutes** pour valider.`
      )
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .setFooter({ text: 'Respecte la casse — majuscules et chiffres uniquement' });

    try {
      await member.send({ embeds: [embed] });
    } catch {
      // DMs fermés
      const verifyCh = guild.channels.cache.get(process.env.VERIFY_CHANNEL_ID);
      if (verifyCh) {
        verifyCh.send({
          content: `⚠️ ${member} Tes DMs sont fermés ! Active-les puis rejoins à nouveau pour recevoir ton captcha.`,
        }).then(m => setTimeout(() => m.delete().catch(() => {}), 30000));
      }
    }
  },
};

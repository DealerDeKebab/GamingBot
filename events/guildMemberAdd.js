const { EmbedBuilder } = require('discord.js');
const { verify, captcha } = require('../database/database');

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array(6).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
}

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    const guild = member.guild;

    // ══════════════════════════════════════════
    //  LOG — Membre rejoint
    // ══════════════════════════════════════════
    const logChannel = guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
    if (logChannel) {
      const accountAge = Math.floor((Date.now() - member.user.createdTimestamp) / 86400000);
      const isNew = accountAge < 7;

      const embed = new EmbedBuilder()
        .setColor(isNew ? '#FFA500' : '#00FF7F')
        .setTitle('👋 Nouveau membre')
        .addFields(
          { name: '👤 Membre', value: `${member.user.tag} (${member.id})`, inline: false },
          { name: '📅 Compte créé le', value: `<t:${Math.floor(member.user.createdTimestamp/1000)}:F>`, inline: true },
          { name: '⏱️ Âge du compte', value: `${accountAge} jour(s)`, inline: true },
          { name: '👥 Total membres', value: `${guild.memberCount}`, inline: true },
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      if (isNew) {
        embed.setFooter({ text: '⚠️ Compte récent (< 7 jours)' });
      }

      logChannel.send({ embeds: [embed] }).catch(() => {});
    }

    // ══════════════════════════════════════════
    //  ANTI-RAID
    // ══════════════════════════════════════════
    if (!guild.joinTimestamps) guild.joinTimestamps = [];
    const now = Date.now();
    guild.joinTimestamps.push(now);
    guild.joinTimestamps = guild.joinTimestamps.filter(t => now - t < 30000);

    const threshold = parseInt(process.env.ANTIRAID_THRESHOLD) || 7;
    const action    = process.env.ANTIRAID_ACTION || 'alert';

    if (guild.joinTimestamps.length >= threshold) {
      if (!guild.raidMode) {
        guild.raidMode = true;
        setTimeout(() => { guild.raidMode = false; }, 120000);

        if (logChannel) {
          logChannel.send({ content: '@here', embeds: [
            new EmbedBuilder().setColor('#FF0000').setTitle('🚨 MODE RAID ACTIVÉ !')
              .setDescription(`**${guild.joinTimestamps.length}** membres ont rejoint en moins de 30 secondes !`)
              .addFields({ name: '⚙️ Action', value: action === 'kick' ? 'Expulsion automatique' : action === 'ban' ? 'Bannissement automatique' : 'Alerte uniquement' })
              .setTimestamp()
          ]}).catch(() => {});
        }
      }

      if (action === 'kick') {
        await member.kick('Anti-raid').catch(() => {});
        await member.send('Tu as été expulsé automatiquement — le serveur est en mode raid. Réessaie dans quelques minutes.').catch(() => {});
        return;
      } else if (action === 'ban') {
        await member.ban({ reason: 'Anti-raid' }).catch(() => {});
        return;
      }
    }

    // ══════════════════════════════════════════
    //  CAPTCHA
    // ══════════════════════════════════════════
    if (verify.isVerified(member.id, guild.id)) return;

    const code = genCode();
    captcha.set(member.id, guild.id, code);

    const dmEmbed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`🔐 Vérification — ${guild.name}`)
      .setDescription(
        `Bienvenue sur **${guild.name}** !\n\n` +
        `Pour accéder au serveur, réponds à ce message avec le code suivant :\n\n` +
        `> **${code}**\n\n` +
        `⏱️ Tu as **10 minutes** et **3 tentatives**.\n` +
        `❌ Après 3 échecs, tu seras expulsé.`
      )
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .setTimestamp();

    try {
      await member.send({ embeds: [dmEmbed] });
    } catch (e) {
      const verifyCh = guild.channels.cache.get(process.env.VERIFY_CHANNEL_ID);
      if (verifyCh) {
        const msg = await verifyCh.send({
          content: `${member}, tes DMs sont fermés ! Vérifie-toi ici :`,
          embeds: [dmEmbed],
        }).catch(() => {});
        if (msg) setTimeout(() => msg.delete().catch(() => {}), 30000);
      }
    }

    setTimeout(async () => {
      const pending = captcha.get(member.id, guild.id);
      if (pending) {
        captcha.remove(member.id, guild.id);
        await member.kick('Captcha expiré').catch(() => {});
        await member.send('⏱️ Le captcha a expiré. Tu as été expulsé.').catch(() => {});
      }
    }, 600000);
  },
};

const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    const guild = member.guild;

    // ══════════════════════════════════════════
    //  AJOUTER RÔLE MUET AUTOMATIQUEMENT
    // ══════════════════════════════════════════
    const muteRoleId = process.env.MUTE_ROLE_ID;
    if (muteRoleId) {
      try {
        const muteRole = guild.roles.cache.get(muteRoleId);
        if (muteRole) {
          await member.roles.add(muteRole);
          console.log(`Rôle muet ajouté à ${member.user.tag}`);
        }
      } catch (error) {
        console.error('Erreur ajout rôle muet:', error);
      }
    }

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
    //  MESSAGE DE BIENVENUE
    // ══════════════════════════════════════════
    const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;
    if (welcomeChannelId) {
      const welcomeChannel = guild.channels.cache.get(welcomeChannelId);
      if (welcomeChannel) {
        const welcomeEmbed = new EmbedBuilder()
          .setColor('#00FF7F')
          .setTitle('👋 Bienvenue !')
          .setDescription(`Salut ${member} ! Bienvenue sur **${guild.name}** ! 🎮\n\nN'oublie pas d'accepter le règlement pour accéder au serveur !`)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setTimestamp();
        welcomeChannel.send({ embeds: [welcomeEmbed] }).catch(() => {});
      }
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
  },
};

const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember, client) {
    const logChannel = newMember.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
    if (!logChannel) return;

    // Changement de pseudo/surnom
    if (oldMember.nickname !== newMember.nickname) {
      const embed = new EmbedBuilder()
        .setColor('#00BFFF')
        .setTitle('✏️ Surnom modifié')
        .addFields(
          { name: '👤 Membre', value: `${newMember.user.tag} (${newMember.id})`, inline: false },
          { name: '📝 Ancien surnom', value: oldMember.nickname || '*Aucun*', inline: true },
          { name: '📝 Nouveau surnom', value: newMember.nickname || '*Aucun*', inline: true },
        )
        .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();
      logChannel.send({ embeds: [embed] }).catch(() => {});
    }

    // Changement de rôles
    const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
    const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));

    if (addedRoles.size > 0) {
      const embed = new EmbedBuilder()
        .setColor('#00FF7F')
        .setTitle('➕ Rôle(s) ajouté(s)')
        .addFields(
          { name: '👤 Membre', value: `${newMember.user.tag} (${newMember.id})`, inline: false },
          { name: '🎭 Rôle(s)', value: addedRoles.map(r => r.name).join(', '), inline: false },
        )
        .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();
      logChannel.send({ embeds: [embed] }).catch(() => {});
    }

    if (removedRoles.size > 0) {
      const embed = new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle('➖ Rôle(s) retiré(s)')
        .addFields(
          { name: '👤 Membre', value: `${newMember.user.tag} (${newMember.id})`, inline: false },
          { name: '🎭 Rôle(s)', value: removedRoles.map(r => r.name).join(', '), inline: false },
        )
        .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();
      logChannel.send({ embeds: [embed] }).catch(() => {});
    }
  },
};

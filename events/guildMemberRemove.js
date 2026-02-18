const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client) {
    const logChannel = member.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
    if (!logChannel) return;

    const joinedAt = member.joinedAt;
    const timeOnServer = joinedAt ? Math.floor((Date.now() - joinedAt.getTime()) / 86400000) : 0;

    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('👋 Membre parti')
      .addFields(
        { name: '👤 Membre', value: `${member.user.tag} (${member.id})`, inline: false },
        { name: '📅 A rejoint le', value: joinedAt ? `<t:${Math.floor(joinedAt/1000)}:F>` : 'Inconnu', inline: true },
        { name: '⏱️ Temps sur le serveur', value: `${timeOnServer} jour(s)`, inline: true },
        { name: '🎭 Rôles', value: member.roles.cache.filter(r => r.id !== member.guild.id).map(r => r.name).join(', ') || '*Aucun*', inline: false },
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};

const { EmbedBuilder, AuditLogEvent } = require('discord.js');

module.exports = {
  name: 'messageDelete',
  async execute(message, client) {
    if (!message.guild) return;
    if (message.author?.bot) return;
    
    const logChannel = message.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('🗑️ Message supprimé')
      .addFields(
        { name: '📍 Salon', value: `${message.channel}`, inline: true },
        { name: '🕐 Date', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: true },
      )
      .setTimestamp();

    // Auteur du message
    if (message.author) {
      embed.addFields({ name: '👤 Auteur', value: `${message.author.tag} (${message.author.id})`, inline: false });
      embed.setThumbnail(message.author.displayAvatarURL({ dynamic: true }));
    } else if (message.member) {
      embed.addFields({ name: '👤 Auteur', value: `${message.member.user.tag} (${message.member.id})`, inline: false });
      embed.setThumbnail(message.member.user.displayAvatarURL({ dynamic: true }));
    }

    // Qui a supprimé ? (via Audit Log)
    try {
      const auditLogs = await message.guild.fetchAuditLogs({
        type: AuditLogEvent.MessageDelete,
        limit: 1,
      });
      const deleteLog = auditLogs.entries.first();
      if (deleteLog && Date.now() - deleteLog.createdTimestamp < 5000) {
        if (deleteLog.executor.id !== message.author?.id) {
          embed.addFields({ name: '🔨 Supprimé par', value: `${deleteLog.executor.tag}`, inline: true });
        }
      }
    } catch (e) {
      // Pas de permissions audit log
    }

    // Contenu
    if (message.content) {
      embed.addFields({ name: '💬 Contenu', value: message.content.substring(0, 1024) });
    }

    // Pièces jointes
    if (message.attachments.size > 0) {
      const files = message.attachments.map(a => `[${a.name}](${a.url})`).join('\n');
      embed.addFields({ name: '📎 Pièces jointes', value: files.substring(0, 1024) });
    }

    logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};

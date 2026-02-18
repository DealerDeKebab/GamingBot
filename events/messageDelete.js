const { EmbedBuilder, AuditLogEvent } = require('discord.js');

module.exports = {
  name: 'messageDelete',
  async execute(message, client) {
    if (!message.guild) return;
    
    const logChannel = message.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
    if (!logChannel) return;

    // Ignorer si pas d'infos
    if (!message.author && !message.content && message.attachments.size === 0) return;
    if (message.author?.bot) return;

    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('🗑️ Message supprimé')
      .setTimestamp();

    // Auteur
    let authorInfo = 'Inconnu';
    if (message.author) {
      authorInfo = `${message.author.tag} (${message.author.id})`;
      embed.setThumbnail(message.author.displayAvatarURL({ dynamic: true }));
    }

    // Qui a supprimé ? (via Audit Log)
    let deletedBy = null;
    try {
      const auditLogs = await message.guild.fetchAuditLogs({
        type: AuditLogEvent.MessageDelete,
        limit: 1,
      });
      const deleteLog = auditLogs.entries.first();
      if (deleteLog && Date.now() - deleteLog.createdTimestamp < 5000) {
        deletedBy = deleteLog.executor;
        if (message.author && deleteLog.executor.id !== message.author.id) {
          embed.addFields({ name: '🔨 Supprimé par', value: `${deleteLog.executor.tag}`, inline: true });
        }
      }
    } catch (e) {
      // Pas de permissions
    }

    embed.addFields(
      { name: '👤 Auteur', value: authorInfo, inline: true },
      { name: '📍 Salon', value: `${message.channel}`, inline: true },
    );

    // Contenu
    if (message.content) {
      embed.addFields({ name: '💬 Contenu', value: message.content.substring(0, 1024) });
    }

    // Pièces jointes
    if (message.attachments.size > 0) {
      const files = message.attachments.map(a => a.name).join(', ');
      embed.addFields({ name: '📎 Fichiers', value: files.substring(0, 1024) });
    }

    logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};

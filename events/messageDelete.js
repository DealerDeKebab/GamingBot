const { EmbedBuilder, AuditLogEvent } = require('discord.js');

module.exports = {
  name: 'messageDelete',
  async execute(message, client) {
    if (!message.guild) return;
    
    const logChannel = message.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
    if (!logChannel) return;

    // Ignorer les bots si on connaît l'auteur
    if (message.author?.bot) return;

    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('🗑️ Message supprimé')
      .setTimestamp();

    // Auteur du message
    let authorInfo = '*Auteur inconnu (message non en cache)*';
    if (message.author) {
      authorInfo = `${message.author.tag} (${message.author.id})`;
      embed.setThumbnail(message.author.displayAvatarURL({ dynamic: true }));
    }

    // Qui a supprimé ? (via Audit Log)
    try {
      const auditLogs = await message.guild.fetchAuditLogs({
        type: AuditLogEvent.MessageDelete,
        limit: 1,
      });
      const deleteLog = auditLogs.entries.first();
      if (deleteLog && Date.now() - deleteLog.createdTimestamp < 5000) {
        const executor = deleteLog.executor;
        const target = deleteLog.target;
        
        // Si on ne connaît pas l'auteur, on peut le déduire de l'audit log
        if (!message.author && target) {
          authorInfo = `${target.tag} (${target.id})`;
          embed.setThumbnail(target.displayAvatarURL({ dynamic: true }));
        }
        
        // Afficher qui a supprimé si c'est un modérateur
        if (message.author && executor.id !== message.author.id) {
          embed.addFields({ name: '🔨 Supprimé par', value: `${executor.tag}`, inline: true });
        } else if (!message.author && target && executor.id !== target.id) {
          embed.addFields({ name: '🔨 Supprimé par', value: `${executor.tag}`, inline: true });
        }
      }
    } catch (e) {
      // Pas de permissions audit log
    }

    embed.addFields(
      { name: '👤 Auteur', value: authorInfo, inline: true },
      { name: '📍 Salon', value: `${message.channel}`, inline: true },
    );

    // Contenu
    if (message.content) {
      embed.addFields({ name: '💬 Contenu', value: message.content.substring(0, 1024) });
    } else {
      embed.addFields({ name: '💬 Contenu', value: '*Contenu non disponible (message non en cache)*' });
    }

    // Pièces jointes
    if (message.attachments.size > 0) {
      const files = message.attachments.map(a => a.name).join(', ');
      embed.addFields({ name: '📎 Fichiers', value: files.substring(0, 1024) });
    }

    logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};

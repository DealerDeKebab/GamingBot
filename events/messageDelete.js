const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'messageDelete',
  async execute(message, client) {
    if (!message.guild || message.author?.bot) return;
    
    const logChannel = message.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('🗑️ Message supprimé')
      .addFields(
        { name: '👤 Auteur', value: message.author ? `${message.author.tag} (${message.author.id})` : 'Inconnu', inline: true },
        { name: '📍 Salon', value: `${message.channel}`, inline: true },
        { name: '🕐 Date', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false },
      )
      .setTimestamp();

    if (message.content) {
      embed.addFields({ name: '💬 Contenu', value: message.content.substring(0, 1024) });
    }

    if (message.attachments.size > 0) {
      const files = message.attachments.map(a => a.name).join(', ');
      embed.addFields({ name: '📎 Pièces jointes', value: files });
    }

    if (message.author) {
      embed.setThumbnail(message.author.displayAvatarURL({ dynamic: true }));
    }

    logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};

const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage, client) {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return; // Ignore embed updates
    
    const logChannel = newMessage.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('✏️ Message modifié')
      .addFields(
        { name: '👤 Auteur', value: `${newMessage.author.tag} (${newMessage.author.id})`, inline: true },
        { name: '📍 Salon', value: `${newMessage.channel}`, inline: true },
        { name: '🔗 Lien', value: `[Aller au message](${newMessage.url})`, inline: true },
      )
      .setThumbnail(newMessage.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    if (oldMessage.content) {
      embed.addFields({ name: '📝 Avant', value: oldMessage.content.substring(0, 1024) });
    }
    if (newMessage.content) {
      embed.addFields({ name: '📝 Après', value: newMessage.content.substring(0, 1024) });
    }

    logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};

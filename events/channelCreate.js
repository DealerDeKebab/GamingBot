const { EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  name: 'channelCreate',
  async execute(channel, client) {
    if (!channel.guild) return;
    
    const logChannel = channel.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
    if (!logChannel) return;

    const typeNames = {
      [ChannelType.GuildText]: '💬 Texte',
      [ChannelType.GuildVoice]: '🔊 Vocal',
      [ChannelType.GuildCategory]: '📁 Catégorie',
      [ChannelType.GuildAnnouncement]: '📢 Annonces',
      [ChannelType.GuildStageVoice]: '🎙️ Salon de conférence',
      [ChannelType.GuildForum]: '💭 Forum',
    };

    const embed = new EmbedBuilder()
      .setColor('#00FF7F')
      .setTitle('📝 Salon créé')
      .addFields(
        { name: '📍 Nom', value: channel.name, inline: true },
        { name: '🔖 Type', value: typeNames[channel.type] || 'Inconnu', inline: true },
        { name: '🆔 ID', value: channel.id, inline: true },
      )
      .setTimestamp();

    if (channel.parent) {
      embed.addFields({ name: '📁 Catégorie', value: channel.parent.name, inline: false });
    }

    logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};

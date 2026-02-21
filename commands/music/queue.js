const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('📋 Voir la file d\'attente'),

  async execute(interaction) {
    const queue = interaction.client.musicManager.getQueue(interaction.guildId);
    
    if (!queue || (!queue.current && queue.tracks.length === 0)) {
      return interaction.reply({ content: '❌ Aucune musique dans la file !', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('📋 File d\'attente');

    if (queue.current) {
      embed.addFields({
        name: '🎵 En cours',
        value: `**${queue.current.info.title}**\n${queue.current.info.author}`,
        inline: false
      });
    }

    if (queue.tracks.length > 0) {
      const upcoming = queue.tracks.slice(0, 10).map((t, i) => 
        `${i + 1}. **${t.info.title}**`
      ).join('\n');

      embed.addFields({
        name: `📝 À venir (${queue.tracks.length})`,
        value: upcoming,
        inline: false
      });

      if (queue.tracks.length > 10) {
        embed.setFooter({ text: `... et ${queue.tracks.length - 10} autre(s)` });
      }
    }

    return interaction.reply({ embeds: [embed] });
  },
};

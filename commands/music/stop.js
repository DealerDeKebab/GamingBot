const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder().setName('stop').setDescription('⏹️ Arrêter la musique'),
  async execute(interaction, client) {
    const q = client.musicQueues.get(interaction.guild.id);
    if (!q) return interaction.reply({ content: '❌ Rien en lecture.', ephemeral: true });
    q.queue = [];
    q.player?.stop();
    q.connection?.destroy();
    client.musicQueues.delete(interaction.guild.id);
    await interaction.reply('⏹️ Musique arrêtée et file vidée.');
  },
};

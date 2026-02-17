const { SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
module.exports = {
  data: new SlashCommandBuilder().setName('pause').setDescription('⏸️ Pause / Reprendre'),
  async execute(interaction, client) {
    const q = client.musicQueues.get(interaction.guild.id);
    if (!q?.player) return interaction.reply({ content: '❌ Rien en lecture.', ephemeral: true });
    if (q.player.state.status === AudioPlayerStatus.Paused) {
      q.player.unpause();
      await interaction.reply('▶️ Lecture reprise !');
    } else {
      q.player.pause();
      await interaction.reply('⏸️ Mis en pause.');
    }
  },
};

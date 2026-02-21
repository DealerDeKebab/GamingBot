const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('⏸️ Mettre en pause'),

  async execute(interaction) {
    if (!interaction.member.voice.channel) {
      return interaction.reply({ content: '❌ Tu dois être dans un salon vocal !', ephemeral: true });
    }

    const paused = interaction.client.musicManager.pause(interaction.guildId);
    
    if (paused) {
      return interaction.reply('⏸️ Musique en pause.');
    } else {
      return interaction.reply({ content: '❌ Aucune musique en cours !', ephemeral: true });
    }
  },
};

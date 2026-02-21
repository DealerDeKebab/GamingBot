const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('▶️ Reprendre la lecture'),

  async execute(interaction) {
    if (!interaction.member.voice.channel) {
      return interaction.reply({ content: '❌ Tu dois être dans un salon vocal !', ephemeral: true });
    }

    const resumed = interaction.client.musicManager.resume(interaction.guildId);
    
    if (resumed) {
      return interaction.reply('▶️ Lecture reprise.');
    } else {
      return interaction.reply({ content: '❌ Aucune musique en pause !', ephemeral: true });
    }
  },
};

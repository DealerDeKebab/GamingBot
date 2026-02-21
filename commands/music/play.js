const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('🎵 Jouer une musique')
    .addStringOption(o => o.setName('recherche').setDescription('Nom ou URL de la musique').setRequired(true)),

  async execute(interaction) {
    const query = interaction.options.getString('recherche');
    await interaction.client.musicManager.play(interaction, query);
  },
};

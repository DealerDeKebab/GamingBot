const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('⏹️ Arrêter la musique et quitter le vocal'),

  async execute(interaction) {
    if (!interaction.member.voice.channel) {
      return interaction.reply({ content: '❌ Tu dois être dans un salon vocal !', ephemeral: true });
    }

    const stopped = interaction.client.musicManager.stop(interaction.guildId);
    
    if (stopped) {
      return interaction.reply('⏹️ Musique arrêtée et déconnecté du vocal.');
    } else {
      return interaction.reply({ content: '❌ Aucune musique en cours !', ephemeral: true });
    }
  },
};

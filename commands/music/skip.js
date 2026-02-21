const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('⏭️ Passer la musique'),

  async execute(interaction) {
    if (!interaction.member.voice.channel) {
      return interaction.reply({ content: '❌ Tu dois être dans un salon vocal !', ephemeral: true });
    }

    const skipped = interaction.client.musicManager.skip(interaction.guildId);
    
    if (skipped) {
      return interaction.reply('⏭️ Musique passée !');
    } else {
      return interaction.reply({ content: '❌ Aucune musique en cours !', ephemeral: true });
    }
  },
};

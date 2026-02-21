const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('🔊 Régler le volume')
    .addIntegerOption(o => o.setName('niveau').setDescription('Volume (0-100)').setRequired(true).setMinValue(0).setMaxValue(100)),

  async execute(interaction) {
    if (!interaction.member.voice.channel) {
      return interaction.reply({ content: '❌ Tu dois être dans un salon vocal !', ephemeral: true });
    }

    const volume = interaction.options.getInteger('niveau');
    const changed = interaction.client.musicManager.setVolume(interaction.guildId, volume);
    
    if (changed) {
      return interaction.reply(`🔊 Volume réglé à **${volume}%**`);
    } else {
      return interaction.reply({ content: '❌ Aucune musique en cours !', ephemeral: true });
    }
  },
};

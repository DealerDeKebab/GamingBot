const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder().setName('volume').setDescription('🔊 Régler le volume (0-150)')
    .addIntegerOption(o => o.setName('valeur').setDescription('Volume %').setRequired(true).setMinValue(0).setMaxValue(150)),
  async execute(interaction, client) {
    const q = client.musicQueues.get(interaction.guild.id);
    if (!q?.player) return interaction.reply({ content: '❌ Rien en lecture.', ephemeral: true });
    const vol = interaction.options.getInteger('valeur') / 100;
    const res = q.player.state?.resource;
    if (res?.volume) { res.volume.setVolume(vol); await interaction.reply(`🔊 Volume réglé à **${interaction.options.getInteger('valeur')}%**.`); }
    else await interaction.reply({ content: '❌ Impossible de régler le volume.', ephemeral: true });
  },
};

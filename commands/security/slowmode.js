const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder().setName('slowmode').setDescription('🐢 Mode lent d\'un salon')
    .addIntegerOption(o => o.setName('secondes').setDescription('0 = désactiver').setRequired(true).setMinValue(0).setMaxValue(21600))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    const s = interaction.options.getInteger('secondes');
    await interaction.channel.setRateLimitPerUser(s);
    await interaction.reply({ content: s === 0 ? '✅ Mode lent **désactivé**.' : `✅ Mode lent : **${s}s**.`, ephemeral: true });
  },
};

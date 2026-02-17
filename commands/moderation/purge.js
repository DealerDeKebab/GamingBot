const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder().setName('purge').setDescription('🗑️ Supprimer des messages en masse')
    .addIntegerOption(o => o.setName('nombre').setDescription('Nombre (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption(o => o.setName('membre').setDescription('Filtrer par membre'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    const amount = interaction.options.getInteger('nombre');
    const user   = interaction.options.getUser('membre');
    await interaction.deferReply({ ephemeral: true });
    let msgs = await interaction.channel.messages.fetch({ limit: 100 });
    if (user) msgs = msgs.filter(m => m.author.id === user.id);
    msgs = [...msgs.values()].slice(0, amount);
    const deleted = await interaction.channel.bulkDelete(msgs, true);
    await interaction.editReply({ content: `✅ **${deleted.size}** message(s) supprimé(s).` });
  },
};

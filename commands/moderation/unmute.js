const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder().setName('unmute').setDescription('🔊 Retirer le mute')
    .addUserOption(o => o.setName('membre').setDescription('Membre').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const target = interaction.options.getMember('membre');
    if (!target) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    await target.timeout(null);
    await interaction.reply({ embeds: [new EmbedBuilder().setColor('#00FF7F').setTitle('🔊 Démute').addFields({ name: 'Membre', value: target.user.tag, inline: true }, { name: 'Modérateur', value: interaction.user.tag, inline: true }).setTimestamp()] });
  },
};

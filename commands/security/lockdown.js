const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder().setName('lockdown').setDescription('🔒 Verrouiller/Déverrouiller un salon')
    .addBooleanOption(o => o.setName('verrouiller').setDescription('true=verrou / false=déverrou').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    const lock   = interaction.options.getBoolean('verrouiller');
    const reason = interaction.options.getString('raison') || 'Aucune raison';
    await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: lock ? false : null });
    await interaction.reply({ embeds: [
      new EmbedBuilder().setColor(lock ? '#FF0000' : '#00FF7F')
        .setTitle(lock ? '🔒 Salon verrouillé' : '🔓 Salon déverrouillé')
        .setDescription(`**Raison :** ${reason}\n**Par :** ${interaction.user}`).setTimestamp()
    ]});
  },
};

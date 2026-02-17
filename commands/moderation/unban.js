const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder().setName('unban').setDescription('🔓 Débannir un utilisateur')
    .addStringOption(o => o.setName('userid').setDescription('ID utilisateur').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    const userId = interaction.options.getString('userid');
    const reason = interaction.options.getString('raison') || 'Aucune raison';
    try {
      await interaction.guild.bans.remove(userId, reason);
      await interaction.reply({ embeds: [new EmbedBuilder().setColor('#00FF7F').setTitle('🔓 Débanni').addFields({ name: 'ID', value: userId }, { name: 'Raison', value: reason }).setTimestamp()] });
    } catch { interaction.reply({ content: '❌ Utilisateur non trouvé dans les bans.', ephemeral: true }); }
  },
};

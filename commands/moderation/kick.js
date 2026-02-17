const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder().setName('kick').setDescription('👢 Expulser un membre')
    .addUserOption(o => o.setName('membre').setDescription('Membre').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async execute(interaction) {
    const target = interaction.options.getMember('membre');
    const reason = interaction.options.getString('raison') || 'Aucune raison';
    if (!target || !target.kickable) return interaction.reply({ content: '❌ Impossible d\'expulser ce membre.', ephemeral: true });
    await target.send({ embeds: [new EmbedBuilder().setColor('#FFA500').setTitle(`👢 Expulsé de ${interaction.guild.name}`).addFields({ name: 'Raison', value: reason })] }).catch(() => {});
    await target.kick(reason);
    const embed = new EmbedBuilder().setColor('#FFA500').setTitle('👢 Membre expulsé')
      .addFields({ name: 'Membre', value: target.user.tag, inline: true }, { name: 'Modérateur', value: interaction.user.tag, inline: true }, { name: 'Raison', value: reason }).setTimestamp();
    await interaction.reply({ embeds: [embed] });
    const log = interaction.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
    if (log) log.send({ embeds: [embed] });
  },
};

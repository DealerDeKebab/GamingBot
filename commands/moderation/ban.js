// commands/moderation/ban.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('🔨 Bannir un membre')
    .addUserOption(o => o.setName('membre').setDescription('Membre à bannir').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison'))
    .addIntegerOption(o => o.setName('jours').setDescription('Jours de messages à supprimer (0-7)').setMinValue(0).setMaxValue(7))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const target = interaction.options.getMember('membre');
    const reason = interaction.options.getString('raison') || 'Aucune raison';
    const days   = interaction.options.getInteger('jours') || 0;

    if (!target)          return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    if (target.id === interaction.user.id) return interaction.reply({ content: '❌ Tu ne peux pas te bannir.', ephemeral: true });
    if (!target.bannable) return interaction.reply({ content: '❌ Je ne peux pas bannir ce membre.', ephemeral: true });

    await target.send({ embeds: [
      new EmbedBuilder().setColor('#FF0000').setTitle(`🔨 Banni de ${interaction.guild.name}`)
        .addFields({ name: 'Raison', value: reason }).setTimestamp()
    ]}).catch(() => {});

    await target.ban({ reason, deleteMessageSeconds: days * 86400 });

    const embed = new EmbedBuilder().setColor('#FF0000').setTitle('🔨 Membre banni')
      .addFields(
        { name: 'Membre',     value: `${target.user.tag} (${target.id})`, inline: true },
        { name: 'Modérateur', value: interaction.user.tag,               inline: true },
        { name: 'Raison',     value: reason }
      ).setTimestamp();

    await interaction.reply({ embeds: [embed] });
    logMod(interaction, embed);
  },
};

function logMod(interaction, embed) {
  const ch = interaction.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
  if (ch) ch.send({ embeds: [embed] });
}

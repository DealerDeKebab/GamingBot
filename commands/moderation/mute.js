const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
function parseDur(s) {
  const m = s.match(/^(\d+)(s|m|h|d)$/);
  if (!m) return null;
  return parseInt(m[1]) * { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2]];
}
module.exports = {
  data: new SlashCommandBuilder().setName('mute').setDescription('🔇 Mettre en sourdine un membre')
    .addUserOption(o => o.setName('membre').setDescription('Membre').setRequired(true))
    .addStringOption(o => o.setName('durée').setDescription('Ex: 10m, 1h, 2d').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const target   = interaction.options.getMember('membre');
    const durStr   = interaction.options.getString('durée');
    const reason   = interaction.options.getString('raison') || 'Aucune raison';
    const duration = parseDur(durStr);
    if (!target)   return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    if (!duration) return interaction.reply({ content: '❌ Format invalide. Ex: `10m`, `1h`, `2d`', ephemeral: true });
    if (duration > 28 * 86400000) return interaction.reply({ content: '❌ Maximum 28 jours.', ephemeral: true });
    await target.timeout(duration, reason);
    const embed = new EmbedBuilder().setColor('#808080').setTitle('🔇 Mute')
      .addFields({ name: 'Membre', value: target.user.tag, inline: true }, { name: 'Durée', value: durStr, inline: true }, { name: 'Modérateur', value: interaction.user.tag, inline: true }, { name: 'Raison', value: reason }).setTimestamp();
    await interaction.reply({ embeds: [embed] });
    const log = interaction.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
    if (log) log.send({ embeds: [embed] });
  },
};

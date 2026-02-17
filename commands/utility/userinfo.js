const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder().setName('userinfo').setDescription('👤 Informations sur un membre')
    .addUserOption(o => o.setName('membre').setDescription('Membre')),
  async execute(interaction) {
    const m = interaction.options.getMember('membre') || interaction.member;
    const roles = m.roles.cache.filter(r => r.id !== interaction.guild.id).sort((a,b) => b.position - a.position);
    await interaction.reply({ embeds: [new EmbedBuilder().setColor(m.displayHexColor || '#5865F2').setTitle(m.user.username).setThumbnail(m.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '🆔 ID',           value: m.user.id,                                          inline: true },
        { name: '📅 Compte créé',   value: `<t:${Math.floor(m.user.createdTimestamp/1000)}:D>`, inline: true },
        { name: '📥 Rejoint le',    value: `<t:${Math.floor(m.joinedTimestamp/1000)}:D>`,       inline: true },
        { name: `🎭 Rôles (${roles.size})`, value: roles.size ? roles.map(r=>`${r}`).slice(0,10).join(', ') : 'Aucun' }
      ).setTimestamp()] });
  },
};

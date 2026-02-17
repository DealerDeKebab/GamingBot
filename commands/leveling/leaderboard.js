const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { xp } = require('../../database/database');
module.exports = {
  data: new SlashCommandBuilder().setName('leaderboard').setDescription('🏆 Classement XP')
    .addIntegerOption(o => o.setName('page').setDescription('Page').setMinValue(1)),
  async execute(interaction) {
    const page  = interaction.options.getInteger('page') || 1;
    const lb    = xp.leaderboard(interaction.guild.id, 100);
    if (!lb.length) return interaction.reply({ content: '❌ Aucun membre classé.', ephemeral: true });
    const per   = 10;
    const pages = Math.ceil(lb.length / per);
    const slice = lb.slice((page-1)*per, page*per);
    const medals = ['🥇','🥈','🥉'];
    const myPos  = lb.findIndex(u => u.user_id === interaction.user.id) + 1;
    await interaction.reply({ embeds: [
      new EmbedBuilder().setColor('#FFD700').setTitle(`🏆 Classement — ${interaction.guild.name}`)
        .setDescription(slice.map((u, i) => {
          const pos = (page-1)*per + i + 1;
          return `${medals[pos-1] || `**${pos}.**`} <@${u.user_id}> — Niv. **${u.level}** • ${u.xp} XP • ${u.messages} msgs`;
        }).join('\n'))
        .addFields({ name: '📍 Ta position', value: myPos ? `#${myPos}` : 'Non classé' })
        .setFooter({ text: `Page ${page}/${pages}` }).setTimestamp()
    ]});
  },
};

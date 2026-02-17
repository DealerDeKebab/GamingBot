const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { economy } = require('../../database/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('richesse')
    .setDescription('🏆 Classement des membres les plus riches'),

  async execute(interaction) {
    await interaction.deferReply();
    const lb     = economy.leaderboard(interaction.guild.id, 10);
    const medals = ['🥇', '🥈', '🥉'];
    const lines  = await Promise.all(lb.map(async (u, i) => {
      const member = await interaction.guild.members.fetch(u.user_id).catch(() => null);
      const name   = member?.user.username || 'Membre inconnu';
      return `${medals[i] || `**${i+1}.**`} **${name}** — ${(u.wallet + u.bank).toLocaleString()} 🪙`;
    }));
    return interaction.editReply({ embeds: [new EmbedBuilder().setColor('#FFD700')
      .setTitle('🏆 Classement des plus riches')
      .setDescription(lines.join('\n') || 'Aucun membre').setTimestamp()] });
  },
};

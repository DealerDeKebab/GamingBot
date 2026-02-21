const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { gameSessions } = require('../../database/database');

function formatDuration(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours === 0) return `${minutes}min`;
  return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gamestats')
    .setDescription('📊 Statistiques de jeu')
    .addSubcommand(s => s.setName('me').setDescription('Voir tes stats de jeu'))
    .addSubcommand(s => s.setName('user').setDescription('Voir les stats d\'un membre')
      .addUserOption(o => o.setName('membre').setDescription('Le membre').setRequired(true)))
    .addSubcommand(s => s.setName('game').setDescription('Stats d\'un jeu sur le serveur')
      .addStringOption(o => o.setName('jeu').setDescription('Nom du jeu').setRequired(true)))
    .addSubcommand(s => s.setName('leaderboard').setDescription('Top joueurs d\'un jeu')
      .addStringOption(o => o.setName('jeu').setDescription('Nom du jeu').setRequired(true)))
    .addSubcommand(s => s.setName('top').setDescription('Top 10 jeux les plus joués')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'me' || sub === 'user') {
      const targetUser = sub === 'user' 
        ? interaction.options.getUser('membre')
        : interaction.user;

      const stats = gameSessions.getUserStats(targetUser.id, interaction.guild.id);
      
      if (stats.length === 0) {
        return interaction.reply({ 
          content: `❌ ${targetUser.id === interaction.user.id ? 'Tu n\'as' : 'Ce membre n\'a'} pas encore de stats de jeu !`, 
          ephemeral: true 
        });
      }

      const totalTime = stats.reduce((sum, s) => sum + s.total_time, 0);
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`🎮 Stats de Jeu — ${targetUser.username}`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setDescription(`⏱️ Temps total : **${formatDuration(totalTime)}**\n\n**Jeux joués :**`)
        .setTimestamp();

      stats.slice(0, 10).forEach((game, index) => {
        const percentage = ((game.total_time / totalTime) * 100).toFixed(1);
        embed.addFields({
          name: `${index + 1}. ${game.game_name}`,
          value: `⏱️ ${formatDuration(game.total_time)} (${percentage}%)`,
          inline: true
        });
      });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'game') {
      const gameName = interaction.options.getString('jeu');
      const stats = gameSessions.getGameStats(interaction.guild.id, gameName);

      if (!stats || stats.total_time === null) {
        return interaction.reply({ content: `❌ Aucune donnée pour **${gameName}** !`, ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle(`📊 Stats de ${gameName}`)
        .addFields(
          { name: '⏱️ Temps total', value: formatDuration(stats.total_time), inline: true },
          { name: '👥 Joueurs', value: `${stats.players}`, inline: true }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'leaderboard') {
      const gameName = interaction.options.getString('jeu');
      const players = gameSessions.getLeaderboard(interaction.guild.id, gameName, 10);

      if (players.length === 0) {
        return interaction.reply({ content: `❌ Aucun joueur pour **${gameName}** !`, ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle(`🏆 Top 10 — ${gameName}`)
        .setDescription(
          players.map((p, i) => {
            const medals = ['🥇', '🥈', '🥉'];
            const medal = medals[i] || `${i + 1}.`;
            return `${medal} <@${p.user_id}> — ${formatDuration(p.total_time)}`;
          }).join('\n')
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'top') {
      const games = gameSessions.getTopGames(interaction.guild.id, 10);

      if (games.length === 0) {
        return interaction.reply({ content: '❌ Aucune donnée de jeu disponible !', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🏆 Top 10 Jeux Les Plus Joués')
        .setDescription(
          games.map((g, i) => {
            const medals = ['🥇', '🥈', '🥉'];
            const medal = medals[i] || `${i + 1}.`;
            return `${medal} **${g.game_name}**\n└ ${formatDuration(g.total_time)} • ${g.players} joueur${g.players > 1 ? 's' : ''}`;
          }).join('\n\n')
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  },
};

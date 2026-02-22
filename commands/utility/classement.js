const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { xp, reputation, achievements, gameSessions, economy } = require('../../database/database');

// Fonction pour calculer le score global d'un membre
function calculateGlobalScore(userId, guildId) {
  // XP & Niveau (40%)
  const xpData = xp.getUser(userId, guildId);
  const xpScore = xpData ? (xpData.level * 100 + xpData.xp / 10) : 0;
  
  // Réputation (25%)
  const rep = reputation.get(userId, guildId);
  const repScore = Math.max(0, rep.points * 50); // Négatif = 0
  
  // Achievements (20%)
  const userAchievements = achievements.getUser(userId, guildId);
  const achScore = userAchievements.length * 100;
  
  // Temps de jeu (10%)
  const sessions = gameSessions.getUserSessions(userId, guildId);
  const totalGameTime = sessions.reduce((sum, s) => sum + (s.end_time ? (s.end_time - s.start_time) : 0), 0);
  const gameScore = totalGameTime / (1000 * 60 * 60); // Heures → points
  
  // Richesse (5%)
  const ecoData = economy.get(userId, guildId);
  const wealthScore = ecoData ? (ecoData.wallet + ecoData.bank) / 100 : 0;
  
  // Calcul pondéré
  const totalScore = Math.round(
    (xpScore * 0.40) +
    (repScore * 0.25) +
    (achScore * 0.20) +
    (gameScore * 0.10) +
    (wealthScore * 0.05)
  );
  
  return {
    total: totalScore,
    breakdown: {
      xp: Math.round(xpScore * 0.40),
      reputation: Math.round(repScore * 0.25),
      achievements: Math.round(achScore * 0.20),
      gaming: Math.round(gameScore * 0.10),
      wealth: Math.round(wealthScore * 0.05)
    },
    raw: {
      level: xpData?.level || 0,
      xp: xpData?.xp || 0,
      rep: rep.points,
      achievements: userAchievements.length,
      gameHours: Math.round(totalGameTime / (1000 * 60 * 60) * 10) / 10,
      coins: ecoData ? ecoData.wallet + ecoData.bank : 0
    }
  };
}

// Fonction pour obtenir le badge selon le rang
function getRankBadge(rank) {
  if (rank === 1) return '👑 MEMBRE ULTIME';
  if (rank === 2) return '🥈 VICE-CHAMPION';
  if (rank === 3) return '🥉 PODIUM';
  if (rank <= 5) return '⭐ TOP 5';
  if (rank <= 10) return '✨ TOP 10';
  return '🎯 Classé';
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('classement')
    .setDescription('🏆 Classement global du serveur')
    .addSubcommand(s => s.setName('global').setDescription('Voir le classement global'))
    .addSubcommand(s => s.setName('score').setDescription('Voir ton score détaillé')
      .addUserOption(o => o.setName('membre').setDescription('Membre (sinon toi)').setRequired(false))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'global') {
      await interaction.deferReply();

      // Récupérer tous les membres actifs
      const allXP = xp.getAll(interaction.guildId);
      
      if (!allXP.length) {
        return interaction.editReply('❌ Aucun membre actif !');
      }

      // Calculer les scores pour chaque membre
      const scores = [];
      
      for (const userData of allXP) {
        const score = calculateGlobalScore(userData.user_id, interaction.guildId);
        scores.push({
          userId: userData.user_id,
          score: score.total,
          breakdown: score.breakdown,
          raw: score.raw
        });
      }

      // Trier par score décroissant
      scores.sort((a, b) => b.score - a.score);

      // Prendre le top 10
      const top10 = scores.slice(0, 10);

      let description = '**🏆 Les meilleurs membres du serveur 🏆**\n\n';
      
      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

      for (let i = 0; i < top10.length; i++) {
        const entry = top10[i];
        const member = await interaction.guild.members.fetch(entry.userId).catch(() => null);
        if (!member) continue;

        const badge = getRankBadge(i + 1);
        
        description += `${medals[i]} **${member.user.username}** ${badge}\n`;
        description += `┗━ 📊 Score : **${entry.score.toLocaleString()}** pts\n`;
        description += `┗━ ⭐ Niv.${entry.raw.level} • 💌 ${entry.raw.rep} rep • 🏅 ${entry.raw.achievements}/22\n\n`;
      }

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🏆 CLASSEMENT GLOBAL DU SERVEUR')
        .setDescription(description)
        .addFields({
          name: '📊 Composition du Score',
          value: '⭐ XP/Niveau (40%) • 💌 Réputation (25%) • 🏅 Achievements (20%)\n🎮 Temps de jeu (10%) • 💰 Richesse (5%)',
          inline: false
        })
        .setFooter({ text: `${scores.length} membres classés • Utilise /classement score pour voir ton détail` })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'score') {
      const target = interaction.options.getUser('membre') || interaction.user;
      
      const score = calculateGlobalScore(target.id, interaction.guildId);
      
      // Calculer le rang
      const allXP = xp.getAll(interaction.guildId);
      const allScores = allXP.map(u => ({
        userId: u.user_id,
        score: calculateGlobalScore(u.user_id, interaction.guildId).total
      })).sort((a, b) => b.score - a.score);
      
      const rank = allScores.findIndex(s => s.userId === target.id) + 1;
      const badge = getRankBadge(rank);

      const embed = new EmbedBuilder()
        .setColor(rank === 1 ? '#FFD700' : rank <= 3 ? '#C0C0C0' : '#5865F2')
        .setTitle(`🏆 Score Global de ${target.username}`)
        .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
          {
            name: '📊 Score Total',
            value: `**${score.total.toLocaleString()}** points`,
            inline: true
          },
          {
            name: '🏆 Classement',
            value: `**#${rank}** / ${allScores.length}\n${badge}`,
            inline: true
          },
          {
            name: '\u200b',
            value: '\u200b',
            inline: true
          },
          {
            name: '━━━━━ Détail du Score ━━━━━',
            value: 
              `⭐ **XP/Niveau** → ${score.breakdown.xp.toLocaleString()} pts *(Niv.${score.raw.level})*\n` +
              `💌 **Réputation** → ${score.breakdown.reputation.toLocaleString()} pts *(${score.raw.rep} rep)*\n` +
              `🏅 **Achievements** → ${score.breakdown.achievements.toLocaleString()} pts *(${score.raw.achievements}/22)*\n` +
              `🎮 **Gaming** → ${score.breakdown.gaming.toLocaleString()} pts *(${score.raw.gameHours}h jouées)*\n` +
              `💰 **Richesse** → ${score.breakdown.wealth.toLocaleString()} pts *(${score.raw.coins.toLocaleString()} coins)*`,
            inline: false
          }
        )
        .setFooter({ text: 'Continue à être actif pour grimper dans le classement !' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  },
};

const { EmbedBuilder } = require('discord.js');
const { gameSessions } = require('../database/database');
const cron = require('node-cron');

let leaderboardMessage = null;
let leaderboardChannelId = null;
let previousGamesData = {}; // Pour tracker les tendances

// Emojis de jeux populaires
const GAME_EMOJIS = {
  'counter-strike 2': '🎯',
  'cs2': '🎯',
  'counter-strike': '🎯',
  'valorant': '⚔️',
  'rocket league': '🚗',
  'league of legends': '🧙',
  'fortnite': '🏝️',
  'minecraft': '⛏️',
  'apex legends': '🎮',
  'call of duty': '🔫',
  'overwatch': '🎯',
  'dota 2': '⚡',
  'among us': '🚀',
  'gta v': '🚓',
  'rust': '⚒️',
  'terraria': '⛏️',
  'stardew valley': '🌾',
  'the finals': '💥',
  'rainbow six siege': '🎯',
  'fifa': '⚽',
  'fc': '⚽',
};

function getGameEmoji(gameName) {
  const name = gameName.toLowerCase();
  for (const [key, emoji] of Object.entries(GAME_EMOJIS)) {
    if (name.includes(key)) return emoji;
  }
  return '🎮'; // Emoji par défaut
}

function formatDuration(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours === 0) return `${minutes}min`;
  return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
}

function getTrend(gameName, currentTime, guildId) {
  const key = `${guildId}_${gameName}`;
  const previous = previousGamesData[key] || 0;
  const diff = currentTime - previous;
  
  previousGamesData[key] = currentTime;
  
  if (diff > 3600000) return `↗️ +${formatDuration(diff)}`;
  if (diff < -3600000) return `↘️ ${formatDuration(Math.abs(diff))}`;
  return ''; // Pas de changement significatif
}

function getProgressBar(value, max, length = 20) {
  const percentage = Math.min((value / max) * 100, 100);
  const filled = Math.floor((percentage / 100) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

async function updateGameLeaderboard(client) {
  if (!leaderboardChannelId) {
    leaderboardChannelId = process.env.GAMESTATS_CHANNEL_ID;
    if (!leaderboardChannelId) return;
  }

  for (const guild of client.guilds.cache.values()) {
    const channel = guild.channels.cache.get(leaderboardChannelId);
    if (!channel) continue;

    const games = gameSessions.getTopGames(guild.id, 10);

    if (games.length === 0) {
      if (!leaderboardMessage) {
        const embed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('🏆 TOP 10 JEUX LES PLUS JOUÉS')
          .setDescription('*Aucune donnée disponible pour le moment...*\n\nCommencez à jouer pour apparaître ici !')
          .setFooter({ text: 'Mise à jour automatique toutes les 10 min' })
          .setTimestamp();

        leaderboardMessage = await channel.send({ embeds: [embed] });
      }
      return;
    }

    // Calculer le temps total
    const totalTime = games.reduce((sum, g) => sum + g.total_time, 0);
    const totalPlayers = new Set(games.flatMap(g => Array(g.players).fill(null))).size;

    // Construire le podium (top 3)
    let podiumText = '';
    const medals = ['🥇', '🥈', '🥉'];
    
    for (let i = 0; i < Math.min(3, games.length); i++) {
      const game = games[i];
      const emoji = getGameEmoji(game.game_name);
      const trend = getTrend(game.game_name, game.total_time, guild.id);
      const percentage = ((game.total_time / totalTime) * 100).toFixed(0);
      const progressBar = getProgressBar(game.total_time, totalTime);
      
      podiumText += `${medals[i]} ${emoji} **${game.game_name}** — ${formatDuration(game.total_time)} ${trend}\n`;
      podiumText += `${progressBar} ${percentage}%\n`;
      podiumText += `👥 ${game.players} joueur${game.players > 1 ? 's' : ''}\n\n`;
    }

    // Construire le classement (4-10)
    let rankingText = '';
    const rankEmojis = ['4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    
    for (let i = 3; i < games.length; i++) {
      const game = games[i];
      const emoji = getGameEmoji(game.game_name);
      rankingText += `${rankEmojis[i - 3]} ${emoji} **${game.game_name}** — ${formatDuration(game.total_time)} • 👥 ${game.players}\n`;
    }

    // Construire l'embed
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🏆 TOP 10 JEUX LES PLUS JOUÉS')
      .setDescription(
        `━━━━━━━ **PODIUM** ━━━━━━━\n\n${podiumText}` +
        (rankingText ? `━━━━━ **CLASSEMENT** ━━━━━\n\n${rankingText}\n` : '') +
        `━━━━━━━━━━━━━━━━━━━━━\n📊 Temps total : **${formatDuration(totalTime)}**\n⏱️ Mis à jour <t:${Math.floor(Date.now() / 1000)}:R>`
      )
      .setFooter({ text: '🔄 Prochaine MAJ dans 10 min' })
      .setTimestamp();

    if (!leaderboardMessage) {
      leaderboardMessage = await channel.send({ embeds: [embed] });
    } else {
      try {
        await leaderboardMessage.edit({ embeds: [embed] });
      } catch (error) {
        leaderboardMessage = await channel.send({ embeds: [embed] });
      }
    }

    console.log('📊 Leaderboard jeux mis à jour (version stylée)');
  }
}

function startGameLeaderboardUpdater(client) {
  cron.schedule('*/10 * * * *', () => updateGameLeaderboard(client));
  setTimeout(() => updateGameLeaderboard(client), 30000);
  console.log('📊 Auto-update leaderboard jeux activé (toutes les 10 min)');
}

module.exports = { startGameLeaderboardUpdater, updateGameLeaderboard };

const { EmbedBuilder } = require('discord.js');
const { gameSessions } = require('../database/database');
const cron = require('node-cron');

let leaderboardMessage = null;
let leaderboardChannelId = null;

function formatDuration(ms) {
  const hours = Math.floor(ms / 3600000);
  return `${hours}h`;
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
      // Pas encore de données
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

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🏆 TOP 10 JEUX LES PLUS JOUÉS')
      .setDescription(
        games.map((g, i) => {
          const emojis = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
          const emoji = emojis[i] || `${i + 1}.`;
          return `${emoji} **${g.game_name}**\n└ ${formatDuration(g.total_time)} • ${g.players} joueur${g.players > 1 ? 's' : ''}`;
        }).join('\n\n')
      )
      .setFooter({ text: 'Mise à jour automatique toutes les 10 min' })
      .setTimestamp();

    if (!leaderboardMessage) {
      // Créer le message initial
      leaderboardMessage = await channel.send({ embeds: [embed] });
    } else {
      // Mettre à jour le message existant
      try {
        await leaderboardMessage.edit({ embeds: [embed] });
      } catch (error) {
        // Si le message n'existe plus, en créer un nouveau
        leaderboardMessage = await channel.send({ embeds: [embed] });
      }
    }

    console.log('📊 Leaderboard jeux mis à jour');
  }
}

function startGameLeaderboardUpdater(client) {
  // Mise à jour toutes les 10 minutes
  cron.schedule('*/10 * * * *', () => updateGameLeaderboard(client));
  
  // Première mise à jour au démarrage (après 30 secondes)
  setTimeout(() => updateGameLeaderboard(client), 30000);
  
  console.log('📊 Auto-update leaderboard jeux activé (toutes les 10 min)');
}

module.exports = { startGameLeaderboardUpdater, updateGameLeaderboard };

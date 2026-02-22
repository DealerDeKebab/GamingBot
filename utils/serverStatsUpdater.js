const { EmbedBuilder } = require('discord.js');
const { xp, economy, gameSessions, achievements, db } = require('../database/database');
const cron = require('node-cron');

let statsChannelId = null;

// Sauvegarder/récupérer l'ID du message en base
function saveStatsMessageId(guildId, messageId) {
  db.prepare('INSERT OR REPLACE INTO server_stats_message (guild_id, message_id) VALUES (?, ?)').run(guildId, messageId);
}

function getStatsMessageId(guildId) {
  const result = db.prepare('SELECT message_id FROM server_stats_message WHERE guild_id = ?').get(guildId);
  return result?.message_id;
}

function formatDuration(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours === 0) return `${minutes}min`;
  return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
}

async function updateServerStats(client) {
  if (!statsChannelId) {
    statsChannelId = process.env.SERVERSTATS_CHANNEL_ID;
    if (!statsChannelId) return;
  }

  for (const guild of client.guilds.cache.values()) {
    const channel = guild.channels.cache.get(statsChannelId);
    if (!channel) continue;

    // Récupérer l'ID du message sauvegardé
    const savedMessageId = getStatsMessageId(guild.id);
    let statsMessage = null;

    if (savedMessageId) {
      try {
        statsMessage = await channel.messages.fetch(savedMessageId);
      } catch (error) {
        statsMessage = null;
      }
    }

    // === RÉCUPÉRER LES DONNÉES ===
    const totalMembers = guild.memberCount;
    const onlineMembers = guild.members.cache.filter(m => m.presence?.status !== 'offline').size;
    const botCount = guild.members.cache.filter(m => m.user.bot).size;
    const humanCount = totalMembers - botCount;

    // Stats XP
    const allUsers = xp.getAll(guild.id);
    const totalMessages = allUsers.reduce((sum, u) => sum + u.messages, 0);
    const avgLevel = allUsers.length > 0 ? (allUsers.reduce((sum, u) => sum + u.level, 0) / allUsers.length).toFixed(1) : 0;

    // Top 3 membres XP
    const topXP = allUsers
      .sort((a, b) => {
        const levelDiff = b.level - a.level;
        return levelDiff !== 0 ? levelDiff : b.xp - a.xp;
      })
      .slice(0, 3);

    // Stats gaming
    const topGames = gameSessions.getTopGames(guild.id, 3);
    const totalGameTime = topGames.reduce((sum, g) => sum + g.total_time, 0);

    // Stats économie
    const allEconomy = economy.leaderboard(guild.id, 999);
    const totalCoins = allEconomy.reduce((sum, u) => sum + u.wallet + u.bank, 0);
    const topRich = economy.leaderboard(guild.id, 3);

    // Stats achievements
    const allAchievements = [];
    for (const user of allUsers) {
      const userAch = achievements.getUser(user.user_id, guild.id);
      allAchievements.push(...userAch);
    }
    const totalUnlocked = allAchievements.length;
    const totalPossible = allUsers.length * 22;
    const completionRate = totalPossible > 0 ? ((totalUnlocked / totalPossible) * 100).toFixed(1) : 0;

    // === CRÉER L'EMBED ===
    let description = `━━━━━━━ **MEMBRES** ━━━━━━━\n\n`;
    description += `👥 **${humanCount}** humains • **${botCount}** bots\n`;
    description += `🟢 **${onlineMembers}** en ligne\n\n`;

    description += `━━━━━━━ **ACTIVITÉ** ━━━━━━━\n\n`;
    description += `💬 **${totalMessages.toLocaleString()}** messages envoyés\n`;
    description += `📊 Niveau moyen : **${avgLevel}**\n`;
    description += `👤 **${allUsers.length}** membres actifs\n\n`;

    if (topXP.length > 0) {
      description += `━━━━━━ **TOP MEMBRES** ━━━━━━\n\n`;
      const medals = ['🥇', '🥈', '🥉'];
      for (let i = 0; i < Math.min(3, topXP.length); i++) {
        const user = topXP[i];
        const member = await guild.members.fetch(user.user_id).catch(() => null);
        description += `${medals[i]} **${member?.user.username || 'Inconnu'}** — Niv. ${user.level}\n`;
      }
      description += '\n';
    }

    description += `━━━━━━━ **ÉCONOMIE** ━━━━━━━\n\n`;
    description += `💰 **${totalCoins.toLocaleString()}** coins en circulation\n`;
    if (topRich.length > 0) {
      const richest = topRich[0];
      const member = await guild.members.fetch(richest.user_id).catch(() => null);
      description += `🏆 Plus riche : **${member?.user.username || 'Inconnu'}** (${(richest.wallet + richest.bank).toLocaleString()})\n`;
    }
    description += '\n';

    if (topGames.length > 0) {
      description += `━━━━━━━ **GAMING** ━━━━━━━\n\n`;
      description += `⏱️ **${formatDuration(totalGameTime)}** joués\n`;
      description += `🎮 Top jeu : **${topGames[0].game_name}**\n\n`;
    }

    description += `━━━━━ **ACHIEVEMENTS** ━━━━━\n\n`;
    description += `🏅 **${totalUnlocked}** / ${totalPossible} débloqués\n`;
    description += `📈 Taux : **${completionRate}%**\n\n`;

    description += `━━━━━━━━━━━━━━━━━━━━━\n`;
    description += `⏱️ Mis à jour <t:${Math.floor(Date.now() / 1000)}:R>`;

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`📊 ${guild.name} — Statistiques Live`)
      .setDescription(description)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .setFooter({ text: '🔄 Prochaine MAJ dans 1 heure' })
      .setTimestamp();

    if (!statsMessage) {
      statsMessage = await channel.send({ embeds: [embed] });
      saveStatsMessageId(guild.id, statsMessage.id);
    } else {
      await statsMessage.edit({ embeds: [embed] });
    }

    console.log('📊 Stats serveur mises à jour');
  }
}

function startServerStatsUpdater(client) {
  // Toutes les heures
  cron.schedule('0 * * * *', () => updateServerStats(client));
  
  // Premier update 30s après le démarrage
  setTimeout(() => updateServerStats(client), 30000);
  
  console.log('📊 Auto-update stats serveur activé (toutes les heures)');
}

module.exports = { startServerStatsUpdater, updateServerStats };

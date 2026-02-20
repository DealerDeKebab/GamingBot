const { EmbedBuilder } = require('discord.js');
const { challenges, economy } = require('../database/database');

const CHALLENGE_TYPES = [
  { type: 'messages', label: '📝 Envoyez {target} messages collectivement', target: 500, reward: 200 },
  { type: 'messages', label: '📝 Envoyez {target} messages collectivement', target: 1000, reward: 300 },
  { type: 'xp', label: '⭐ Gagnez {target} XP collectivement', target: 5000, reward: 250 },
  { type: 'coins_bet', label: '🎲 Misez {target} coins dans les paris', target: 1000, reward: 300 },
  { type: 'unique_members', label: '👥 {target} membres différents doivent être actifs', target: 10, reward: 250 },
];

async function createDailyChallenge(client) {
  const today = new Date().toISOString().split('T')[0];
  
  for (const guild of client.guilds.cache.values()) {
    const existing = challenges.getCurrent(guild.id);
    if (existing) continue;

    const challengeType = CHALLENGE_TYPES[Math.floor(Math.random() * CHALLENGE_TYPES.length)];
    
    challenges.create({
      guildId: guild.id,
      date: today,
      type: challengeType.type,
      target: challengeType.target,
    });

    const channelId = process.env.CHALLENGE_CHANNEL_ID;
    if (!channelId) continue;

    const channel = guild.channels.cache.get(channelId);
    if (!channel) continue;

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🎯 Nouveau défi quotidien !')
      .setDescription(
        `**${challengeType.label.replace('{target}', challengeType.target.toLocaleString())}**\n\n` +
        `Progression : 0/${challengeType.target.toLocaleString()}\n` +
        `░░░░░░░░░░░░░░░░░░░░ 0%\n\n` +
        `💰 Récompense : **${challengeType.reward} 🪙** pour tout le monde !\n` +
        `🏆 Top 3 contributeurs : **+${Math.floor(challengeType.reward / 2)} 🪙** bonus\n\n` +
        `Utilisez \`/defi actuel\` pour voir la progression en temps réel !`
      )
      .setFooter({ text: 'Le défi se termine à minuit' })
      .setTimestamp();

    await channel.send({ content: '@everyone', embeds: [embed] });
  }
}

function updateChallengeProgress(guildId, userId, type, amount = 1) {
  const challenge = challenges.getCurrent(guildId);
  if (!challenge || challenge.status !== 'active' || challenge.type !== type) return;

  const contributors = JSON.parse(challenge.contributors || '{}');
  
  if (type === 'unique_members') {
    contributors[userId] = 1;
  } else {
    contributors[userId] = (contributors[userId] || 0) + amount;
  }

  const newProgress = type === 'unique_members' 
    ? Object.keys(contributors).length 
    : Object.values(contributors).reduce((sum, val) => sum + val, 0);

  challenges.updateProgress(challenge.id, newProgress, contributors);

  if (newProgress >= challenge.target) {
    completeChallenge(challenge.id, guildId);
  }
}

async function completeChallenge(challengeId, guildId) {
  const challenge = challenges.getCurrent(guildId);
  if (!challenge || challenge.status !== 'active') return;

  challenges.complete(challengeId);

  const challengeType = CHALLENGE_TYPES.find(c => c.type === challenge.type && c.target === challenge.target);
  const reward = challengeType?.reward || 200;

  const contributors = JSON.parse(challenge.contributors || '{}');
  const topContributors = Object.entries(contributors).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const { db } = require('../database/database');
  const allMembers = db.prepare('SELECT DISTINCT user_id FROM economy WHERE guild_id=?').all(guildId);
  
  for (const member of allMembers) {
    economy.addWallet(member.user_id, guildId, reward);
  }

  const bonusReward = Math.floor(reward / 2);
  for (const [userId] of topContributors) {
    economy.addWallet(userId, guildId, bonusReward);
  }

  console.log(`✅ Défi terminé pour ${guildId} — ${allMembers.length} membres récompensés`);
}

async function checkExpiredChallenges(client) {
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  for (const guild of client.guilds.cache.values()) {
    const { db } = require('../database/database');
    const expiredChallenges = db.prepare('SELECT * FROM daily_challenges WHERE guild_id=? AND date=? AND status="active"').all(guild.id, yesterday);
    
    for (const challenge of expiredChallenges) {
      challenges.fail(challenge.id);
      console.log(`❌ Défi échoué pour ${guild.id}`);
    }
  }
}

module.exports = { createDailyChallenge, updateChallengeProgress, checkExpiredChallenges };

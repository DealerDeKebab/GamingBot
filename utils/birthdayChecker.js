const { EmbedBuilder } = require('discord.js');
const { birthday } = require('../database/database');
const cron = require('node-cron');

const activeBirthdays = new Map(); // Pour tracker qui a le rôle

async function checkBirthdays(client) {
  const birthdayChannelId = process.env.BIRTHDAY_CHANNEL_ID;
  const birthdayRoleId = process.env.BIRTHDAY_ROLE_ID;
  
  if (!birthdayChannelId) return;

  const now = new Date();
  const today = now.getDate();
  const month = now.getMonth() + 1;

  for (const [guildId, guild] of client.guilds.cache) {
    const todayBirthdays = birthday.today(guildId);
    if (!todayBirthdays.length) continue;

    const channel = guild.channels.cache.get(birthdayChannelId);
    if (!channel) continue;

    const role = birthdayRoleId ? guild.roles.cache.get(birthdayRoleId) : null;

    for (const b of todayBirthdays) {
      const key = `${guildId}-${b.user_id}`;
      
      // Vérifier si on a déjà souhaité aujourd'hui
      if (activeBirthdays.has(key)) {
        const bdayData = activeBirthdays.get(key);
        if (bdayData.day === today && bdayData.month === month) {
          continue;
        }
      }

      try {
        const member = await guild.members.fetch(b.user_id);
        if (!member) continue;

        // Donner le rôle si configuré
        if (role && !member.roles.cache.has(birthdayRoleId)) {
          await member.roles.add(role);
        }

        const age = b.year ? now.getFullYear() - b.year : null;

        const embed = new EmbedBuilder()
          .setColor('#FF69B4')
          .setTitle('🎂 Joyeux Anniversaire ! 🎉')
          .setDescription(
            `🎉 Toute la communauté souhaite un joyeux anniversaire à ${member} !\n` +
            (age ? `🎈 ${age} ans aujourd'hui !\n` : '') +
            '\n🎮 On te souhaite une super journée full gaming ! 🎁'
          )
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
          .setImage('https://media.giphy.com/media/g5R9dok94mrIvplmZd/giphy.gif')
          .setTimestamp();

        await channel.send({ content: '@everyone', embeds: [embed] });

        // Marquer comme souhaité
        activeBirthdays.set(key, {
          day: today,
          month: month,
          grantedAt: Date.now()
        });

        console.log(`🎂 Anniversaire souhaité à ${member.user.username}`);
      } catch (error) {
        console.error(`Erreur anniversaire:`, error);
      }
    }
  }
}

async function removeExpiredBirthdayRoles(client) {
  const birthdayRoleId = process.env.BIRTHDAY_ROLE_ID;
  if (!birthdayRoleId) return;

  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;

  for (const [key, data] of activeBirthdays.entries()) {
    if (now - data.grantedAt > dayInMs) {
      const [guildId, userId] = key.split('-');
      
      try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) continue;

        const member = await guild.members.fetch(userId);
        const role = guild.roles.cache.get(birthdayRoleId);

        if (member && role && member.roles.cache.has(birthdayRoleId)) {
          await member.roles.remove(role);
          console.log(`🎂 Rôle anniversaire retiré de ${member.user.username}`);
        }

        activeBirthdays.delete(key);
      } catch (error) {
        console.error(`Erreur retrait rôle:`, error);
      }
    }
  }
}

function startBirthdayChecker(client) {
  // Vérifier les anniversaires tous les jours à minuit
  cron.schedule('0 0 * * *', () => checkBirthdays(client));

  // Retirer les rôles expirés toutes les heures
  cron.schedule('0 * * * *', () => removeExpiredBirthdayRoles(client));

  // Premier check 1 minute après le démarrage
  setTimeout(() => {
    checkBirthdays(client);
    removeExpiredBirthdayRoles(client);
  }, 60000);

  console.log('🎂 Auto-check anniversaires activé (minuit + retrait auto rôle 24h)');
}

module.exports = { checkBirthdays, startBirthdayChecker };

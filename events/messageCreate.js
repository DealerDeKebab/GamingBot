const { EmbedBuilder, ChannelType } = require('discord.js');
const { xp, captcha, verify, economy, shop } = require('../database/database');

const SPAM_MAX      = 5;       // messages max par fenêtre
const SPAM_WINDOW   = 5000;    // fenêtre en ms
const SPAM_MUTE_MS  = 5 * 60 * 1000;  // durée mute auto (5 min)
const XP_COOLDOWN   = 60000;   // cooldown XP en ms
const XP_MIN        = 15;
const XP_MAX        = 25;

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;

    // ── Captcha en DM ──────────────────────────────────────
    if (message.channel.type === ChannelType.DM) {
      await handleCaptcha(message, client);
      return;
    }
    if (!message.guild) return;

    // ── Anti-spam ──────────────────────────────────────────
    await handleAntiSpam(message, client);

    // ── XP ─────────────────────────────────────────────────
    await handleXP(message, client);
    // Coins gagnés en chattant (5-15 coins par message)
    economy.create(message.author.id, message.guild.id);
    const baseCoins = Math.floor(Math.random() * 11) + 5;
    const coinsMultiplier = shop.getBoostMultiplier(message.author.id, message.guild.id, 'coins');
    const finalCoins = Math.floor(baseCoins * coinsMultiplier);
    economy.addWallet(message.author.id, message.guild.id, finalCoins);
  },
};

// ── Captcha ─────────────────────────────────────────────────
async function handleCaptcha(message, client) {
  for (const [guildId, guild] of client.guilds.cache) {
    const pending = captcha.get(message.author.id, guildId);
    if (!pending) continue;

    const member = guild.members.cache.get(message.author.id);
    if (!member) continue;

    // Expiré (10 min)
    if (Date.now() - pending.timestamp > 10 * 60 * 1000) {
      captcha.remove(message.author.id, guildId);
      await message.reply('⏱️ Ton code a **expiré**. Rejoins le serveur à nouveau pour obtenir un nouveau code.');
      try { await member.kick('Captcha expiré'); } catch {}
      return;
    }

    if (message.content.trim().toUpperCase() === pending.code.toUpperCase()) {
      // ✅ Succès
      captcha.remove(message.author.id, guildId);
      verify.verify(message.author.id, guildId);

      const memberRole = guild.roles.cache.get(process.env.MEMBER_ROLE_ID);
      if (memberRole) await member.roles.add(memberRole).catch(() => {});

      await message.reply('✅ **Captcha validé !** Tu as maintenant accès au serveur. Bienvenue ! 🎮');

      // Message de bienvenue
      const welcomeCh = guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID);
      if (welcomeCh) {
        const embed = new EmbedBuilder()
          .setColor('#00FF7F')
          .setTitle('🎮 Nouveau membre !')
          .setDescription(
            `Bienvenue **${message.author.username}** ! Tu es notre **${guild.memberCount}ème** membre ! 🚀\n\n` +
            `📜 Lis le **règlement** pour découvrir tous nos salons\n` +
            `🎮 Choisis tes jeux dans **#rôles-jeux**\n` +
            `🔥 Chatte pour gagner de l'XP et monter de niveau !`
          )
          .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
          .setTimestamp();
        welcomeCh.send({ content: `<@${message.author.id}>`, embeds: [embed] });
      }
    } else {
      // ❌ Mauvais code
      captcha.incr(message.author.id, guildId);
      const updated = captcha.get(message.author.id, guildId);

      if (updated.attempts >= 3) {
        captcha.remove(message.author.id, guildId);
        await message.reply('❌ Trop d\'erreurs ! Tu as été **expulsé**. Rejoins à nouveau pour réessayer.');
        try { await member.kick('Captcha échoué (3 tentatives)'); } catch {}
      } else {
        await message.reply(
          `❌ Code incorrect. Il te reste **${3 - updated.attempts}** essai(s).\n` +
          `Rappel du code : \`${pending.code}\``
        );
      }
    }
    return;
  }
}

// ── Anti-spam ────────────────────────────────────────────────
async function handleAntiSpam(message, client) {
  const key  = `${message.author.id}-${message.guild.id}`;
  const now  = Date.now();
  const data = client.spamMap.get(key) || { count: 0, reset: now, warned: false };

  if (now - data.reset > SPAM_WINDOW) {
    data.count = 0; data.reset = now; data.warned = false;
  }
  data.count++;
  client.spamMap.set(key, data);

  if (data.count > SPAM_MAX) {
    const member = message.guild.members.cache.get(message.author.id);
    if (!member || member.permissions.has('ManageMessages')) return;

    try { await message.delete(); } catch {}

    if (!data.warned) {
      data.warned = true;
      client.spamMap.set(key, data);

      // Mute timeout 5 min
      try { await member.timeout(SPAM_MUTE_MS, 'Anti-spam automatique'); } catch {}

      const warn = await message.channel.send({
        content: `⚠️ **${message.author}** tu spammes trop vite ! Mute automatique **5 minutes**.`,
      });
      setTimeout(() => warn.delete().catch(() => {}), 8000);

      // Log
      const logCh = message.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
      if (logCh) {
        logCh.send({ embeds: [
          new EmbedBuilder()
            .setColor('#FF6B00')
            .setTitle('🚫 Anti-Spam')
            .addFields(
              { name: 'Membre',  value: `${message.author.tag} (${message.author.id})`, inline: true },
              { name: 'Salon',   value: `${message.channel}`, inline: true },
              { name: 'Action',  value: 'Mute 5 minutes auto', inline: true }
            ).setTimestamp()
        ]});
      }
    }
  }
}

// ── XP ───────────────────────────────────────────────────────
async function handleXP(message, client) {
  const user = xp.getUser(message.author.id, message.guild.id);
  if (user && (Date.now() - user.last_xp) < XP_COOLDOWN) return;

  const baseEarned = Math.floor(Math.random() * (XP_MAX - XP_MIN + 1)) + XP_MIN;
  const xpMultiplier = shop.getBoostMultiplier(message.author.id, message.guild.id, 'xp');
  const finalEarned = Math.floor(baseEarned * xpMultiplier);
  xp.addXP(message.author.id, message.guild.id, finalEarned);

  // Tracker pour les défis
  const { updateChallengeProgress } = require('../utils/challengeManager');
  updateChallengeProgress(message.guild.id, message.author.id, 'messages', 1);
  updateChallengeProgress(message.guild.id, message.author.id, 'unique_members', 1);

  const updated   = xp.getUser(message.author.id, message.guild.id);
  const xpNeeded  = xp.xpForLevel(updated.level);

  if (updated.xp >= xpNeeded) {
    const newLvl = updated.level + 1;
    xp.setLevel(message.author.id, message.guild.id, newLvl, updated.xp - xpNeeded);

    // Vérifier les récompenses de niveau
    const rewards = await checkLevelRewards(message, newLvl);

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setDescription(`🎉 GG **${message.author}** ! Tu passes au **niveau ${newLvl}** ! 🚀`)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

    // Ajouter les récompenses à l'embed si il y en a
    if (rewards.length > 0) {
      embed.addFields({
        name: '🎁 Récompenses Débloquées !',
        value: rewards.join('\n'),
        inline: false
      });
    }

    // Envoyer dans le salon dédié si configuré, sinon dans le salon actuel
    const levelUpChannelId = process.env.LEVELUP_CHANNEL_ID;
    const targetChannel = levelUpChannelId 
      ? message.guild.channels.cache.get(levelUpChannelId) 
      : message.channel;

    if (targetChannel) {
      const lvlMsg = await targetChannel.send({ embeds: [embed] });
      // Ne pas supprimer si c'est dans le salon dédié
      if (!levelUpChannelId) {
        setTimeout(() => lvlMsg.delete().catch(() => {}), 12000);
      }
    }
  }
}

// ── Récompenses de Niveau ────────────────────────────────────
async function checkLevelRewards(message, level) {
  const rewards = [];
  const member = message.member;

  // Niveau 5 → Rôle Gamer
  if (level === 5 && process.env.LEVEL_ROLE_5) {
    const role = message.guild.roles.cache.get(process.env.LEVEL_ROLE_5);
    if (role && !member.roles.cache.has(role.id)) {
      await member.roles.add(role);
      rewards.push('🎮 Rôle **Gamer** débloqué !');
    }
  }

  // Niveau 10 → Rôle Guerrier + 1000 coins
  if (level === 10) {
    if (process.env.LEVEL_ROLE_10) {
      const role = message.guild.roles.cache.get(process.env.LEVEL_ROLE_10);
      if (role && !member.roles.cache.has(role.id)) {
        await member.roles.add(role);
        rewards.push('⚔️ Rôle **Guerrier** débloqué !');
      }
    }
    economy.addWallet(message.author.id, message.guild.id, 1000);
    rewards.push('💰 **1000 coins** bonus !');
  }

  // Niveau 20 → Rôle Diamant + 2500 coins
  if (level === 20) {
    if (process.env.LEVEL_ROLE_20) {
      const role = message.guild.roles.cache.get(process.env.LEVEL_ROLE_20);
      if (role && !member.roles.cache.has(role.id)) {
        await member.roles.add(role);
        rewards.push('💎 Rôle **Diamant** débloqué !');
      }
    }
    economy.addWallet(message.author.id, message.guild.id, 2500);
    rewards.push('💰 **2500 coins** bonus !');
  }

  // Niveau 30 → Rôle Légende + 5000 coins
  if (level === 30) {
    if (process.env.LEVEL_ROLE_30) {
      const role = message.guild.roles.cache.get(process.env.LEVEL_ROLE_30);
      if (role && !member.roles.cache.has(role.id)) {
        await member.roles.add(role);
        rewards.push('👑 Rôle **Légende** débloqué !');
      }
    }
    economy.addWallet(message.author.id, message.guild.id, 5000);
    rewards.push('💰 **5000 coins** bonus !');
  }

  // Niveau 50 → Rôle Mythique + 10000 coins
  if (level === 50) {
    if (process.env.LEVEL_ROLE_50) {
      const role = message.guild.roles.cache.get(process.env.LEVEL_ROLE_50);
      if (role && !member.roles.cache.has(role.id)) {
        await member.roles.add(role);
        rewards.push('🌟 Rôle **Mythique** débloqué !');
      }
    }
    economy.addWallet(message.author.id, message.guild.id, 10000);
    rewards.push('💰 **10 000 coins** bonus !');
  }

  return rewards;
}

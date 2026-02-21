const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { xp, birthday, profile, economy, gameSessions, achievements } = require('../../database/database');
const { ACHIEVEMENTS } = require('../../utils/achievementsConfig');

const BANNERS = {
  'Bleu Discord':  '#5865F2',
  'Vert Gaming':   '#00FF7F',
  'Rouge Gamer':   '#FF0000',
  'Or Champion':   '#FFD700',
  'Violet Pro':    '#9146FF',
  'Orange Fire':   '#FF6B00',
  'Rose Kawaii':   '#FF69B4',
  'Noir Elite':    '#2C2F33',
};

const GAME_KEYS = {
  'Rocket League':     'pseudo_rocket_league',
  'CS2':               'pseudo_cs2',
  'Valorant':          'pseudo_valorant',
  'League of Legends': 'pseudo_league_of_legends',
  'Fortnite':          'pseudo_fortnite',
  'Minecraft':         'pseudo_minecraft',
};

const GAME_EMOJIS = {
  'Rocket League':     '🚗',
  'CS2':               '🎯',
  'Valorant':          '⚔️',
  'League of Legends': '🧙',
  'Fortnite':          '🏝️',
  'Minecraft':         '⛏️',
};

function formatDuration(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours === 0) return `${minutes}min`;
  return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
}

function getProgressBar(current, max, length = 20) {
  const percentage = Math.min((current / max) * 100, 100);
  const filled = Math.floor((percentage / 100) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty) + ` ${percentage.toFixed(0)}%`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profil')
    .setDescription('🎮 Profil gaming')
    .addSubcommand(s => s.setName('voir').setDescription('Voir un profil gaming')
      .addUserOption(o => o.setName('membre').setDescription('Membre (optionnel)')))
    .addSubcommand(s => s.setName('bio').setDescription('Modifier ta bio')
      .addStringOption(o => o.setName('texte').setDescription('Ta bio (max 150 caractères)').setRequired(true).setMaxLength(150)))
    .addSubcommand(s => s.setName('pseudo').setDescription('Ajouter ton pseudo dans un jeu')
      .addStringOption(o => {
        o.setName('jeu').setDescription('Jeu').setRequired(true);
        Object.keys(GAME_KEYS).forEach(g => o.addChoices({ name: g, value: g }));
        return o;
      })
      .addStringOption(o => o.setName('pseudo').setDescription('Ton pseudo dans ce jeu').setRequired(true).setMaxLength(32)))
    .addSubcommand(s => s.setName('banniere').setDescription('Changer la couleur de ta bannière')
      .addStringOption(o => {
        o.setName('couleur').setDescription('Couleur').setRequired(true);
        Object.keys(BANNERS).forEach(b => o.addChoices({ name: b, value: BANNERS[b] }));
        return o;
      })),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'voir') {
      const targetUser = interaction.options.getUser('membre') || interaction.user;
      const member = await interaction.guild.members.fetch(targetUser.id);

      await interaction.deferReply();

      // Récupérer toutes les données
      const userData = xp.getUser(targetUser.id, interaction.guild.id) || { level: 0, xp: 0, messages: 0 };
      const profileData = profile.get(targetUser.id, interaction.guild.id) || {};
      const economyData = economy.get(targetUser.id, interaction.guild.id) || { wallet: 0, bank: 0 };
      const topGames = gameSessions.getUserStats(targetUser.id, interaction.guild.id);
      const achievementsData = achievements.getUser(targetUser.id, interaction.guild.id);

      // Calculer le rank
      const allUsers = xp.getAll(interaction.guild.id);
      const sorted = allUsers.sort((a, b) => {
        const levelDiff = b.level - a.level;
        return levelDiff !== 0 ? levelDiff : b.xp - a.xp;
      });
      const guildRank = sorted.findIndex(u => u.user_id === targetUser.id) + 1;

      // Calculer progression XP
      const xpNeeded = xp.xpForLevel(userData.level);
      const xpBar = getProgressBar(userData.xp, xpNeeded);

      // Coins totaux
      const totalCoins = economyData.wallet + economyData.bank;

      // Créer l'embed ultra stylé
      const bannerColor = profileData.banner_color || '#5865F2';
      const embed = new EmbedBuilder()
        .setColor(bannerColor)
        .setAuthor({ 
          name: `${member.user.username} — Niveau ${userData.level}`, 
          iconURL: member.displayAvatarURL({ dynamic: true }) 
        })
        .setThumbnail(member.displayAvatarURL({ dynamic: true, size: 256 }))
        .setDescription(
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🏆 **Classement** : #${guildRank} sur ${allUsers.length}\n` +
          `━━━━━━━━━━━━━━━━━━━━━━`
        )
        .addFields(
          {
            name: '📊 Progression XP',
            value: `\`\`\`${xpBar}\`\`\`\n${userData.xp.toLocaleString()} / ${xpNeeded.toLocaleString()} XP`,
            inline: false
          },
          {
            name: '💰 Économie',
            value: `**${totalCoins.toLocaleString()}** coins\n💵 Wallet: ${economyData.wallet.toLocaleString()}\n🏦 Banque: ${economyData.bank.toLocaleString()}`,
            inline: true
          },
          {
            name: '🏅 Succès',
            value: `**${achievementsData.length}/22** débloqués\n${((achievementsData.length / 22) * 100).toFixed(0)}% complétés`,
            inline: true
          },
          {
            name: '📈 Activité',
            value: `📝 ${userData.messages.toLocaleString()} messages`,
            inline: true
          }
        )
        .setTimestamp();

      // Bio
      if (profileData.bio) {
        embed.addFields({ name: '📝 Bio', value: profileData.bio, inline: false });
      }

      // Top 3 jeux
      if (topGames.length > 0) {
        const gamesText = topGames.slice(0, 3).map((g, i) => {
          const medals = ['🥇', '🥈', '🥉'];
          return `${medals[i]} **${g.game_name}** — ${formatDuration(g.total_time)}`;
        }).join('\n');
        
        embed.addFields({ 
          name: '🎮 Top Jeux', 
          value: gamesText, 
          inline: false 
        });
      }

      // Pseudos jeux
      const pseudos = [];
      for (const [game, key] of Object.entries(GAME_KEYS)) {
        if (profileData[key]) {
          pseudos.push(`${GAME_EMOJIS[game]} **${game}** : \`${profileData[key]}\``);
        }
      }
      if (pseudos.length > 0) {
        embed.addFields({ 
          name: '🎯 Pseudos Gaming', 
          value: pseudos.join('\n'), 
          inline: false 
        });
      }

      // Derniers achievements
      if (achievementsData.length > 0) {
        const recentAch = achievementsData.slice(-3).reverse();
        const achText = recentAch.map(a => {
          const achData = Object.values(ACHIEVEMENTS).find(ach => ach.id === a.achievement_id);
          return achData ? `🏅 ${achData.name}` : '🏅 Succès';
        }).join('\n');
        
        embed.addFields({ 
          name: '⭐ Derniers Succès', 
          value: achText, 
          inline: false 
        });
      }

      embed.setFooter({ text: `Membre depuis` });

      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'bio') {
      const bio = interaction.options.getString('texte');
      profile.set(interaction.user.id, interaction.guild.id, { bio });
      return interaction.reply({ content: '✅ Bio mise à jour !', ephemeral: true });
    }

    if (sub === 'pseudo') {
      const game = interaction.options.getString('jeu');
      const pseudo = interaction.options.getString('pseudo');
      const key = GAME_KEYS[game];
      profile.set(interaction.user.id, interaction.guild.id, { [key]: pseudo });
      return interaction.reply({ content: `✅ Pseudo ${game} mis à jour : **${pseudo}**`, ephemeral: true });
    }

    if (sub === 'banniere') {
      const color = interaction.options.getString('couleur');
      profile.set(interaction.user.id, interaction.guild.id, { banner_color: color });
      return interaction.reply({ content: '✅ Couleur de bannière mise à jour !', ephemeral: true });
    }
  },
};

const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { xp, birthday, profile, economy, gameSessions, achievements } = require('../../database/database');
const { createCanvas, loadImage, registerFont } = require('canvas');

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

// Fonction pour créer la carte de profil
async function createProfileCard(member, userData, economyData, guildRank, topGames, achievementsData) {
  const canvas = createCanvas(900, 400);
  const ctx = canvas.getContext('2d');

  // Couleur de bannière
  const bannerColor = userData.profileData?.banner_color || '#5865F2';

  // === BANNIÈRE ===
  const gradient = ctx.createLinearGradient(0, 0, 900, 0);
  gradient.addColorStop(0, bannerColor);
  gradient.addColorStop(1, shadeColor(bannerColor, -30));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 900, 150);

  // === FOND CARTE ===
  ctx.fillStyle = '#23272A';
  ctx.fillRect(0, 150, 900, 250);

  // === BARRE DÉCORATIVE ===
  ctx.fillStyle = bannerColor;
  ctx.fillRect(0, 145, 900, 5);

  // === AVATAR ===
  try {
    const avatar = await loadImage(member.displayAvatarURL({ extension: 'png', size: 256 }));
    
    // Cercle blanc autour
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(120, 200, 68, 0, Math.PI * 2);
    ctx.stroke();
    
    // Avatar circulaire
    ctx.save();
    ctx.beginPath();
    ctx.arc(120, 200, 65, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 55, 135, 130, 130);
    ctx.restore();
  } catch (error) {
    console.error('Erreur chargement avatar:', error.message);
  }

  // === NIVEAU (Badge) ===
  ctx.fillStyle = bannerColor;
  ctx.beginPath();
  ctx.arc(170, 250, 25, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(userData.level, 170, 257);

  // === PSEUDO ===
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(member.user.username, 210, 190);

  // === RANK ===
  ctx.fillStyle = '#99AAB5';
  ctx.font = '18px Arial';
  ctx.fillText(`#${guildRank} sur le serveur`, 210, 215);

  // === BARRE XP ===
  const xpNeeded = xp.xpForLevel(userData.level);
  const xpProgress = (userData.xp / xpNeeded) * 100;
  
  // Fond barre
  ctx.fillStyle = '#2C2F33';
  roundRect(ctx, 210, 230, 450, 30, 15);
  ctx.fill();
  
  // Barre progression
  const gradientXP = ctx.createLinearGradient(210, 0, 660, 0);
  gradientXP.addColorStop(0, bannerColor);
  gradientXP.addColorStop(1, shadeColor(bannerColor, 30));
  ctx.fillStyle = gradientXP;
  roundRect(ctx, 210, 230, (450 * xpProgress) / 100, 30, 15);
  ctx.fill();
  
  // Texte XP
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${userData.xp} / ${xpNeeded} XP`, 435, 252);

  // === STATS (coins, achievements) ===
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'left';
  
  const totalCoins = (economyData?.wallet || 0) + (economyData?.bank || 0);
  ctx.fillText(`💰 ${totalCoins.toLocaleString()} coins`, 210, 295);
  
  ctx.fillText(`🏅 ${achievementsData.length}/22 succès`, 210, 325);

  // === TOP JEUX ===
  if (topGames.length > 0) {
    ctx.fillStyle = '#99AAB5';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('TOP JEUX', 210, 360);
    
    ctx.font = '14px Arial';
    let xPos = 210;
    topGames.slice(0, 3).forEach((game, i) => {
      const hours = Math.floor(game.total_time / 3600000);
      const text = `${game.game_name} (${hours}h)`;
      ctx.fillText(text, xPos, 385);
      xPos += ctx.measureText(text).width + 20;
    });
  }

  // === DERNIERS ACHIEVEMENTS ===
  if (achievementsData.length > 0) {
    ctx.fillStyle = '#99AAB5';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('DERNIERS SUCCÈS', 870, 295);
    
    ctx.font = '24px Arial';
    const recentAchievements = achievementsData.slice(-3).reverse();
    let yPos = 325;
    recentAchievements.forEach(ach => {
      ctx.fillText('🏅', 870, yPos);
      yPos += 30;
    });
  }

  return canvas.toBuffer();
}

// Fonction helper pour arrondir les coins
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Fonction pour ajuster la luminosité d'une couleur
function shadeColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16).slice(1).toUpperCase();
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

      // Récupérer les données
      const userData = xp.getUser(targetUser.id, interaction.guild.id) || { level: 0, xp: 0, messages: 0 };
      const profileData = profile.get(targetUser.id, interaction.guild.id) || {};
      const economyData = economy.get(targetUser.id, interaction.guild.id) || { wallet: 0, bank: 0 };
      const topGames = gameSessions.getUserStats(targetUser.id, interaction.guild.id);
      const achievementsData = achievements.getUser(targetUser.id, interaction.guild.id);

      // Calculer le rank
      const allUsers = xp.getGuild(interaction.guild.id);
      const sorted = allUsers.sort((a, b) => {
        const levelDiff = b.level - a.level;
        return levelDiff !== 0 ? levelDiff : b.xp - a.xp;
      });
      const guildRank = sorted.findIndex(u => u.user_id === targetUser.id) + 1;

      // Générer la carte de profil
      const cardBuffer = await createProfileCard(
        member,
        { ...userData, profileData },
        economyData,
        guildRank,
        topGames,
        achievementsData
      );

      const attachment = new AttachmentBuilder(cardBuffer, { name: 'profil.png' });

      // Embed avec bio et pseudos
      const embed = new EmbedBuilder()
        .setColor(profileData.banner_color || '#5865F2')
        .setImage('attachment://profil.png');

      if (profileData.bio) {
        embed.addFields({ name: '📝 Bio', value: profileData.bio, inline: false });
      }

      // Pseudos jeux
      const pseudos = [];
      for (const [game, key] of Object.entries(GAME_KEYS)) {
        if (profileData[key]) {
          pseudos.push(`${GAME_EMOJIS[game]} **${game}** : ${profileData[key]}`);
        }
      }
      if (pseudos.length > 0) {
        embed.addFields({ name: '🎮 Pseudos Jeux', value: pseudos.join('\n'), inline: false });
      }

      return interaction.editReply({ embeds: [embed], files: [attachment] });
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

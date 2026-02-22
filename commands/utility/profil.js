const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { xp, birthday, profile, economy, gameSessions, achievements, reputation } = require('../../database/database');

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
  'CS2':               '🔫',
  'Valorant':          '🎯',
  'League of Legends': '⚔️',
  'Fortnite':          '🏗️',
  'Minecraft':         '⛏️',
};

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
        Object.keys(BANNERS).forEach(b => o.addChoices({ name: b, value: b }));
        return o;
      })),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // ── Voir le profil ───────────────────────────────────────
    if (sub === 'voir') {
      const target = interaction.options.getUser('membre') || interaction.user;
      const member = interaction.guild.members.cache.get(target.id);

      profile.create(target.id, interaction.guild.id);
      const prof   = profile.get(target.id, interaction.guild.id);
      const xpData = xp.getUser(target.id, interaction.guild.id);
      const bday   = birthday.get(target.id, interaction.guild.id);

      const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

      // Calcul rang serveur
      const lb    = xp.leaderboard(interaction.guild.id, 100);
      const rank  = lb.findIndex(u => u.user_id === target.id) + 1;

      // Rôles de jeux actifs
      const activeGames = Object.entries(GAME_KEYS)
        .filter(([game]) => {
          const envKey = `ROLE_${game.toUpperCase().replace(/ /g,'_').replace('2','2')}`;
          const roleId = process.env[`ROLE_${game === 'Rocket League' ? 'RL' : game === 'League of Legends' ? 'LOL' : game.toUpperCase().replace(/ /g,'_')}`];
          return roleId && member?.roles.cache.has(roleId);
        })
        .map(([game]) => game);

      // Pseudos configurés
      const pseudos = Object.entries(GAME_KEYS)
        .filter(([, key]) => prof[key] && prof[key].length > 0)
        .map(([game, key]) => `${GAME_EMOJIS[game]} **${game}** : \`${prof[key]}\``)
        .join('\n');

      // Badges selon niveau
      const level = xpData?.level || 0;
      let badge = '🌱 Débutant';
      if (level >= 5)  badge = '🎮 Gamer';
      if (level >= 10) badge = '⚔️ Guerrier';
      if (level >= 20) badge = '💎 Diamant';
      if (level >= 30) badge = '👑 Légende';
      if (level >= 50) badge = '🌟 Mythique';

      // Récupérer la réputation
      const rep = reputation.get(target.id, interaction.guildId);
      let repBadge = '😐 Neutre';
      if (rep.points >= 100) repBadge = '🌟 Légende';
      else if (rep.points >= 50) repBadge = '💎 Vétéran';
      else if (rep.points >= 25) repBadge = '⭐ Reconnu';
      else if (rep.points >= 10) repBadge = '✨ Apprécié';
      else if (rep.points >= 5) repBadge = '👍 Fiable';
      else if (rep.points > 0) repBadge = '🆕 Nouveau';
      else if (rep.points < 0) repBadge = '⚠️ Suspect';

      // Stats gaming avancées
      const gameStats = gameSessions.getUserStats(target.id, interaction.guildId);
      const totalGameTime = gameStats.reduce((sum, g) => sum + (g.total_time || 0), 0);
      const totalHours = Math.round(totalGameTime / (1000 * 60 * 60) * 10) / 10;
      const top3Games = gameStats.slice(0, 3).map(g => {
        const hours = Math.round(g.total_time / (1000 * 60 * 60) * 10) / 10;
        return `${g.game_name} (${hours}h)`;
      }).join(' • ') || 'Aucun';

      // Historique réputation
      const repHistory = reputation.getHistory(target.id, interaction.guildId, 3);
      let repHistoryText = '';
      for (const entry of repHistory) {
        const fromUser = await interaction.guild.members.fetch(entry.from_user_id).catch(() => null);
        const sign = entry.points > 0 ? '+' : '';
        repHistoryText += `${sign}${entry.points} par **${fromUser?.user.username || 'Inconnu'}** • *${entry.reason}*\n`;
      }
      if (!repHistoryText) repHistoryText = 'Aucun historique';

      // Progression niveau
      const currentLevel = xpData?.level || 0;
      const currentXP = xpData?.xp || 0;
      const xpForNext = (currentLevel + 1) * 100;
      const progress = Math.min(Math.round((currentXP / xpForNext) * 100), 100);
      const barLength = 20;
      const filledLength = Math.round((progress / 100) * barLength);
      const progressBar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
      const progressText = `${progressBar} ${progress}%\n${currentXP} / ${xpForNext} XP`;

      // Score global du classement
      const calculateGlobalScore = (userId, guildId) => {
        const xpData = xp.getUser(userId, guildId);
        const xpScore = xpData ? (xpData.level * 100 + xpData.xp / 10) : 0;
        const rep = reputation.get(userId, guildId);
        const repScore = Math.max(0, rep.points * 50);
        const userAchievements = achievements.getUser(userId, guildId);
        const achScore = userAchievements.length * 100;
        const sessions = gameSessions.getUserStats(userId, guildId);
        const totalGameTime = sessions.reduce((sum, s) => sum + (s.total_time || 0), 0);
        const gameScore = totalGameTime / (1000 * 60 * 60);
        const ecoData = economy.get(userId, guildId);
        const wealthScore = ecoData ? (ecoData.wallet + ecoData.bank) / 100 : 0;
        return Math.round((xpScore * 0.40) + (repScore * 0.25) + (achScore * 0.20) + (gameScore * 0.10) + (wealthScore * 0.05));
      };
      const globalScore = calculateGlobalScore(target.id, interaction.guildId);

      const embed = new EmbedBuilder()
        .setColor(prof.banner_color || '#5865F2')
        .setTitle(`🎮 ${target.username}`)
        .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
        .setDescription(`*${prof.bio}*\n\n🏆 **Score Global :** ${globalScore.toLocaleString()} pts`)
        .addFields(
          { name: '🏅 Badge',       value: badge,                                                    inline: true },
          { name: '⭐ Niveau',       value: xpData ? `${xpData.level}` : '0',                        inline: true },
          { name: '🏆 Rang',         value: rank ? `#${rank}` : 'Non classé',                        inline: true },
          { name: '📈 Progression', value: progressText,                                            inline: false },
          { name: '💬 Messages',     value: xpData ? `${xpData.messages}` : '0',                    inline: true },
          { name: '🎂 Anniversaire', value: bday ? `${bday.day} ${MONTHS[bday.month-1]}` : 'Non défini', inline: true },
          { name: '💌 Réputation',   value: `${rep.points} pts • ${repBadge}`,                      inline: true },
          { name: '🎮 Gaming',       value: `${totalHours}h jouées\n${top3Games}`,                  inline: false },
          { name: '💌 Derniers +rep', value: repHistoryText,                                        inline: false }
        );

      if (pseudos) embed.addFields({ name: '🎮 Mes pseudos', value: pseudos });
      if (activeGames.length) embed.addFields({ name: '🕹️ Jeux actifs', value: activeGames.map(g => `${GAME_EMOJIS[g]} ${g}`).join(' • ') });

      embed.setFooter({ text: `Membre depuis le ${member?.joinedAt ? member.joinedAt.toLocaleDateString('fr-FR') : '?'}` })
           .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    // ── Modifier bio ─────────────────────────────────────────
    if (sub === 'bio') {
      const bio = interaction.options.getString('texte');
      profile.setBio(interaction.user.id, interaction.guild.id, bio);
      return interaction.reply({ content: `✅ Ta bio a été mise à jour !\n*"${bio}"*`, ephemeral: true });
    }

    // ── Modifier pseudo ──────────────────────────────────────
    if (sub === 'pseudo') {
      const game   = interaction.options.getString('jeu');
      const pseudo = interaction.options.getString('pseudo');
      profile.setPseudo(interaction.user.id, interaction.guild.id, game, pseudo);
      return interaction.reply({
        content: `✅ Pseudo **${game}** mis à jour : \`${pseudo}\` ${GAME_EMOJIS[game]}`,
        ephemeral: true,
      });
    }

    // ── Modifier bannière ────────────────────────────────────
    if (sub === 'banniere') {
      const choix  = interaction.options.getString('couleur');
      const color  = BANNERS[choix];
      profile.setBanner(interaction.user.id, interaction.guild.id, color);
      return interaction.reply({
        content: `✅ Bannière mise à jour : **${choix}** !`,
        ephemeral: true,
      });
    }
  },
};

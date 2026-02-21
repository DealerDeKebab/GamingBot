const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { xp, birthday, profile } = require('../../database/database');

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

      const embed = new EmbedBuilder()
        .setColor(prof.banner_color || '#5865F2')
        .setTitle(`🎮 ${target.username}`)
        .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
        .setDescription(`*${prof.bio}*`)
        .addFields(
          { name: '🏅 Badge',       value: badge,                                                    inline: true },
          { name: '⭐ Niveau',       value: xpData ? `${xpData.level}` : '0',                        inline: true },
          { name: '🏆 Rang',         value: rank ? `#${rank}` : 'Non classé',                        inline: true },
          { name: '✨ XP Total',     value: xpData ? `${xpData.xp} XP` : '0 XP',                   inline: true },
          { name: '💬 Messages',     value: xpData ? `${xpData.messages}` : '0',                    inline: true },
          { name: '🎂 Anniversaire', value: bday ? `${bday.day} ${MONTHS[bday.month-1]}` : 'Non défini', inline: true },
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

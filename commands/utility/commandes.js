const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('commandes')
    .setDescription('📜 Afficher le guide des commandes (Admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('📜 GUIDE DES COMMANDES')
      .setDescription('Bienvenue ! Voici toutes les commandes disponibles sur le serveur.')
      .addFields(
        {
          name: '🎮 Gaming & Profil',
          value: 
            '`/gamestats me` → Tes stats de jeu\n' +
            '`/gamestats top` → Top 10 jeux du serveur\n' +
            '`/gamestats leaderboard` → Top joueurs d\'un jeu\n' +
            '`/profil voir` → Ton profil gaming\n' +
            '`/profil bio` → Modifier ta bio\n' +
            '`/profil pseudo` → Ajouter tes pseudos gaming\n' +
            '`/profil banniere` → Changer ta couleur de profil',
          inline: false
        },
        {
          name: '🏅 Progression & Succès',
          value:
            '`/achievements me` → Tes succès débloqués\n' +
            '`/achievements list` → Tous les succès disponibles\n' +
            '`/rank` → Ton niveau et XP\n' +
            '`/leaderboard` → Top XP du serveur\n' +
            '`/defi actuel` → Défi quotidien en cours\n' +
            '`/defi stats` → Tes contributions aux défis',
          inline: false
        },
        {
          name: '💰 Économie',
          value:
            '`/daily` → Récompense quotidienne\n' +
            '`/solde` → Voir ton solde\n' +
            '`/richesse` → Top richesse du serveur\n' +
            '`/payer` → Transférer des coins\n' +
            '`/banque deposer/retirer` → Gérer ta banque',
          inline: false
        },
        {
          name: '🎰 Casino & Jeux',
          value:
            '`/slots` → Machine à sous\n' +
            '`/blackjack` → Jouer au blackjack\n' +
            '`/coinflip` → Pile ou face\n' +
            '`/dice` → Lancer de dés\n' +
            '`/rps` → Pierre-papier-ciseaux\n' +
            '`/8ball` → Boule magique\n' +
            '`/trivia` → Quiz',
          inline: false
        },
        {
          name: '🎲 Paris',
          value:
            '`/pari` → Voir les paris actifs\n' +
            '*Miser via les boutons sur les messages de paris*',
          inline: false
        },
        {
          name: '🎵 Musique',
          value:
            '`/play` → Jouer une musique YouTube\n' +
            '`/pause` → Mettre en pause\n' +
            '`/skip` → Passer la musique\n' +
            '`/stop` → Arrêter la musique\n' +
            '`/queue` → Voir la file d\'attente\n' +
            '`/volume` → Régler le volume\n' +
            '`/radio` → Lancer une radio 24/7',
          inline: false
        },
        {
          name: '🎤 Salons Vocaux',
          value:
            '`/voice rename` → Renommer ton salon\n' +
            '`/voice limit` → Limiter le nombre de personnes\n' +
            '`/voice lock` → Verrouiller ton salon\n' +
            '`/voice unlock` → Déverrouiller\n' +
            '`/voice kick` → Expulser quelqu\'un\n' +
            '`/voice claim` → Récupérer un salon abandonné\n' +
            '`/voice transfer` → Transférer la propriété\n' +
            '\n*Rejoins "➕ Créer un salon" pour créer ton salon perso !*',
          inline: false
        },
        {
          name: '💡 Communauté',
          value:
            '`/suggestion proposer` → Proposer une suggestion\n' +
            '`/anniversaire set` → Définir ton anniversaire\n' +
            '`/anniversaire list` → Prochains anniversaires\n' +
            '`/freegames` → Voir les jeux gratuits actuels\n' +
            '`/giveaway` → Participer aux giveaways\n' +
            '`/ticket` → Créer un ticket de support',
          inline: false
        },
        {
          name: '🌐 Utilitaires',
          value:
            '`/serverinfo` → Infos du serveur\n' +
            '`/userinfo` → Infos d\'un membre\n' +
            '`/stats` → Statistiques du bot\n' +
            '`/meteo` → Météo d\'une ville\n' +
            '`/twitch` → Vérifier si un streamer est en live\n' +
            '`/panel` → Panneau de contrôle',
          inline: false
        }
      )
      .setFooter({ text: '💡 Tape / dans le chat pour voir toutes les commandes !' })
      .setTimestamp();

    await interaction.reply({ content: '✅ Guide des commandes affiché !', ephemeral: true });
    await interaction.channel.send({ embeds: [embed] });
  },
};

const { ActivityType } = require('discord.js');
const { gameSessions } = require('../database/database');

// Liste des jeux à ignorer (non gaming)
const IGNORED_ACTIVITIES = [
  'spotify',
  'youtube',
  'twitch',
  'netflix',
  'visual studio code',
  'custom status',
];

module.exports = {
  name: 'presenceUpdate',
  async execute(oldPresence, newPresence) {
    if (!newPresence || !newPresence.user || newPresence.user.bot) return;
    
    const userId = newPresence.user.id;
    const guildId = newPresence.guild.id;
    
    // Récupérer l'activité de jeu (type PLAYING)
    const oldGame = oldPresence?.activities?.find(a => a.type === ActivityType.Playing);
    const newGame = newPresence.activities.find(a => a.type === ActivityType.Playing);
    
    // Fonction pour vérifier si c'est un vrai jeu
    const isValidGame = (activity) => {
      if (!activity || !activity.name) return false;
      const name = activity.name.toLowerCase();
      return !IGNORED_ACTIVITIES.some(ignored => name.includes(ignored));
    };
    
    const oldGameName = oldGame && isValidGame(oldGame) ? oldGame.name : null;
    const newGameName = newGame && isValidGame(newGame) ? newGame.name : null;
    
    // Si l'utilisateur a arrêté de jouer
    if (oldGameName && !newGameName) {
      const session = gameSessions.end(userId, guildId);
      if (session) {
        const hours = (session.duration / 3600000).toFixed(1);
        console.log(`🎮 Session terminée: ${newPresence.user.tag} a joué ${hours}h à ${session.game_name}`);
      }
    }
    
    // Si l'utilisateur a commencé à jouer
    if (!oldGameName && newGameName) {
      const sessionId = gameSessions.start(userId, guildId, newGameName);
      if (sessionId) {
        console.log(`🎮 Session démarrée: ${newPresence.user.tag} joue à ${newGameName}`);
      }
    }
    
    // Si l'utilisateur a changé de jeu
    if (oldGameName && newGameName && oldGameName !== newGameName) {
      gameSessions.end(userId, guildId);
      gameSessions.start(userId, guildId, newGameName);
      console.log(`🎮 Jeu changé: ${newPresence.user.tag} → ${newGameName}`);
    }
  },
};

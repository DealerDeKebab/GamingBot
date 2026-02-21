// Configuration des achievements
const ACHIEVEMENTS = {
  // Premiers pas
  first_message: {
    id: 'first_message',
    name: '🎤 Premier pas',
    description: 'Envoyer ton premier message',
    reward: 10,
    category: 'social',
    check: (user, stats) => stats.messages >= 1
  },
  chatteur: {
    id: 'chatteur',
    name: '💬 Chatteur',
    description: 'Envoyer 100 messages',
    reward: 50,
    category: 'social',
    check: (user, stats) => stats.messages >= 100
  },
  bavard: {
    id: 'bavard',
    name: '📢 Bavard',
    description: 'Envoyer 500 messages',
    reward: 100,
    category: 'social',
    check: (user, stats) => stats.messages >= 500
  },
  influenceur: {
    id: 'influenceur',
    name: '🌟 Influenceur',
    description: 'Envoyer 1000 messages',
    reward: 200,
    category: 'social',
    check: (user, stats) => stats.messages >= 1000
  },

  // Niveaux
  debutant: {
    id: 'debutant',
    name: '📈 Débutant',
    description: 'Atteindre le niveau 5',
    reward: 50,
    category: 'level',
    check: (user, stats) => stats.level >= 5
  },
  intermediaire: {
    id: 'intermediaire',
    name: '⭐ Intermédiaire',
    description: 'Atteindre le niveau 10',
    reward: 100,
    category: 'level',
    check: (user, stats) => stats.level >= 10
  },
  expert: {
    id: 'expert',
    name: '💎 Expert',
    description: 'Atteindre le niveau 20',
    reward: 200,
    category: 'level',
    check: (user, stats) => stats.level >= 20
  },
  legende: {
    id: 'legende',
    name: '👑 Légende',
    description: 'Atteindre le niveau 50',
    reward: 500,
    category: 'level',
    check: (user, stats) => stats.level >= 50
  },

  // Économie
  premiere_piece: {
    id: 'premiere_piece',
    name: '💰 Première pièce',
    description: 'Gagner ton premier coin',
    reward: 10,
    category: 'economy',
    check: (user, stats) => stats.wallet >= 1
  },
  economiste: {
    id: 'economiste',
    name: '💵 Économiste',
    description: 'Avoir 1000 coins',
    reward: 100,
    category: 'economy',
    check: (user, stats) => stats.wallet >= 1000
  },
  riche: {
    id: 'riche',
    name: '💎 Riche',
    description: 'Avoir 5000 coins',
    reward: 250,
    category: 'economy',
    check: (user, stats) => stats.wallet >= 5000
  },
  millionnaire: {
    id: 'millionnaire',
    name: '👑 Millionnaire',
    description: 'Avoir 10000 coins',
    reward: 500,
    category: 'economy',
    check: (user, stats) => stats.wallet >= 10000
  },

  // Casino
  premier_pari: {
    id: 'premier_pari',
    name: '🎲 Premier pari',
    description: 'Placer ton premier pari',
    reward: 25,
    category: 'casino',
    manual: true
  },
  chanceux: {
    id: 'chanceux',
    name: '🍀 Chanceux',
    description: 'Gagner un pari',
    reward: 75,
    category: 'casino',
    manual: true
  },
  joueur: {
    id: 'joueur',
    name: '🎰 Joueur',
    description: 'Jouer 10 fois au casino (slots/blackjack)',
    reward: 100,
    category: 'casino',
    manual: true
  },

  // Giveaways
  gagnant_giveaway: {
    id: 'gagnant_giveaway',
    name: '🎁 Chanceux',
    description: 'Gagner un giveaway',
    reward: 200,
    category: 'events',
    manual: true
  },

  // Social
  sociable: {
    id: 'sociable',
    name: '🎤 Sociable',
    description: 'Passer 1 heure en vocal',
    reward: 100,
    category: 'social',
    manual: true
  },

  // Spécial
  top_10: {
    id: 'top_10',
    name: '⭐ VIP',
    description: 'Être dans le top 10 XP',
    reward: 300,
    category: 'special',
    manual: true
  },
  early_bird: {
    id: 'early_bird',
    name: '🌅 Lève-tôt',
    description: 'Envoyer un message entre 5h et 7h',
    reward: 50,
    category: 'special',
    manual: true
  },
  noctambule: {
    id: 'noctambule',
    name: '🌙 Noctambule',
    description: 'Envoyer un message entre minuit et 4h',
    reward: 50,
    category: 'special',
    manual: true
  },
};

const CATEGORIES = {
  social: { name: 'Social', emoji: '💬' },
  level: { name: 'Niveaux', emoji: '📈' },
  economy: { name: 'Économie', emoji: '💰' },
  casino: { name: 'Casino', emoji: '🎰' },
  events: { name: 'Événements', emoji: '🎉' },
  special: { name: 'Spéciaux', emoji: '⭐' },
};

module.exports = { ACHIEVEMENTS, CATEGORIES };

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const RIDDLES = [
  {
    question: "Je suis toujours devant toi mais tu ne peux jamais me voir. Qui suis-je ?",
    answers: ["L'avenir", "Le futur", "Avenir", "Futur"],
    hint: "💡 Pense au temps..."
  },
  {
    question: "Plus je suis chaud, plus je suis frais. Qui suis-je ?",
    answers: ["Le pain", "Pain"],
    hint: "💡 Tu en manges au petit-déjeuner..."
  },
  {
    question: "Qu'est-ce qui a 4 pattes le matin, 2 à midi et 3 le soir ?",
    answers: ["L'homme", "Homme", "L'humain", "Humain", "La vie"],
    hint: "💡 Énigme du Sphinx... bébé, adulte, vieillard"
  },
  {
    question: "Je peux voler sans ailes, pleurer sans yeux. Qui suis-je ?",
    answers: ["Le nuage", "Nuage", "Les nuages", "Nuages"],
    hint: "💡 Regarde le ciel..."
  },
  {
    question: "Plus on m'enlève, plus je deviens grand. Qui suis-je ?",
    answers: ["Le trou", "Trou", "Un trou"],
    hint: "💡 Creuse, creuse..."
  },
  {
    question: "Je commence la nuit et je termine le matin. Qui suis-je ?",
    answers: ["La lettre N", "N", "Le N"],
    hint: "💡 Pense aux lettres..."
  },
  {
    question: "Qu'est-ce qui monte et descend sans bouger ?",
    answers: ["L'escalier", "Escalier", "Les escaliers", "Escaliers"],
    hint: "💡 Tu l'utilises pour monter..."
  },
  {
    question: "Je suis plein de trous mais je retiens l'eau. Qui suis-je ?",
    answers: ["L'éponge", "Éponge", "Eponge", "Une éponge"],
    hint: "💡 Dans ta cuisine..."
  },
  {
    question: "Plus je sèche, plus je suis mouillé. Qui suis-je ?",
    answers: ["La serviette", "Serviette", "Une serviette"],
    hint: "💡 Après la douche..."
  },
  {
    question: "Qu'est-ce qui court mais ne marche jamais ?",
    answers: ["L'eau", "Eau", "La rivière", "Rivière"],
    hint: "💡 Liquide..."
  }
];

const activeRiddles = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('devinette')
    .setDescription('🎭 Résoudre une devinette')
    .addSubcommand(s => s.setName('nouvelle').setDescription('Nouvelle devinette'))
    .addSubcommand(s => s.setName('repondre').setDescription('Répondre à la devinette')
      .addStringOption(o => o.setName('reponse').setDescription('Ta réponse').setRequired(true)))
    .addSubcommand(s => s.setName('indice').setDescription('Demander un indice')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (sub === 'nouvelle') {
      const riddle = RIDDLES[Math.floor(Math.random() * RIDDLES.length)];
      
      activeRiddles.set(userId, {
        riddle,
        attempts: 0,
        hintUsed: false
      });

      const embed = new EmbedBuilder()
        .setColor('#9B59B6')
        .setTitle('🎭 Devinette')
        .setDescription(`**${riddle.question}**`)
        .addFields(
          { name: '💭 Comment répondre ?', value: 'Utilise `/devinette repondre reponse:ta_réponse`', inline: false },
          { name: '💡 Besoin d\'aide ?', value: 'Utilise `/devinette indice`', inline: false }
        )
        .setFooter({ text: 'Bonne chance !' });

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'repondre') {
      const game = activeRiddles.get(userId);
      
      if (!game) {
        return interaction.reply({ content: '❌ Tu n\'as pas de devinette en cours ! Utilise `/devinette nouvelle`', ephemeral: true });
      }

      const answer = interaction.options.getString('reponse').toLowerCase().trim();
      game.attempts++;

      const correct = game.riddle.answers.some(a => a.toLowerCase() === answer);

      if (correct) {
        const points = game.hintUsed ? 5 : 10;
        
        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('🎉 Bravo ! Bonne réponse !')
          .setDescription(`**${game.riddle.question}**\n\nRéponse : **${game.riddle.answers[0]}**`)
          .addFields(
            { name: '📊 Tentatives', value: `${game.attempts}`, inline: true },
            { name: '💡 Indice utilisé ?', value: game.hintUsed ? 'Oui' : 'Non', inline: true },
            { name: '⭐ Points', value: `+${points}`, inline: true }
          )
          .setFooter({ text: 'Rejoue avec /devinette nouvelle !' });

        activeRiddles.delete(userId);
        return interaction.reply({ embeds: [embed] });
      }

      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Mauvaise réponse !')
        .setDescription(`Ta réponse : **${answer}**\n\nRéessaye !`)
        .addFields(
          { name: '📊 Tentatives', value: `${game.attempts}`, inline: true },
          { name: '💡 Besoin d\'aide ?', value: 'Utilise `/devinette indice`', inline: true }
        );

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'indice') {
      const game = activeRiddles.get(userId);
      
      if (!game) {
        return interaction.reply({ content: '❌ Tu n\'as pas de devinette en cours ! Utilise `/devinette nouvelle`', ephemeral: true });
      }

      if (game.hintUsed) {
        return interaction.reply({ content: '❌ Tu as déjà utilisé ton indice !', ephemeral: true });
      }

      game.hintUsed = true;

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('💡 Indice')
        .setDescription(game.riddle.hint)
        .setFooter({ text: 'Utilise /devinette repondre pour répondre' });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

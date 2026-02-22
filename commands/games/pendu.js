const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const WORDS = [
  'JAVASCRIPT', 'DISCORD', 'POKEMON', 'MINECRAFT', 'FORTNITE', 'VALORANT',
  'ORDINATEUR', 'PROGRAMMATION', 'INTELLIGENCE', 'SERVEUR', 'CLAVIER',
  'INTERNET', 'STREAMING', 'YOUTUBE', 'TWITCH', 'GAMING', 'ESPORT'
];

const games = new Map();

const HANGMAN_STAGES = [
  '```\n  ___\n  |  |\n     |\n     |\n     |\n_____|\n```',
  '```\n  ___\n  |  |\n  O  |\n     |\n     |\n_____|\n```',
  '```\n  ___\n  |  |\n  O  |\n  |  |\n     |\n_____|\n```',
  '```\n  ___\n  |  |\n  O  |\n /|  |\n     |\n_____|\n```',
  '```\n  ___\n  |  |\n  O  |\n /|\\ |\n     |\n_____|\n```',
  '```\n  ___\n  |  |\n  O  |\n /|\\ |\n /   |\n_____|\n```',
  '```\n  ___\n  |  |\n  O  |\n /|\\ |\n / \\ |\n_____|\n```'
];

function createButtons(game) {
  const rows = [];
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  
  for (let i = 0; i < 3; i++) {
    const row = new ActionRowBuilder();
    const letters = alphabet.slice(i * 9, (i + 1) * 9);
    
    letters.forEach(letter => {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`hangman_${game.id}_${letter}`)
          .setLabel(letter)
          .setStyle(game.guessed.includes(letter) ? ButtonStyle.Secondary : ButtonStyle.Primary)
          .setDisabled(game.guessed.includes(letter))
      );
    });
    
    rows.push(row);
  }
  
  return rows;
}

function getDisplayWord(word, guessed) {
  return word.split('').map(letter => guessed.includes(letter) ? letter : '_').join(' ');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pendu')
    .setDescription('🎯 Jouer au jeu du pendu'),

  async execute(interaction) {
    const gameId = `${interaction.user.id}_${Date.now()}`;
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    
    const game = {
      id: gameId,
      word: word,
      guessed: [],
      errors: 0,
      maxErrors: 6,
      playerId: interaction.user.id
    };
    
    games.set(gameId, game);

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🎯 Jeu du Pendu')
      .setDescription(`${HANGMAN_STAGES[0]}\n**Mot à deviner :**\n\`\`\`${getDisplayWord(word, [])}\`\`\``)
      .addFields(
        { name: '❌ Erreurs', value: `${game.errors}/${game.maxErrors}`, inline: true },
        { name: '💡 Lettres essayées', value: 'Aucune', inline: true }
      )
      .setFooter({ text: `Joueur: ${interaction.user.username}` });

    const buttons = createButtons(game);
    
    await interaction.reply({ embeds: [embed], components: buttons });

    // Timeout après 5 minutes
    setTimeout(() => {
      if (games.has(gameId)) {
        games.delete(gameId);
      }
    }, 300000);
  },

  async handleButton(interaction) {
    const [, gameId, letter] = interaction.customId.split('_');
    const game = games.get(gameId);

    if (!game) {
      return interaction.reply({ content: '❌ Cette partie a expiré !', ephemeral: true });
    }

    if (game.playerId !== interaction.user.id) {
      return interaction.reply({ content: '❌ Ce n\'est pas ta partie !', ephemeral: true });
    }

    game.guessed.push(letter);

    if (!game.word.includes(letter)) {
      game.errors++;
    }

    const displayWord = getDisplayWord(game.word, game.guessed);
    const won = !displayWord.includes('_');
    const lost = game.errors >= game.maxErrors;

    let embed;

    if (won) {
      embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🎉 Victoire !')
        .setDescription(`${HANGMAN_STAGES[game.errors]}\n**Le mot était :**\n\`\`\`${game.word}\`\`\`\n\nBravo ${interaction.user} ! 🎊`)
        .addFields(
          { name: '❌ Erreurs', value: `${game.errors}/${game.maxErrors}`, inline: true },
          { name: '💡 Lettres essayées', value: game.guessed.join(', '), inline: true }
        );
      
      games.delete(gameId);
      return interaction.update({ embeds: [embed], components: [] });
    }

    if (lost) {
      embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('💀 Perdu !')
        .setDescription(`${HANGMAN_STAGES[game.errors]}\n**Le mot était :**\n\`\`\`${game.word}\`\`\`\n\nDommage ${interaction.user} ! 😢`)
        .addFields(
          { name: '❌ Erreurs', value: `${game.errors}/${game.maxErrors}`, inline: true },
          { name: '💡 Lettres essayées', value: game.guessed.join(', '), inline: true }
        );
      
      games.delete(gameId);
      return interaction.update({ embeds: [embed], components: [] });
    }

    embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🎯 Jeu du Pendu')
      .setDescription(`${HANGMAN_STAGES[game.errors]}\n**Mot à deviner :**\n\`\`\`${displayWord}\`\`\``)
      .addFields(
        { name: '❌ Erreurs', value: `${game.errors}/${game.maxErrors}`, inline: true },
        { name: '💡 Lettres essayées', value: game.guessed.join(', '), inline: true }
      )
      .setFooter({ text: `Joueur: ${interaction.user.username}` });

    const buttons = createButtons(game);
    
    await interaction.update({ embeds: [embed], components: buttons });
  }
};

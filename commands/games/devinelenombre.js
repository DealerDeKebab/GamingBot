const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const games = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('devinelenombre')
    .setDescription('🔢 Devine le nombre entre 1 et 100')
    .addIntegerOption(o => o.setName('nombre').setDescription('Ton nombre').setRequired(true).setMinValue(1).setMaxValue(100)),

  async execute(interaction) {
    const guess = interaction.options.getInteger('nombre');
    const userId = interaction.user.id;

    // Créer ou récupérer la partie
    if (!games.has(userId)) {
      const target = Math.floor(Math.random() * 100) + 1;
      games.set(userId, {
        target,
        attempts: 0,
        guesses: []
      });
    }

    const game = games.get(userId);
    game.attempts++;
    game.guesses.push(guess);

    if (guess === game.target) {
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🎉 Bravo ! Tu as trouvé !')
        .setDescription(`Le nombre était bien **${game.target}** !`)
        .addFields(
          { name: '📊 Nombre de tentatives', value: `${game.attempts}`, inline: true },
          { name: '🎯 Tes essais', value: game.guesses.join(', '), inline: false }
        )
        .setFooter({ text: 'Relance /devinelenombre pour rejouer !' });

      games.delete(userId);
      return interaction.reply({ embeds: [embed] });
    }

    const hint = guess < game.target ? '⬆️ Plus haut !' : '⬇️ Plus bas !';
    const color = guess < game.target ? '#FF9500' : '#5865F2';

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle('🔢 Devine le Nombre')
      .setDescription(`Tu as proposé **${guess}**\n\n${hint}`)
      .addFields(
        { name: '📊 Tentatives', value: `${game.attempts}`, inline: true },
        { name: '🎯 Tes essais', value: game.guesses.slice(-5).join(', ') + (game.guesses.length > 5 ? '...' : ''), inline: false }
      )
      .setFooter({ text: 'Continue à deviner entre 1 et 100 !' });

    return interaction.reply({ embeds: [embed] });
  },
};

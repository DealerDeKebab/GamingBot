const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder().setName('dice').setDescription('🎲 Lancer des dés')
    .addIntegerOption(o => o.setName('faces').setDescription('Faces (2-1000)').setMinValue(2).setMaxValue(1000))
    .addIntegerOption(o => o.setName('nombre').setDescription('Dés (1-10)').setMinValue(1).setMaxValue(10)),
  async execute(interaction) {
    const faces  = interaction.options.getInteger('faces') || 6;
    const count  = interaction.options.getInteger('nombre') || 1;
    const rolls  = Array.from({ length: count }, () => Math.floor(Math.random() * faces) + 1);
    const total  = rolls.reduce((a, b) => a + b, 0);
    await interaction.reply({ embeds: [new EmbedBuilder().setColor('#FF6B6B').setTitle(`🎲 ${count}d${faces}`)
      .setDescription(count > 1 ? `**Résultats :** ${rolls.join(', ')}\n**Total : ${total}**` : `**Résultat : ${rolls[0]}**`)] });
  },
};

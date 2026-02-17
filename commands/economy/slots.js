const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { economy } = require('../../database/database');

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎'];
const PAYOUTS = { '💎💎💎': 50, '⭐⭐⭐': 20, '🍇🍇🍇': 10, '🍊🍊🍊': 8, '🍋🍋🍋': 5, '🍒🍒🍒': 3 };

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('🎰 Jouer à la machine à sous')
    .addIntegerOption(o => o.setName('mise').setDescription('Montant à miser').setRequired(true).setMinValue(10).setMaxValue(10000)),

  async execute(interaction) {
    const mise = interaction.options.getInteger('mise');
    economy.create(interaction.user.id, interaction.guild.id);
    const data = economy.get(interaction.user.id, interaction.guild.id);
    if (mise > data.wallet) return interaction.reply({ content: `❌ Tu n'as que **${data.wallet} 🪙** !`, ephemeral: true });

    const reels  = [0,1,2].map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
    const combo  = reels.join('');
    const multi  = PAYOUTS[combo] || (reels[0] === reels[1] || reels[1] === reels[2] ? 1.5 : 0);
    const gain   = Math.floor(mise * multi) - mise;
    const color  = gain > 0 ? '#00FF7F' : gain === 0 ? '#FFD700' : '#FF0000';
    const result = gain > 0 ? `🎉 **+${gain.toLocaleString()} 🪙**` : gain === 0 ? `😐 **Remboursé !**` : `💸 **-${mise.toLocaleString()} 🪙**`;

    economy.addWallet(interaction.user.id, interaction.guild.id, gain);

    return interaction.reply({ embeds: [new EmbedBuilder().setColor(color).setTitle('🎰 Machine à sous')
      .setDescription(`╔══════════════╗\n║  ${reels.join(' — ')}  ║\n╚══════════════╝\n\n${result}`)
      .addFields({ name: '👛 Nouveau solde', value: `${(data.wallet + gain).toLocaleString()} 🪙` })
      .setTimestamp()] });
  },
};

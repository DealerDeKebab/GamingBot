const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { economy } = require('../../database/database');

function card() {
  const suits  = ['♠️','♥️','♦️','♣️'];
  const values = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  return { suit: suits[Math.floor(Math.random()*4)], value: values[Math.floor(Math.random()*13)] };
}

function cardValue(c) {
  if (['J','Q','K'].includes(c.value)) return 10;
  if (c.value === 'A') return 11;
  return parseInt(c.value);
}

function handValue(hand) {
  let total = hand.reduce((s,c) => s + cardValue(c), 0);
  let aces  = hand.filter(c => c.value === 'A').length;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function handStr(hand) { return hand.map(c => `${c.value}${c.suit}`).join(' '); }

const games = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('🃏 Jouer au blackjack')
    .addIntegerOption(o => o.setName('mise').setDescription('Montant à miser').setRequired(true).setMinValue(10).setMaxValue(10000)),

  async execute(interaction) {
    const mise = interaction.options.getInteger('mise');
    economy.create(interaction.user.id, interaction.guild.id);
    const data = economy.get(interaction.user.id, interaction.guild.id);
    if (mise > data.wallet) return interaction.reply({ content: `❌ Tu n'as que **${data.wallet} 🪙** !`, ephemeral: true });

    const player = [card(), card()];
    const dealer = [card(), card()];
    games.set(interaction.user.id, { player, dealer, mise });

    economy.addWallet(interaction.user.id, interaction.guild.id, -mise);

    const pv = handValue(player);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('bj_hit').setLabel('🃏 Tirer').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('bj_stand').setLabel('✋ Rester').setStyle(ButtonStyle.Secondary),
    );

    if (pv === 21) {
      economy.addWallet(interaction.user.id, interaction.guild.id, Math.floor(mise * 2.5));
      games.delete(interaction.user.id);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor('#FFD700').setTitle('🃏 BLACKJACK ! 🎉')
        .addFields(
          { name: '🫵 Ta main', value: `${handStr(player)} = **21**` },
          { name: '💰 Gain',    value: `+${Math.floor(mise * 1.5).toLocaleString()} 🪙` }
        )] });
    }

    return interaction.reply({ embeds: [new EmbedBuilder().setColor('#5865F2').setTitle('🃏 Blackjack')
      .addFields(
        { name: '🫵 Ta main',    value: `${handStr(player)} = **${pv}**` },
        { name: '🤖 Croupier',  value: `${dealer[0].value}${dealer[0].suit} + 🂠` },
        { name: '💰 Mise',      value: `${mise.toLocaleString()} 🪙` }
      )], components: [row] });
  },

  games,
  card, cardValue, handValue, handStr,
};

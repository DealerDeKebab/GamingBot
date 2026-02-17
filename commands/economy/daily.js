const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { economy } = require('../../database/database');

const DAILY_AMOUNT = 500;
const COOLDOWN = 24 * 60 * 60 * 1000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('🎁 Récupère ton bonus quotidien de coins'),

  async execute(interaction) {
    economy.create(interaction.user.id, interaction.guild.id);
    const data = economy.get(interaction.user.id, interaction.guild.id);
    const now  = Date.now();
    if (data.last_daily && (now - data.last_daily) < COOLDOWN) {
      const remaining = COOLDOWN - (now - data.last_daily);
      const hours     = Math.floor(remaining / 3600000);
      const minutes   = Math.floor((remaining % 3600000) / 60000);
      return interaction.reply({ embeds: [
        new EmbedBuilder().setColor('#FF0000').setTitle('⏰ Daily déjà récupéré !')
          .setDescription(`Reviens dans **${hours}h ${minutes}min** !`)
      ], ephemeral: true });
    }
    let streak = data.streak || 0;
    if (data.last_daily && (now - data.last_daily) < COOLDOWN * 2) { streak++; } else { streak = 1; }
    const bonus = Math.min(streak * 50, 500);
    const total = DAILY_AMOUNT + bonus;
    economy.addWallet(interaction.user.id, interaction.guild.id, total);
    economy.setDaily(interaction.user.id, interaction.guild.id, now, streak);
    return interaction.reply({ embeds: [
      new EmbedBuilder().setColor('#00FF7F').setTitle('🎁 Bonus quotidien récupéré !')
        .setDescription(`Tu as reçu **${total.toLocaleString()} 🪙** !`)
        .addFields(
          { name: '💰 Base',   value: `${DAILY_AMOUNT} 🪙`, inline: true },
          { name: '🔥 Streak', value: `x${streak} (+${bonus} 🪙)`, inline: true },
          { name: '👛 Solde',  value: `${(data.wallet + total).toLocaleString()} 🪙`, inline: true },
        )
        .setFooter({ text: streak > 1 ? `🔥 ${streak} jours de suite !` : 'Reviens demain pour un bonus streak !' })
    ]});
  },
};

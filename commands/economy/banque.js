const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { economy } = require('../../database/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('banque')
    .setDescription('🏦 Gérer ta banque')
    .addSubcommand(s => s.setName('deposer').setDescription('Déposer des coins en banque')
      .addIntegerOption(o => o.setName('montant').setDescription('Montant à déposer').setRequired(true).setMinValue(1)))
    .addSubcommand(s => s.setName('retirer').setDescription('Retirer des coins de la banque')
      .addIntegerOption(o => o.setName('montant').setDescription('Montant à retirer').setRequired(true).setMinValue(1))),

  async execute(interaction) {
    const sub    = interaction.options.getSubcommand();
    const amount = interaction.options.getInteger('montant');
    economy.create(interaction.user.id, interaction.guild.id);
    const data = economy.get(interaction.user.id, interaction.guild.id);
    if (sub === 'deposer') {
      if (amount > data.wallet) return interaction.reply({ content: `❌ Tu n'as que **${data.wallet} 🪙** dans ton portefeuille !`, ephemeral: true });
      economy.transfer(interaction.user.id, interaction.guild.id, amount, 'wallet_to_bank');
      return interaction.reply({ embeds: [new EmbedBuilder().setColor('#00FF7F').setTitle('🏦 Dépôt effectué !').addFields(
        { name: '💸 Déposé', value: `${amount.toLocaleString()} 🪙`, inline: true },
        { name: '👛 Portefeuille', value: `${(data.wallet - amount).toLocaleString()} 🪙`, inline: true },
        { name: '🏦 Banque', value: `${(data.bank + amount).toLocaleString()} 🪙`, inline: true },
      )] });
    }
    if (sub === 'retirer') {
      if (amount > data.bank) return interaction.reply({ content: `❌ Tu n'as que **${data.bank} 🪙** en banque !`, ephemeral: true });
      economy.transfer(interaction.user.id, interaction.guild.id, amount, 'bank_to_wallet');
      return interaction.reply({ embeds: [new EmbedBuilder().setColor('#00FF7F').setTitle('🏦 Retrait effectué !').addFields(
        { name: '💸 Retiré', value: `${amount.toLocaleString()} 🪙`, inline: true },
        { name: '👛 Portefeuille', value: `${(data.wallet + amount).toLocaleString()} 🪙`, inline: true },
        { name: '🏦 Banque', value: `${(data.bank - amount).toLocaleString()} 🪙`, inline: true },
      )] });
    }
  },
};

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { economy } = require('../../database/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('payer')
    .setDescription('💸 Envoyer des coins à un membre')
    .addUserOption(o => o.setName('membre').setDescription('Membre à payer').setRequired(true))
    .addIntegerOption(o => o.setName('montant').setDescription('Montant à envoyer').setRequired(true).setMinValue(1)),

  async execute(interaction) {
    const target = interaction.options.getUser('membre');
    const amount = interaction.options.getInteger('montant');
    if (target.id === interaction.user.id) return interaction.reply({ content: '❌ Tu ne peux pas te payer toi-même !', ephemeral: true });
    if (target.bot) return interaction.reply({ content: '❌ Tu ne peux pas payer un bot !', ephemeral: true });
    economy.create(interaction.user.id, interaction.guild.id);
    economy.create(target.id, interaction.guild.id);
    const data = economy.get(interaction.user.id, interaction.guild.id);
    if (amount > data.wallet) return interaction.reply({ content: `❌ Tu n'as que **${data.wallet} 🪙** !`, ephemeral: true });
    economy.addWallet(interaction.user.id, interaction.guild.id, -amount);
    economy.addWallet(target.id, interaction.guild.id, amount);
    return interaction.reply({ embeds: [new EmbedBuilder().setColor('#00FF7F').setTitle('💸 Transfert effectué !')
      .setDescription(`**${interaction.user.username}** a envoyé **${amount.toLocaleString()} 🪙** à **${target.username}** !`)
      .setTimestamp()] });
  },
};

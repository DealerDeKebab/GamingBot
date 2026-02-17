const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { economy } = require('../../database/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('solde')
    .setDescription('💰 Voir ton solde de coins')
    .addUserOption(o => o.setName('membre').setDescription('Voir le solde d\'un autre membre')),

  async execute(interaction) {
    const target = interaction.options.getUser('membre') || interaction.user;
    economy.create(target.id, interaction.guild.id);
    const data = economy.get(target.id, interaction.guild.id);
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle(`💰 Portefeuille de ${target.username}`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '👛 Portefeuille', value: `**${data.wallet.toLocaleString()}** 🪙`, inline: true },
        { name: '🏦 Banque',       value: `**${data.bank.toLocaleString()}** 🪙`,   inline: true },
        { name: '💎 Total',        value: `**${(data.wallet + data.bank).toLocaleString()}** 🪙`, inline: true },
      )
      .setFooter({ text: 'Utilise /daily pour ton bonus quotidien !' })
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  },
};

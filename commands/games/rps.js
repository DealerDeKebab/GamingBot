const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder().setName('rps').setDescription('✌️ Pierre Feuille Ciseaux !'),
  async execute(interaction) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('rps_rock').setLabel('🪨 Pierre').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('rps_paper').setLabel('📄 Feuille').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('rps_scissors').setLabel('✂️ Ciseaux').setStyle(ButtonStyle.Danger),
    );
    await interaction.reply({ embeds: [new EmbedBuilder().setColor('#5865F2').setTitle('✌️ Pierre Feuille Ciseaux').setDescription('Choisis ton arme !')], components: [row] });
  },
};

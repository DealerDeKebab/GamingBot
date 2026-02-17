const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder().setName('coinflip').setDescription('🪙 Pile ou face !'),
  async execute(interaction) {
    const r = Math.random() < 0.5;
    await interaction.reply({ embeds: [new EmbedBuilder().setColor(r ? '#5865F2' : '#FFD700').setTitle('🪙 Coinflip !').setDescription(r ? '🔵 **Pile !**' : '🟡 **Face !**').setFooter({ text: `Lancé par ${interaction.user.username}` })] });
  },
};

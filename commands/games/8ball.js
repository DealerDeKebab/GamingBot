const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const RESPONSES = [
  { text: 'Absolument !', color: '#00FF7F', emoji: '✅' },
  { text: 'Oui, sans aucun doute.', color: '#00FF7F', emoji: '✅' },
  { text: 'C\'est certain !', color: '#00FF7F', emoji: '✅' },
  { text: 'Très probablement.', color: '#7CFC00', emoji: '🟢' },
  { text: 'Les signes pointent vers oui.', color: '#7CFC00', emoji: '🟢' },
  { text: 'Difficile à dire, réessaie.', color: '#FFD700', emoji: '🟡' },
  { text: 'Mieux vaut ne pas répondre maintenant.', color: '#FFD700', emoji: '🟡' },
  { text: 'Ne compte pas là-dessus.', color: '#FF6B6B', emoji: '🔴' },
  { text: 'Mes sources disent non.', color: '#FF6B6B', emoji: '🔴' },
  { text: 'Très peu probable.', color: '#FF4500', emoji: '❌' },
];
module.exports = {
  data: new SlashCommandBuilder().setName('8ball').setDescription('🎱 Pose une question à la boule magique !')
    .addStringOption(o => o.setName('question').setDescription('Ta question').setRequired(true)),
  async execute(interaction) {
    const q = interaction.options.getString('question');
    const r = RESPONSES[Math.floor(Math.random() * RESPONSES.length)];
    await interaction.reply({ embeds: [new EmbedBuilder().setColor(r.color).setTitle('🎱 Boule Magique')
      .addFields({ name: '❓ Question', value: q }, { name: '💬 Réponse', value: `${r.emoji} **${r.text}**` })] });
  },
};

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
module.exports = {
  data: new SlashCommandBuilder().setName('trivia').setDescription('❓ Question culture générale / gaming')
    .addStringOption(o => o.setName('catégorie').setDescription('Catégorie').addChoices(
      { name: '🎮 Gaming',    value: '15' },
      { name: '🌍 Général',  value: '9' },
      { name: '🔬 Science',  value: '17' },
      { name: '🏆 Sports',   value: '21' },
    )),
  async execute(interaction) {
    const cat = interaction.options.getString('catégorie') || '15';
    await interaction.deferReply();
    try {
      const res = await axios.get(`https://opentdb.com/api.php?amount=1&category=${cat}&type=multiple`);
      const q   = res.data.results[0];
      const dec = s => s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#039;/g,"'");
      const answers = [...q.incorrect_answers.map(dec), dec(q.correct_answer)].sort(() => Math.random() - 0.5);
      const correct = answers.indexOf(dec(q.correct_answer));
      const row = new ActionRowBuilder().addComponents(
        answers.map((a, i) => new ButtonBuilder().setCustomId(`trivia_${i}_${correct}`).setLabel(a.substring(0,80)).setStyle(ButtonStyle.Primary))
      );
      await interaction.editReply({ embeds: [
        new EmbedBuilder().setColor('#5865F2').setTitle(`❓ ${dec(q.category)}`).setDescription(`**${dec(q.question)}**`)
          .setFooter({ text: `Difficulté : ${q.difficulty} — 30 secondes pour répondre` })
      ], components: [row] });
      setTimeout(async () => {
        try {
          const disabled = new ActionRowBuilder().addComponents(
            answers.map((a, i) => new ButtonBuilder().setCustomId(`expired_${i}`).setLabel(a.substring(0,80))
              .setStyle(i === correct ? ButtonStyle.Success : ButtonStyle.Secondary).setDisabled(true))
          );
          await interaction.editReply({ components: [disabled] });
        } catch {}
      }, 30000);
    } catch { await interaction.editReply({ content: '❌ Impossible de charger une question. Réessaie !' }); }
  },
};

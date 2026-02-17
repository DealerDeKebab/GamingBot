const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
module.exports = {
  data: new SlashCommandBuilder().setName('freegames').setDescription('🎁 Voir les jeux gratuits du moment'),
  async execute(interaction) {
    await interaction.deferReply();
    const embeds = [];
    // Epic Games
    try {
      const res = await axios.get('https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=fr&country=FR&allowCountries=FR', { timeout: 6000 });
      const games = (res.data?.data?.Catalog?.searchStore?.elements || []).filter(g => g.promotions?.promotionalOffers?.[0]?.promotionalOffers?.some(p => p.discountSetting?.discountPercentage === 0));
      if (games.length) {
        embeds.push(new EmbedBuilder().setColor('#2ECC71').setTitle('🎁 Epic Games Store — Gratuit cette semaine')
          .setDescription(games.slice(0,3).map(g => `🎮 **${g.title}**\n[Récupérer](https://store.epicgames.com/fr/p/${g.urlSlug||g.productSlug||''})`).join('\n\n'))
          .setFooter({ text: 'Epic Games Store' }).setTimestamp());
      }
    } catch {}
    // FreeToGame
    try {
      const res = await axios.get('https://www.freetogame.com/api/games?sort-by=release-date', { timeout: 6000 });
      embeds.push(new EmbedBuilder().setColor('#5865F2').setTitle('🕹️ Nouveaux jeux Free-to-Play')
        .setDescription(res.data.slice(0,4).map(g => `🎮 **[${g.title}](${g.game_url})**\n🏷️ ${g.genre} • 🖥️ ${g.platform}\n${g.short_description.substring(0,80)}...`).join('\n\n'))
        .setFooter({ text: 'FreeToGame' }).setTimestamp());
    } catch {}

    if (!embeds.length) return interaction.editReply({ content: '❌ Impossible de récupérer les jeux gratuits pour le moment.' });
    await interaction.editReply({ embeds: embeds.slice(0, 10) });
  },
};

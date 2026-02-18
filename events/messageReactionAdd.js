const { EmbedBuilder } = require('discord.js');
const { suggestions } = require('../database/database');

module.exports = {
  name: 'messageReactionAdd',
  async execute(reaction, user, client) {
    if (user.bot) return;
    
    // Fetch le message si c'est une réaction partielle
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (e) {
        return;
      }
    }

    const sugg = suggestions.get(reaction.message.id);
    if (!sugg || sugg.status !== 'pending') return;

    // Compter les votes
    const upvotes = reaction.message.reactions.cache.get('✅')?.count - 1 || 0; // -1 pour le bot
    const downvotes = reaction.message.reactions.cache.get('❌')?.count - 1 || 0;

    // Mettre à jour la DB
    suggestions.updateVotes(reaction.message.id, upvotes, downvotes);

    // Mettre à jour l'embed
    const embed = EmbedBuilder.from(reaction.message.embeds[0]);
    embed.data.fields[1] = { name: '📊 Votes', value: `✅ ${upvotes} | ❌ ${downvotes}`, inline: true };
    await reaction.message.edit({ embeds: [embed] });

    // Auto-approve/reject
    const AUTO_APPROVE_THRESHOLD = 10;
    const AUTO_REJECT_THRESHOLD = 10;

    if (upvotes >= AUTO_APPROVE_THRESHOLD && sugg.status === 'pending') {
      suggestions.approve(reaction.message.id, 'Auto-approuvée par la communauté !');
      embed.setColor('#00FF7F').setTitle('✅ Suggestion approuvée');
      embed.addFields({ name: '📝 Réponse', value: 'Auto-approuvée par la communauté !', inline: false });
      await reaction.message.edit({ embeds: [embed] });
    }

    if (downvotes >= AUTO_REJECT_THRESHOLD && sugg.status === 'pending') {
      suggestions.reject(reaction.message.id, 'Refusée par la communauté');
      embed.setColor('#FF0000').setTitle('❌ Suggestion refusée');
      embed.addFields({ name: '📝 Raison', value: 'Refusée par la communauté', inline: false });
      await reaction.message.edit({ embeds: [embed] });
    }
  },
};

const { EmbedBuilder } = require('discord.js');
const { suggestions } = require('../database/database');

module.exports = {
  name: 'messageReactionRemove',
  async execute(reaction, user, client) {
    if (user.bot) return;
    
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
    const upvotes = reaction.message.reactions.cache.get('✅')?.count - 1 || 0;
    const downvotes = reaction.message.reactions.cache.get('❌')?.count - 1 || 0;

    // Mettre à jour la DB
    suggestions.updateVotes(reaction.message.id, upvotes, downvotes);

    // Mettre à jour l'embed
    const embed = EmbedBuilder.from(reaction.message.embeds[0]);
    embed.data.fields[1] = { name: '📊 Votes', value: `✅ ${upvotes} | ❌ ${downvotes}`, inline: true };
    await reaction.message.edit({ embeds: [embed] });
  },
};

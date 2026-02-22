const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { shop } = require('../../database/database');

function formatDuration(ms) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}j`;
  if (hours > 0) return `${hours}h`;
  return `${Math.floor(ms / (1000 * 60))}min`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventaire')
    .setDescription('📦 Voir ton inventaire et boosts actifs'),

  async execute(interaction) {
    const inventory = shop.getInventory(interaction.user.id, interaction.guildId);
    const boosts = shop.getActiveBoosts(interaction.user.id, interaction.guildId);
    const tempRoles = shop.getActiveRoles(interaction.user.id, interaction.guildId);

    const embed = new EmbedBuilder()
      .setColor('#9B59B6')
      .setTitle(`📦 Inventaire de ${interaction.user.username}`)
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    // Items
    if (inventory.length > 0) {
      let itemsText = '';
      inventory.forEach(item => {
        itemsText += `**${item.name}** x${item.quantity}\n`;
        if (item.description) itemsText += `*${item.description}*\n`;
        itemsText += '\n';
      });
      embed.addFields({ name: '📦 Items', value: itemsText, inline: false });
    }

    // Boosts actifs
    if (boosts.length > 0) {
      let boostsText = '';
      boosts.forEach(boost => {
        const timeLeft = boost.expires_at - Date.now();
        boostsText += `⚡ **${boost.boost_type}** x${boost.boost_value}\n`;
        boostsText += `Expire <t:${Math.floor(boost.expires_at / 1000)}:R>\n\n`;
      });
      embed.addFields({ name: '⚡ Boosts Actifs', value: boostsText, inline: false });
    }

    // Rôles temporaires
    if (tempRoles.length > 0) {
      let rolesText = '';
      for (const roleData of tempRoles) {
        const role = interaction.guild.roles.cache.get(roleData.role_id);
        if (role) {
          rolesText += `${role} — Expire <t:${Math.floor(roleData.expires_at / 1000)}:R>\n`;
        }
      }
      if (rolesText) {
        embed.addFields({ name: '🎭 Rôles Temporaires', value: rolesText, inline: false });
      }
    }

    // Si tout est vide
    if (!inventory.length && !boosts.length && !tempRoles.length) {
      embed.setDescription('Ton inventaire est vide ! Visite `/shop` pour acheter des items. 🛒');
    }

    return interaction.reply({ embeds: [embed] });
  },
};

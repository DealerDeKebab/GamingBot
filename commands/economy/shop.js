const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { shop, economy } = require('../../database/database');

const CATEGORIES = {
  'roles': { emoji: '🎭', name: 'Rôles', description: 'Rôles cosmétiques temporaires' },
  'boosts': { emoji: '⚡', name: 'Boosts', description: 'Multiplicateurs de gains' },
  'badges': { emoji: '🏅', name: 'Badges', description: 'Badges exclusifs pour ton profil' },
  'cosmetics': { emoji: '🎨', name: 'Cosmétiques', description: 'Couleurs et styles' },
  'items': { emoji: '📦', name: 'Items', description: 'Objects de collection' }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('🛒 Boutique du serveur')
    .addSubcommand(s => s.setName('voir').setDescription('Voir la boutique')
      .addStringOption(o => {
        o.setName('categorie').setDescription('Filtrer par catégorie').setRequired(false);
        Object.keys(CATEGORIES).forEach(cat => o.addChoices({ name: CATEGORIES[cat].name, value: cat }));
        return o;
      }))
    .addSubcommand(s => s.setName('acheter').setDescription('Acheter un item')
      .addIntegerOption(o => o.setName('id').setDescription('ID de l\'item').setRequired(true))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'voir') {
      const category = interaction.options.getString('categorie');
      const items = shop.getItems(interaction.guildId, category);

      if (!items.length) {
        return interaction.reply({ content: '❌ La boutique est vide ! Les admins peuvent ajouter des items avec `/shopadmin`.', ephemeral: true });
      }

      let description = '';
      
      if (!category) {
        // Afficher toutes les catégories
        description = '**📋 Catégories disponibles :**\n\n';
        
        const categoriesPresent = [...new Set(items.map(i => i.category))];
        categoriesPresent.forEach(cat => {
          const catInfo = CATEGORIES[cat] || { emoji: '📦', name: cat };
          const catItems = items.filter(i => i.category === cat);
          description += `${catInfo.emoji} **${catInfo.name}** — ${catItems.length} item${catItems.length > 1 ? 's' : ''}\n`;
        });
        
        description += '\nUtilise `/shop voir categorie:...` pour voir les items !';
      } else {
        // Afficher les items d'une catégorie
        const catInfo = CATEGORIES[category] || { emoji: '📦', name: category, description: '' };
        
        description = `${catInfo.emoji} **${catInfo.name}**\n${catInfo.description}\n\n`;
        
        items.forEach(item => {
          let stock = item.stock === -1 ? '∞' : item.stock;
          let duration = item.duration ? formatDuration(item.duration) : '';
          
          description += `**#${item.id}** • **${item.name}** — ${item.price.toLocaleString()} coins\n`;
          description += `${item.description || 'Aucune description'}\n`;
          if (duration) description += `⏱️ Durée : ${duration}\n`;
          if (item.stock !== -1) description += `📦 Stock : ${stock}\n`;
          description += '\n';
        });
        
        description += `Pour acheter : \`/shop acheter id:X\``;
      }

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🛒 Boutique du Serveur')
        .setDescription(description)
        .setFooter({ text: 'Gagne des coins en étant actif sur le serveur !' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'acheter') {
      const itemId = interaction.options.getInteger('id');
      const item = shop.getItem(itemId);

      if (!item || !item.enabled || item.guild_id !== interaction.guildId) {
        return interaction.reply({ content: '❌ Cet item n\'existe pas !', ephemeral: true });
      }

      // Vérifier le stock
      if (item.stock !== -1 && item.stock <= 0) {
        return interaction.reply({ content: '❌ Cet item est en rupture de stock !', ephemeral: true });
      }

      // Vérifier le solde
      const userEco = economy.get(interaction.user.id, interaction.guildId);
      if (!userEco || userEco.wallet < item.price) {
        return interaction.reply({ content: `❌ Tu n'as pas assez de coins ! (${item.price.toLocaleString()} requis, tu as ${userEco?.wallet.toLocaleString() || 0})`, ephemeral: true });
      }

      // Retirer les coins
      economy.addWallet(interaction.user.id, interaction.guildId, -item.price);

      // Mettre à jour le stock
      if (item.stock !== -1) {
        shop.updateStock(item.id, -1);
      }

      // Traiter l'achat selon la catégorie
      let successMessage = '';

      if (item.category === 'roles' && item.role_id && item.duration) {
        // Donner le rôle temporaire
        const role = interaction.guild.roles.cache.get(item.role_id);
        if (role) {
          await interaction.member.roles.add(role);
          shop.addTempRole(interaction.user.id, interaction.guildId, item.role_id, item.duration);
          successMessage = `✅ Rôle ${role} ajouté pour ${formatDuration(item.duration)} !`;
        } else {
          successMessage = '⚠️ Rôle introuvable, mais item ajouté à ton inventaire.';
        }
      } else if (item.category === 'boosts' && item.boost_type && item.boost_value && item.duration) {
        // Activer le boost
        shop.addBoost(interaction.user.id, interaction.guildId, item.boost_type, item.boost_value, item.duration);
        successMessage = `✅ Boost **${item.name}** activé pour ${formatDuration(item.duration)} !\nMultiplicateur : x${item.boost_value}`;
      } else {
        // Ajouter à l'inventaire
        shop.addToInventory(interaction.user.id, interaction.guildId, item.id);
        successMessage = `✅ **${item.name}** ajouté à ton inventaire !`;
      }

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🛒 Achat Réussi !')
        .setDescription(
          `${successMessage}\n\n` +
          `💰 **-${item.price.toLocaleString()}** coins\n` +
          `💵 Nouveau solde : **${(userEco.wallet - item.price).toLocaleString()}** coins`
        )
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  },
};

function formatDuration(ms) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}j`;
  if (hours > 0) return `${hours}h`;
  return `${Math.floor(ms / (1000 * 60))}min`;
}

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { shop } = require('../../database/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shopadmin')
    .setDescription('⚙️ Gérer la boutique (Admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName('add-role').setDescription('Ajouter un rôle temporaire')
      .addStringOption(o => o.setName('nom').setDescription('Nom du rôle').setRequired(true))
      .addRoleOption(o => o.setName('role').setDescription('Le rôle à donner').setRequired(true))
      .addIntegerOption(o => o.setName('prix').setDescription('Prix en coins').setRequired(true).setMinValue(1))
      .addIntegerOption(o => o.setName('duree').setDescription('Durée en heures').setRequired(true).setMinValue(1))
      .addStringOption(o => o.setName('description').setDescription('Description').setRequired(false)))
    .addSubcommand(s => s.setName('add-boost').setDescription('Ajouter un boost')
      .addStringOption(o => o.setName('nom').setDescription('Nom du boost').setRequired(true))
      .addStringOption(o => o.setName('type').setDescription('Type de boost').setRequired(true)
        .addChoices(
          { name: 'XP', value: 'xp' },
          { name: 'Coins', value: 'coins' }
        ))
      .addNumberOption(o => o.setName('multiplicateur').setDescription('Multiplicateur (ex: 2.0 = double)').setRequired(true).setMinValue(1.1).setMaxValue(5))
      .addIntegerOption(o => o.setName('duree').setDescription('Durée en heures').setRequired(true).setMinValue(1))
      .addIntegerOption(o => o.setName('prix').setDescription('Prix en coins').setRequired(true).setMinValue(1))
      .addStringOption(o => o.setName('description').setDescription('Description').setRequired(false)))
    .addSubcommand(s => s.setName('add-item').setDescription('Ajouter un item de collection')
      .addStringOption(o => o.setName('nom').setDescription('Nom de l\'item').setRequired(true))
      .addIntegerOption(o => o.setName('prix').setDescription('Prix en coins').setRequired(true).setMinValue(1))
      .addStringOption(o => o.setName('description').setDescription('Description').setRequired(false))
      .addIntegerOption(o => o.setName('stock').setDescription('Stock (-1 = infini)').setRequired(false)))
    .addSubcommand(s => s.setName('remove').setDescription('Retirer un item')
      .addIntegerOption(o => o.setName('id').setDescription('ID de l\'item').setRequired(true)))
    .addSubcommand(s => s.setName('list').setDescription('Lister tous les items')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'add-role') {
      const name = interaction.options.getString('nom');
      const role = interaction.options.getRole('role');
      const price = interaction.options.getInteger('prix');
      const duration = interaction.options.getInteger('duree') * 60 * 60 * 1000;
      const description = interaction.options.getString('description') || `Rôle ${role.name} pendant ${interaction.options.getInteger('duree')}h`;

      const itemId = shop.addItem(interaction.guildId, name, description, 'roles', price, {
        duration,
        role_id: role.id
      });

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Rôle Ajouté au Shop')
        .addFields(
          { name: '📋 ID', value: `#${itemId}`, inline: true },
          { name: '🎭 Nom', value: name, inline: true },
          { name: '💰 Prix', value: `${price.toLocaleString()} coins`, inline: true },
          { name: '🎯 Rôle', value: `${role}`, inline: true },
          { name: '⏱️ Durée', value: `${interaction.options.getInteger('duree')}h`, inline: true }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'add-boost') {
      const name = interaction.options.getString('nom');
      const type = interaction.options.getString('type');
      const multiplier = interaction.options.getNumber('multiplicateur');
      const duration = interaction.options.getInteger('duree') * 60 * 60 * 1000;
      const price = interaction.options.getInteger('prix');
      const description = interaction.options.getString('description') || `Boost ${type.toUpperCase()} x${multiplier} pendant ${interaction.options.getInteger('duree')}h`;

      const itemId = shop.addItem(interaction.guildId, name, description, 'boosts', price, {
        duration,
        boost_type: type,
        boost_value: multiplier
      });

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Boost Ajouté au Shop')
        .addFields(
          { name: '📋 ID', value: `#${itemId}`, inline: true },
          { name: '⚡ Nom', value: name, inline: true },
          { name: '💰 Prix', value: `${price.toLocaleString()} coins`, inline: true },
          { name: '🎯 Type', value: type.toUpperCase(), inline: true },
          { name: '📊 Multiplicateur', value: `x${multiplier}`, inline: true },
          { name: '⏱️ Durée', value: `${interaction.options.getInteger('duree')}h`, inline: true }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'add-item') {
      const name = interaction.options.getString('nom');
      const price = interaction.options.getInteger('prix');
      const description = interaction.options.getString('description') || 'Item de collection';
      const stock = interaction.options.getInteger('stock') || -1;

      const itemId = shop.addItem(interaction.guildId, name, description, 'items', price, { stock });

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Item Ajouté au Shop')
        .addFields(
          { name: '📋 ID', value: `#${itemId}`, inline: true },
          { name: '📦 Nom', value: name, inline: true },
          { name: '💰 Prix', value: `${price.toLocaleString()} coins`, inline: true },
          { name: '📊 Stock', value: stock === -1 ? 'Infini' : `${stock}`, inline: true }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'remove') {
      const itemId = interaction.options.getInteger('id');
      const item = shop.getItem(itemId);

      if (!item || item.guild_id !== interaction.guildId) {
        return interaction.reply({ content: '❌ Item introuvable !', ephemeral: true });
      }

      shop.removeItem(itemId);

      return interaction.reply({ content: `✅ **${item.name}** a été retiré du shop !`, ephemeral: true });
    }

    if (sub === 'list') {
      const items = shop.getItems(interaction.guildId);

      if (!items.length) {
        return interaction.reply({ content: '❌ Le shop est vide !', ephemeral: true });
      }

      let description = '';
      items.forEach(item => {
        description += `**#${item.id}** • **${item.name}** (${item.category})\n`;
        description += `💰 ${item.price.toLocaleString()} coins`;
        if (item.stock !== -1) description += ` • Stock: ${item.stock}`;
        description += '\n\n';
      });

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('⚙️ Items du Shop')
        .setDescription(description)
        .setFooter({ text: `${items.length} item(s) total` })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

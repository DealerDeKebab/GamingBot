const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('📊 Gestion des salons de statistiques')
    .addSubcommand(s => s.setName('créer').setDescription('Créer les salons de statistiques (Admin)'))
    .addSubcommand(s => s.setName('supprimer').setDescription('Supprimer les salons de statistiques (Admin)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });

    if (sub === 'créer') {
      const guild = interaction.guild;

      // Vérifie si une catégorie stats existe déjà
      const existing = guild.channels.cache.find(c => c.name === '📊 STATISTIQUES' && c.type === ChannelType.GuildCategory);
      if (existing) return interaction.editReply({ content: '❌ Les salons de stats existent déjà !' });

      // Crée la catégorie
      const category = await guild.channels.create({
        name: '📊 STATISTIQUES',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          { id: guild.roles.everyone, deny: ['Connect', 'SendMessages'] },
        ],
      });

      // Crée les salons vocaux (non rejoignables = parfait pour les stats)
      await guild.channels.create({
        name: `👥 Membres : ${guild.memberCount}`,
        type: ChannelType.GuildVoice,
        parent: category.id,
        permissionOverwrites: [{ id: guild.roles.everyone, deny: ['Connect'] }],
      });

      const onlineCount = guild.members.cache.filter(m => m.presence?.status && m.presence.status !== 'offline').size;
      await guild.channels.create({
        name: `🟢 En ligne : ${onlineCount}`,
        type: ChannelType.GuildVoice,
        parent: category.id,
        permissionOverwrites: [{ id: guild.roles.everyone, deny: ['Connect'] }],
      });

      const voiceCount = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice && c.members.size > 0).reduce((acc, c) => acc + c.members.size, 0);
      await guild.channels.create({
        name: `🎮 En vocal : ${voiceCount}`,
        type: ChannelType.GuildVoice,
        parent: category.id,
        permissionOverwrites: [{ id: guild.roles.everyone, deny: ['Connect'] }],
      });

      await guild.channels.create({
        name: `💎 Boosts : ${guild.premiumSubscriptionCount || 0}`,
        type: ChannelType.GuildVoice,
        parent: category.id,
        permissionOverwrites: [{ id: guild.roles.everyone, deny: ['Connect'] }],
      });

      const botCount = guild.members.cache.filter(m => m.user.bot).size;
      await guild.channels.create({
        name: `🤖 Bots : ${botCount}`,
        type: ChannelType.GuildVoice,
        parent: category.id,
        permissionOverwrites: [{ id: guild.roles.everyone, deny: ['Connect'] }],
      });

      await interaction.editReply({ content: '✅ Salons de statistiques créés ! Ils se mettront à jour automatiquement toutes les 10 minutes.' });

    } else if (sub === 'supprimer') {
      const category = interaction.guild.channels.cache.find(c => c.name === '📊 STATISTIQUES' && c.type === ChannelType.GuildCategory);
      if (!category) return interaction.editReply({ content: '❌ Aucun salon de stats trouvé.' });

      // Supprime tous les salons enfants puis la catégorie
      const children = interaction.guild.channels.cache.filter(c => c.parentId === category.id);
      for (const [, ch] of children) await ch.delete().catch(() => {});
      await category.delete().catch(() => {});

      await interaction.editReply({ content: '✅ Salons de statistiques supprimés.' });
    }
  },
};

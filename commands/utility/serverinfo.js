const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder().setName('serverinfo').setDescription('ℹ️ Informations sur le serveur'),
  async execute(interaction) {
    const g = interaction.guild; const owner = await g.fetchOwner();
    await interaction.reply({ embeds: [new EmbedBuilder().setColor('#5865F2').setTitle(g.name).setThumbnail(g.iconURL({ dynamic: true }))
      .addFields(
        { name: '👑 Propriétaire', value: owner.user.tag,                               inline: true },
        { name: '📅 Créé le',      value: `<t:${Math.floor(g.createdTimestamp/1000)}:D>`, inline: true },
        { name: '👥 Membres',      value: `${g.memberCount}`,                            inline: true },
        { name: '💬 Salons',        value: `${g.channels.cache.size}`,                   inline: true },
        { name: '🎭 Rôles',         value: `${g.roles.cache.size}`,                      inline: true },
        { name: '💎 Boosts',        value: `${g.premiumSubscriptionCount||0} (Niv. ${g.premiumTier})`, inline: true },
      ).setTimestamp()] });
  },
};

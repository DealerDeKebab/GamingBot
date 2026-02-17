const {
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder,
  StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionFlagsBits,
} = require('discord.js');
const { GAMES } = require('./jeux');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('🎮 Poster le panel de sélection des jeux (Admin)')
    .addChannelOption(o => o.setName('salon').setDescription('Salon où poster le panel').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const channel = interaction.options.getChannel('salon');

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🎮 Choisis tes jeux !')
      .setDescription(
        'Sélectionne les jeux auxquels tu joues dans le menu ci-dessous.\n' +
        'Tu peux en choisir **plusieurs à la fois** !\n\n' +
        '🚗 Rocket League\n' +
        '🔫 CS2\n' +
        '🎯 Valorant\n' +
        '⚔️ League of Legends\n' +
        '🏗️ Fortnite\n' +
        '⛏️ Minecraft\n\n' +
        '*Tes rôles seront mis à jour automatiquement.*'
      )
      .setFooter({ text: 'Tu peux modifier tes choix à tout moment' })
      .setTimestamp();

    const menu = new StringSelectMenuBuilder()
      .setCustomId('game_select')
      .setPlaceholder('🎮 Sélectionne tes jeux...')
      .setMinValues(0)
      .setMaxValues(Object.keys(GAMES).length)
      .addOptions(
        Object.entries(GAMES).map(([name, d]) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(name)
            .setValue(name)
            .setEmoji(d.emoji)
        )
      );

    const row = new ActionRowBuilder().addComponents(menu);

    await channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: `✅ Panel de jeux posté dans ${channel} !`, ephemeral: true });
  },
};

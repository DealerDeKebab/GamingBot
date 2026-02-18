const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reglement')
    .setDescription('📜 Poster le règlement avec bouton de vérification (Admin)'),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: '❌ Seuls les admins peuvent poster le règlement !', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('📜 Règlement du serveur')
      .setDescription(
        `Bienvenue sur **${interaction.guild.name}** !\n\n` +
        `Avant d'accéder au serveur, merci de lire et d'accepter le règlement :\n\n` +
        `**1️⃣ Respect**\n` +
        `Sois respectueux envers tous les membres. Pas d'insultes, de harcèlement ou de discrimination.\n\n` +
        `**2️⃣ Pas de spam**\n` +
        `Évite le spam, les messages inutiles et la publicité non autorisée.\n\n` +
        `**3️⃣ Salons appropriés**\n` +
        `Utilise les bons salons pour les bonnes discussions.\n\n` +
        `**4️⃣ Pas de contenu inapproprié**\n` +
        `Aucun contenu NSFW, violent ou illégal.\n\n` +
        `**5️⃣ Écoute le staff**\n` +
        `Respecte les décisions des modérateurs et administrateurs.\n\n` +
        `───────────────────────────\n\n` +
        `En cliquant sur **✅ J'accepte**, tu confirmes avoir lu et accepté le règlement.\n` +
        `Tu obtiendras alors accès à tout le serveur !`
      )
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter({ text: 'Clique sur le bouton ci-dessous pour accepter' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('accept_rules')
        .setLabel('✅ J\'accepte le règlement')
        .setStyle(ButtonStyle.Success)
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    return interaction.reply({ content: '✅ Règlement posté !', ephemeral: true });
  },
};

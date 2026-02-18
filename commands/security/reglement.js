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
        `Bienvenue sur **${interaction.guild.name}** ! 🎮\n\n` +
        `**1.** 🤝 Respect mutuel — pas d'insultes ni de harcèlement\n` +
        `**2.** 🚫 Pas de discrimination (race, genre, religion...)\n` +
        `**3.** 📢 Pas de spam, flood, ni mentions inutiles\n` +
        `**4.** 🔞 Aucun contenu NSFW hors salons dédiés\n` +
        `**5.** 📣 Pas de pub sans accord d'un admin\n` +
        `**6.** 🎮 Utilisez les bons salons pour chaque sujet\n` +
        `**7.** 👮 Les décisions des modérateurs sont définitives\n` +
        `**8.** 🤖 Pas de bots ou self-bot\n\n` +
        `**En cliquant sur ✅, tu acceptes le règlement et accèdes au serveur complet.**`
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

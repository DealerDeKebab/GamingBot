const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder().setName('reglement').setDescription('📜 Poster le message de règlement')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const embed = new EmbedBuilder().setColor('#5865F2').setTitle('📜 Règlement du Serveur')
      .setDescription(
        '**Bienvenue dans notre communauté gaming !** 🎮\n\n' +
        '**1.** 🤝 Respect mutuel — pas d\'insultes ni de harcèlement\n' +
        '**2.** 🚫 Pas de discrimination (race, genre, religion...)\n' +
        '**3.** 📢 Pas de spam, flood, ni mentions inutiles\n' +
        '**4.** 🔞 Aucun contenu NSFW hors salons dédiés\n' +
        '**5.** 📣 Pas de pub sans accord d\'un admin\n' +
        '**6.** 🎮 Utilisez les bons salons pour chaque sujet\n' +
        '**7.** 👮 Les décisions des modérateurs sont définitives\n' +
        '**8.** 🤖 Pas de bots ou self-bot\n\n' +
        '**En cliquant sur ✅, tu acceptes le règlement et accèdes au serveur complet.**'
      )
      .setFooter({ text: 'Clique sur le bouton ci-dessous pour accéder au serveur !' }).setTimestamp();
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('accept_rules').setLabel('✅ J\'accepte le règlement').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('decline_rules').setLabel('❌ Je refuse').setStyle(ButtonStyle.Danger),
    );
    await interaction.reply({ content: '✅ Posté !', ephemeral: true });
    await interaction.channel.send({ embeds: [embed], components: [row] });
  },
};

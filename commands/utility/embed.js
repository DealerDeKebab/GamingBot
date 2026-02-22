const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('📝 Créer un embed personnalisé (Admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(o => o.setName('titre').setDescription('Titre de l\'embed').setRequired(true))
    .addStringOption(o => o.setName('description').setDescription('Description de l\'embed').setRequired(true))
    .addStringOption(o => o.setName('couleur').setDescription('Couleur (hex sans #)').setRequired(false))
    .addStringOption(o => o.setName('image').setDescription('URL de l\'image').setRequired(false))
    .addStringOption(o => o.setName('miniature').setDescription('URL de la miniature').setRequired(false))
    .addStringOption(o => o.setName('footer').setDescription('Texte du footer').setRequired(false))
    .addBooleanOption(o => o.setName('everyone').setDescription('Ping @everyone ?').setRequired(false))
    .addChannelOption(o => o.setName('salon').setDescription('Salon où envoyer (sinon ici)').setRequired(false)),

  async execute(interaction) {
    const titre = interaction.options.getString('titre');
    const description = interaction.options.getString('description');
    const couleur = interaction.options.getString('couleur') || '5865F2';
    const image = interaction.options.getString('image');
    const miniature = interaction.options.getString('miniature');
    const footer = interaction.options.getString('footer');
    const everyone = interaction.options.getBoolean('everyone') || false;
    const salon = interaction.options.getChannel('salon') || interaction.channel;

    // Créer l'embed
    const embed = new EmbedBuilder()
      .setTitle(titre)
      .setDescription(description)
      .setColor(`#${couleur}`)
      .setTimestamp();

    if (image) embed.setImage(image);
    if (miniature) embed.setThumbnail(miniature);
    if (footer) embed.setFooter({ text: footer });

    // Envoyer l'embed
    try {
      const messageOptions = { embeds: [embed] };
      if (everyone) {
        messageOptions.content = '@everyone';
      }
      
      await salon.send(messageOptions);
      return interaction.reply({ content: `✅ Embed envoyé dans ${salon} !`, ephemeral: true });
    } catch (error) {
      console.error('Erreur envoi embed:', error);
      return interaction.reply({ content: '❌ Impossible d\'envoyer l\'embed dans ce salon.', ephemeral: true });
    }
  },
};

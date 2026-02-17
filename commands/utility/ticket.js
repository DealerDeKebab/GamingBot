const {
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder,
  ButtonStyle, PermissionFlagsBits, ChannelType,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('🎟️ Système de tickets')
    .addSubcommand(s => s.setName('panel').setDescription('Poster le panel de tickets (Admin)')
      .addChannelOption(o => o.setName('salon').setDescription('Salon où poster le panel').setRequired(true)))
    .addSubcommand(s => s.setName('fermer').setDescription('Fermer le ticket actuel'))
    .addSubcommand(s => s.setName('ajouter').setDescription('Ajouter un membre au ticket')
      .addUserOption(o => o.setName('membre').setDescription('Membre à ajouter').setRequired(true)))
    .addSubcommand(s => s.setName('supprimer').setDescription('Supprimer un membre du ticket')
      .addUserOption(o => o.setName('membre').setDescription('Membre à retirer').setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();

    // ── Panel de tickets ─────────────────────────────────────
    if (sub === 'panel') {
      const channel = interaction.options.getChannel('salon');

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🎟️ Support & Tickets')
        .setDescription(
          'Besoin d\'aide ? Clique sur le bouton correspondant à ta demande !\n\n' +
          '🆘 **Support** — Problème général, question\n' +
          '⚔️ **Modération** — Signaler un joueur, une situation\n' +
          '🤝 **Partenariat** — Proposition de partenariat\n' +
          '🐛 **Bug** — Reporter un bug sur le serveur\n\n' +
          '*Un salon privé sera créé rien que pour toi.*'
        )
        .setFooter({ text: 'Un seul ticket à la fois par membre' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket_support').setLabel('🆘 Support').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('ticket_mod').setLabel('⚔️ Modération').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('ticket_partner').setLabel('🤝 Partenariat').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('ticket_bug').setLabel('🐛 Bug').setStyle(ButtonStyle.Secondary),
      );

      await channel.send({ embeds: [embed], components: [row] });
      await interaction.reply({ content: `✅ Panel de tickets posté dans ${channel} !`, ephemeral: true });
    }

    // ── Fermer un ticket ─────────────────────────────────────
    if (sub === 'fermer') {
      const channel = interaction.channel;
      if (!channel.name.startsWith('ticket-')) {
        return interaction.reply({ content: '❌ Ce salon n\'est pas un ticket.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🔒 Fermeture du ticket')
        .setDescription(`Ticket fermé par **${interaction.user.tag}**\nSuppression dans **5 secondes**...`)
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket_cancel_close').setLabel('❌ Annuler').setStyle(ButtonStyle.Secondary),
      );

      await interaction.reply({ embeds: [embed], components: [row] });

      setTimeout(async () => {
        await channel.delete(`Ticket fermé par ${interaction.user.tag}`).catch(() => {});
      }, 5000);
    }

    // ── Ajouter un membre ────────────────────────────────────
    if (sub === 'ajouter') {
      const channel = interaction.channel;
      if (!channel.name.startsWith('ticket-')) {
        return interaction.reply({ content: '❌ Ce salon n\'est pas un ticket.', ephemeral: true });
      }
      const member = interaction.options.getMember('membre');
      await channel.permissionOverwrites.edit(member, { ViewChannel: true, SendMessages: true });
      await interaction.reply({ content: `✅ **${member.user.tag}** ajouté au ticket.`, ephemeral: true });
    }

    // ── Retirer un membre ────────────────────────────────────
    if (sub === 'supprimer') {
      const channel = interaction.channel;
      if (!channel.name.startsWith('ticket-')) {
        return interaction.reply({ content: '❌ Ce salon n\'est pas un ticket.', ephemeral: true });
      }
      const member = interaction.options.getMember('membre');
      await channel.permissionOverwrites.edit(member, { ViewChannel: false });
      await interaction.reply({ content: `✅ **${member.user.tag}** retiré du ticket.`, ephemeral: true });
    }
  },
};

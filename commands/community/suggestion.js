const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { suggestions } = require('../../database/database');

const SUGGESTION_CHANNEL_ID = process.env.SUGGESTION_CHANNEL_ID || null;
const AUTO_APPROVE_THRESHOLD = 10;
const AUTO_REJECT_THRESHOLD = 10;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suggestion')
    .setDescription('💡 Système de suggestions')
    .addSubcommand(s => s.setName('proposer').setDescription('Proposer une suggestion')
      .addStringOption(o => o.setName('texte').setDescription('Ta suggestion').setRequired(true).setMaxLength(1000)))
    .addSubcommand(s => s.setName('accepter').setDescription('Accepter une suggestion (Admin)')
      .addStringOption(o => o.setName('id').setDescription('ID du message de la suggestion').setRequired(true))
      .addStringOption(o => o.setName('reponse').setDescription('Réponse (optionnelle)').setMaxLength(500)))
    .addSubcommand(s => s.setName('refuser').setDescription('Refuser une suggestion (Admin)')
      .addStringOption(o => o.setName('id').setDescription('ID du message de la suggestion').setRequired(true))
      .addStringOption(o => o.setName('raison').setDescription('Raison du refus').setRequired(true).setMaxLength(500))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // ══════════════════════════════════════════
    //  PROPOSER UNE SUGGESTION
    // ══════════════════════════════════════════
    if (sub === 'proposer') {
      if (!SUGGESTION_CHANNEL_ID) {
        return interaction.reply({ content: '❌ Le salon de suggestions n\'est pas configuré ! Ajoute `SUGGESTION_CHANNEL_ID` dans le .env', ephemeral: true });
      }

      const channel = interaction.guild.channels.cache.get(SUGGESTION_CHANNEL_ID);
      if (!channel) {
        return interaction.reply({ content: '❌ Le salon de suggestions est introuvable !', ephemeral: true });
      }

      const content = interaction.options.getString('texte');

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('💡 Nouvelle suggestion')
        .setDescription(content)
        .addFields(
          { name: '👤 Proposé par', value: `${interaction.user.tag}`, inline: true },
          { name: '📊 Votes', value: '✅ 0 | ❌ 0', inline: true },
          { name: '📅 Date', value: `<t:${Math.floor(Date.now()/1000)}:R>`, inline: true },
        )
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'Vote avec les réactions ci-dessous !' })
        .setTimestamp();

      const msg = await channel.send({ embeds: [embed] });
      await msg.react('✅');
      await msg.react('❌');

      suggestions.create({
        messageId: msg.id,
        channelId: channel.id,
        guildId: interaction.guild.id,
        userId: interaction.user.id,
        content,
        timestamp: Date.now(),
      });

      return interaction.reply({ content: `✅ Ta suggestion a été postée dans ${channel} !`, ephemeral: true });
    }

    // ══════════════════════════════════════════
    //  ACCEPTER UNE SUGGESTION
    // ══════════════════════════════════════════
    if (sub === 'accepter') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: '❌ Seuls les admins peuvent accepter des suggestions !', ephemeral: true });
      }

      const msgId = interaction.options.getString('id');
      const response = interaction.options.getString('reponse') || 'Suggestion approuvée !';
      const sugg = suggestions.get(msgId);

      if (!sugg) return interaction.reply({ content: '❌ Suggestion introuvable !', ephemeral: true });
      if (sugg.status !== 'pending') return interaction.reply({ content: '❌ Cette suggestion a déjà été traitée !', ephemeral: true });

      suggestions.approve(msgId, response);

      const channel = interaction.guild.channels.cache.get(sugg.channel_id);
      const message = await channel?.messages.fetch(msgId).catch(() => null);

      if (message) {
        const embed = EmbedBuilder.from(message.embeds[0])
          .setColor('#00FF7F')
          .setTitle('✅ Suggestion approuvée')
          .addFields({ name: '📝 Réponse', value: response, inline: false });
        await message.edit({ embeds: [embed] });
      }

      return interaction.reply({ content: '✅ Suggestion approuvée !', ephemeral: true });
    }

    // ══════════════════════════════════════════
    //  REFUSER UNE SUGGESTION
    // ══════════════════════════════════════════
    if (sub === 'refuser') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: '❌ Seuls les admins peuvent refuser des suggestions !', ephemeral: true });
      }

      const msgId = interaction.options.getString('id');
      const raison = interaction.options.getString('raison');
      const sugg = suggestions.get(msgId);

      if (!sugg) return interaction.reply({ content: '❌ Suggestion introuvable !', ephemeral: true });
      if (sugg.status !== 'pending') return interaction.reply({ content: '❌ Cette suggestion a déjà été traitée !', ephemeral: true });

      suggestions.reject(msgId, raison);

      const channel = interaction.guild.channels.cache.get(sugg.channel_id);
      const message = await channel?.messages.fetch(msgId).catch(() => null);

      if (message) {
        const embed = EmbedBuilder.from(message.embeds[0])
          .setColor('#FF0000')
          .setTitle('❌ Suggestion refusée')
          .addFields({ name: '📝 Raison', value: raison, inline: false });
        await message.edit({ embeds: [embed] });
      }

      return interaction.reply({ content: '❌ Suggestion refusée !', ephemeral: true });
    }
  },
};

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { jackpot, economy } = require('../../database/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('jackpot')
    .setDescription('🎰 Système de Jackpot événementiel')
    .addSubcommand(s => s.setName('start').setDescription('Lancer un jackpot (Admin)')
      .addIntegerOption(o => o.setName('pot').setDescription('Pot initial (coins)').setRequired(true).setMinValue(10000))
      .addIntegerOption(o => o.setName('duree').setDescription('Durée (en heures)').setRequired(true).setMinValue(1).setMaxValue(72))
      .addIntegerOption(o => o.setName('cout').setDescription('Coût de participation (défaut: 1000)').setRequired(false).setMinValue(100)))
    .addSubcommand(s => s.setName('stop').setDescription('Annuler le jackpot en cours (Admin)'))
    .addSubcommand(s => s.setName('history').setDescription('Historique des jackpots')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'start') {
      // Vérifier permissions
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: '❌ Tu dois avoir la permission "Gérer le serveur" !', ephemeral: true });
      }

      // Vérifier s'il y a déjà un jackpot actif
      const activeJackpot = jackpot.getActive(interaction.guildId);
      if (activeJackpot) {
        return interaction.reply({ content: '❌ Un jackpot est déjà en cours ! Utilise `/jackpot stop` pour l\'annuler.', ephemeral: true });
      }

      const initialPot = interaction.options.getInteger('pot');
      const durationHours = interaction.options.getInteger('duree');
      const entryCost = interaction.options.getInteger('cout') || 1000;
      const endTime = Date.now() + (durationHours * 60 * 60 * 1000);

      // Créer l'événement
      const eventId = jackpot.create(interaction.guildId, interaction.channelId, initialPot, entryCost, endTime);

      const embed = createJackpotEmbed(eventId);
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`jackpot_join_${eventId}`)
            .setLabel(`🎰 Participer (${entryCost.toLocaleString()} coins)`)
            .setStyle(ButtonStyle.Success)
        );

      const message = await interaction.reply({ content: '@everyone', embeds: [embed], components: [row], fetchReply: true });

      // Sauvegarder l'ID du message
      jackpot.setMessage(eventId, message.id);

      // Programmer la mise à jour toutes les 30s et le tirage final
      startJackpotUpdater(interaction.client, eventId);
    }

    if (sub === 'stop') {
      // Vérifier permissions
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: '❌ Tu dois avoir la permission "Gérer le serveur" !', ephemeral: true });
      }

      const activeJackpot = jackpot.getActive(interaction.guildId);
      if (!activeJackpot) {
        return interaction.reply({ content: '❌ Aucun jackpot actif !', ephemeral: true });
      }

      // Rembourser les participants
      const participants = jackpot.getParticipants(activeJackpot.id);
      for (const userId of participants) {
        economy.addWallet(userId, interaction.guildId, activeJackpot.entry_cost);
      }

      jackpot.cancel(activeJackpot.id);

      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🎰 Jackpot Annulé')
        .setDescription(`Le jackpot a été annulé par un administrateur.\n\n✅ **${participants.length} participants** ont été remboursés.`)
        .setTimestamp();

      // Mettre à jour le message
      if (activeJackpot.message_id) {
        const channel = interaction.guild.channels.cache.get(activeJackpot.channel_id);
        if (channel) {
          const message = await channel.messages.fetch(activeJackpot.message_id).catch(() => null);
          if (message) {
            await message.edit({ embeds: [embed], components: [] });
          }
        }
      }

      return interaction.reply({ content: '✅ Jackpot annulé et participants remboursés !', ephemeral: true });
    }

    if (sub === 'history') {
      const history = jackpot.getHistory(interaction.guildId, 10);

      if (!history.length) {
        return interaction.reply({ content: '❌ Aucun historique de jackpot !', ephemeral: true });
      }

      let description = '';

      for (const entry of history) {
        const winner = await interaction.guild.members.fetch(entry.winner_id).catch(() => null);
        const date = new Date(entry.timestamp);
        description += `💰 **${entry.pot_amount.toLocaleString()}** coins — **${winner?.user.username || 'Inconnu'}**\n`;
        description += `👥 ${entry.participants_count} participants • <t:${Math.floor(date / 1000)}:R>\n\n`;
      }

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🏆 Historique des Jackpots')
        .setDescription(description)
        .setFooter({ text: `${history.length} jackpot(s) terminé(s)` })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  },
};

function createJackpotEmbed(eventId) {
  const event = jackpot.get(eventId);
  if (!event) return null;

  const participants = jackpot.getParticipants(eventId);
  const timeLeft = event.end_time - Date.now();
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  const embed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('🎰 JACKPOT EN COURS ! 🎰')
    .setDescription(
      `💰 **Pot actuel :** ${event.current_pot.toLocaleString()} coins\n` +
      `👥 **Participants :** ${participants.length}\n` +
      `⏱️ **Temps restant :** ${hoursLeft}h ${minutesLeft}min\n` +
      `💵 **Coût de participation :** ${event.entry_cost.toLocaleString()} coins\n\n` +
      `Clique sur le bouton ci-dessous pour participer !\n` +
      `**Le gagnant sera tiré au sort et remportera TOUT le pot !**`
    )
    .setFooter({ text: 'Bonne chance à tous !' })
    .setTimestamp(event.end_time);

  return embed;
}

async function startJackpotUpdater(client, eventId) {
  const event = jackpot.get(eventId);
  if (!event) return;

  const updateInterval = setInterval(async () => {
    const currentEvent = jackpot.get(eventId);
    if (!currentEvent || currentEvent.status !== 'active') {
      clearInterval(updateInterval);
      return;
    }

    // Vérifier si le temps est écoulé
    if (Date.now() >= currentEvent.end_time) {
      clearInterval(updateInterval);
      await performDraw(client, eventId);
      return;
    }

    // Mettre à jour l'embed
    const channel = client.channels.cache.get(currentEvent.channel_id);
    if (!channel || !currentEvent.message_id) return;

    const message = await channel.messages.fetch(currentEvent.message_id).catch(() => null);
    if (!message) return;

    const embed = createJackpotEmbed(eventId);
    if (embed) {
      await message.edit({ embeds: [embed] }).catch(() => {});
    }
  }, 30000); // Toutes les 30 secondes
}

async function performDraw(client, eventId) {
  const event = jackpot.get(eventId);
  if (!event) return;

  const participants = jackpot.getParticipants(eventId);

  const channel = client.channels.cache.get(event.channel_id);
  if (!channel) return;

  // Pas de participants
  if (participants.length === 0) {
    const embed = new EmbedBuilder()
      .setColor('#FF6B00')
      .setTitle('🎰 Jackpot Terminé')
      .setDescription('Aucun participant ! Le jackpot est annulé.')
      .setTimestamp();

    if (event.message_id) {
      const message = await channel.messages.fetch(event.message_id).catch(() => null);
      if (message) {
        await message.edit({ embeds: [embed], components: [] });
      }
    }

    jackpot.cancel(eventId);
    return;
  }

  // Tirage au sort
  const winnerId = participants[Math.floor(Math.random() * participants.length)];
  const winner = await channel.guild.members.fetch(winnerId).catch(() => null);

  // Donner les coins au gagnant
  economy.addWallet(winnerId, event.guild_id, event.current_pot);

  // Marquer comme terminé
  jackpot.finish(eventId, winnerId);

  // Annonce du gagnant
  const embed = new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('🎉 JACKPOT GAGNÉ ! 🎉')
    .setDescription(
      `🏆 **${winner?.user.username || 'Membre inconnu'}** remporte le jackpot !\n\n` +
      `💰 **Gain :** ${event.current_pot.toLocaleString()} coins\n` +
      `👥 **Participants :** ${participants.length}\n\n` +
      `Félicitations ! 🎊`
    )
    .setThumbnail(winner?.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .setTimestamp();

  await channel.send({ content: `@everyone 🎰 ${winner}`, embeds: [embed] });

  // Mettre à jour le message original
  if (event.message_id) {
    const message = await channel.messages.fetch(event.message_id).catch(() => null);
    if (message) {
      await message.edit({ embeds: [embed], components: [] });
    }
  }
}

module.exports.performDraw = performDraw;

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { giveaway } = require('../../database/database');

function parseDuration(s) {
  const m = s.match(/^(\d+)(s|m|h|d)$/);
  if (!m) return null;
  return parseInt(m[1]) * { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2]];
}

async function endGiveaway(messageId, client, guild) {
  const data = giveaway.getByMsg(messageId);
  if (!data || data.ended) return;

  const participants = JSON.parse(data.participants);
  const channel = guild.channels.cache.get(data.channel_id);
  if (!channel) return;

  const winnerIds = [];
  let mention = '❌ Aucun participant';

  if (participants.length > 0) {
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(data.winners, participants.length));
    winnerIds.push(...selected);
    mention = selected.map(id => `<@${id}>`).join(', ');
  }

  giveaway.end(messageId, winnerIds);

  try {
    const msg = await channel.messages.fetch(messageId);
    await msg.edit({
      embeds: [new EmbedBuilder().setColor('#808080').setTitle('🎉 GIVEAWAY TERMINÉ')
        .setDescription(`**${data.prize}**\n\n🏆 Gagnant(s) : ${mention}\n👥 Participants : ${participants.length}`)
        .setTimestamp()],
      components: [],
    });
    await channel.send(`🎊 Félicitations ${mention} ! Vous remportez **${data.prize}** !`);
  } catch (e) { console.error('endGiveaway error:', e.message); }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('🎉 Système de giveaway')
    .addSubcommand(s => s.setName('créer').setDescription('Créer un giveaway')
      .addStringOption(o => o.setName('prix').setDescription('Lot à offrir').setRequired(true))
      .addStringOption(o => o.setName('durée').setDescription('Ex: 1h, 30m, 2d').setRequired(true))
      .addIntegerOption(o => o.setName('gagnants').setDescription('Nombre de gagnants (1-10)').setMinValue(1).setMaxValue(10)))
    .addSubcommand(s => s.setName('terminer').setDescription('Terminer manuellement')
      .addStringOption(o => o.setName('message_id').setDescription('ID du message giveaway').setRequired(true)))
    .addSubcommand(s => s.setName('reroll').setDescription('Re-tirer un gagnant')
      .addStringOption(o => o.setName('message_id').setDescription('ID du message giveaway').setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'créer') {
      const prize    = interaction.options.getString('prix');
      const durStr   = interaction.options.getString('durée');
      const winners  = interaction.options.getInteger('gagnants') || 1;
      const duration = parseDuration(durStr);
      if (!duration) return interaction.reply({ content: '❌ Format invalide. Ex: `1h`, `30m`, `2d`', ephemeral: true });

      const endTime = Date.now() + duration;
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('giveaway_join').setLabel('🎉 Participer').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('giveaway_list').setLabel('👥 Participants').setStyle(ButtonStyle.Secondary),
      );

      await interaction.reply({ content: '✅ Giveaway créé !', ephemeral: true });
      const msg = await interaction.channel.send({
        content: '@everyone 🎉 **NOUVEAU GIVEAWAY !**',
        embeds: [new EmbedBuilder().setColor('#FFD700').setTitle('🎉 GIVEAWAY !')
          .setDescription(
            `**${prize}**\n\n` +
            `🎟️ Clique sur **Participer** pour t'inscrire !\n` +
            `🏆 **${winners}** gagnant(s)\n` +
            `⏰ Fin : <t:${Math.floor(endTime / 1000)}:R>\n\n` +
            `👤 Organisé par : ${interaction.user}`
          )
          .setFooter({ text: '0 participant(s)' }).setTimestamp(endTime)],
        components: [row],
      });

      giveaway.create({ messageId: msg.id, channelId: interaction.channel.id, guildId: interaction.guild.id, prize, winners, endTime, hostId: interaction.user.id });

    } else if (sub === 'terminer') {
      await endGiveaway(interaction.options.getString('message_id'), client, interaction.guild);
      await interaction.reply({ content: '✅ Giveaway terminé !', ephemeral: true });

    } else if (sub === 'reroll') {
      const data = giveaway.getByMsg(interaction.options.getString('message_id'));
      if (!data) return interaction.reply({ content: '❌ Giveaway introuvable.', ephemeral: true });
      const participants = JSON.parse(data.participants);
      if (!participants.length) return interaction.reply({ content: '❌ Aucun participant.', ephemeral: true });
      const winner = participants[Math.floor(Math.random() * participants.length)];
      await interaction.reply(`🎲 Nouveau tirage : <@${winner}> remporte **${data.prize}** ! 🎉`);
    }
  },

  endGiveaway,
};

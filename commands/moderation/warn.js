const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { warn } = require('../../database/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('⚠️ Système d\'avertissements')
    .addSubcommand(s => s.setName('ajouter').setDescription('Ajouter un warn')
      .addUserOption(o => o.setName('membre').setDescription('Membre').setRequired(true))
      .addStringOption(o => o.setName('raison').setDescription('Raison').setRequired(true)))
    .addSubcommand(s => s.setName('liste').setDescription('Voir les warns d\'un membre')
      .addUserOption(o => o.setName('membre').setDescription('Membre').setRequired(true)))
    .addSubcommand(s => s.setName('supprimer').setDescription('Supprimer un warn par ID')
      .addIntegerOption(o => o.setName('id').setDescription('ID du warn').setRequired(true)))
    .addSubcommand(s => s.setName('effacer').setDescription('Effacer tous les warns d\'un membre')
      .addUserOption(o => o.setName('membre').setDescription('Membre').setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'ajouter') {
      const target = interaction.options.getUser('membre');
      const reason = interaction.options.getString('raison');
      warn.add(target.id, interaction.guild.id, interaction.user.id, reason);

      const warns = warn.list(target.id, interaction.guild.id);
      const embed = new EmbedBuilder().setColor('#FFFF00').setTitle('⚠️ Avertissement ajouté')
        .addFields(
          { name: 'Membre',     value: target.tag,           inline: true },
          { name: 'Modérateur', value: interaction.user.tag, inline: true },
          { name: 'Raison',     value: reason },
          { name: 'Total',      value: `${warns.length} warn(s)` }
        ).setTimestamp();
      await interaction.reply({ embeds: [embed] });

      // Log
      const logCh = interaction.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
      if (logCh) logCh.send({ embeds: [embed] });

      // Sanctions automatiques
      const member = interaction.guild.members.cache.get(target.id);
      if (member) {
        if (warns.length === 3) {
          await member.timeout(60 * 60 * 1000, 'Auto : 3 warns → mute 1h').catch(() => {});
          interaction.channel.send(`🔇 **${target.tag}** mute automatique **1h** (3 warns).`);
        } else if (warns.length === 5) {
          await member.kick('Auto : 5 warns → kick').catch(() => {});
          interaction.channel.send(`👢 **${target.tag}** expulsé automatiquement (5 warns).`);
        }
      }

    } else if (sub === 'liste') {
      const target = interaction.options.getUser('membre');
      const warns  = warn.list(target.id, interaction.guild.id);
      if (!warns.length) return interaction.reply({ content: `✅ **${target.tag}** n'a aucun avertissement.`, ephemeral: true });

      const embed = new EmbedBuilder().setColor('#FFFF00').setTitle(`⚠️ Warns de ${target.tag}`)
        .setDescription(warns.map(w =>
          `**#${w.id}** • <t:${Math.floor(w.timestamp / 1000)}:R>\n└ ${w.reason} — *par <@${w.moderator_id}>*`
        ).join('\n\n'));
      await interaction.reply({ embeds: [embed], ephemeral: true });

    } else if (sub === 'supprimer') {
      const id = interaction.options.getInteger('id');
      warn.remove(id);
      await interaction.reply({ content: `✅ Warn **#${id}** supprimé.`, ephemeral: true });

    } else if (sub === 'effacer') {
      const target = interaction.options.getUser('membre');
      warn.clear(target.id, interaction.guild.id);
      await interaction.reply({ content: `✅ Tous les warns de **${target.tag}** effacés.`, ephemeral: true });
    }
  },
};

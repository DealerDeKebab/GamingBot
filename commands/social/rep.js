const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { reputation } = require('../../database/database');

function getRepBadge(points) {
  if (points >= 100) return '🌟 Légende';
  if (points >= 50) return '💎 Vétéran';
  if (points >= 25) return '⭐ Reconnu';
  if (points >= 10) return '✨ Apprécié';
  if (points >= 5) return '👍 Fiable';
  if (points > 0) return '🆕 Nouveau';
  if (points < 0) return '⚠️ Suspect';
  return '😐 Neutre';
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rep')
    .setDescription('💌 Système de réputation')
    .addSubcommand(s => s.setName('give').setDescription('Donner un point de réputation')
      .addUserOption(o => o.setName('membre').setDescription('Membre à qui donner').setRequired(true))
      .addStringOption(o => o.setName('raison').setDescription('Raison (optionnel)').setRequired(false)))
    .addSubcommand(s => s.setName('remove').setDescription('Retirer un point (Modération)')
      .addUserOption(o => o.setName('membre').setDescription('Membre').setRequired(true))
      .addStringOption(o => o.setName('raison').setDescription('Raison').setRequired(false)))
    .addSubcommand(s => s.setName('voir').setDescription('Voir la réputation')
      .addUserOption(o => o.setName('membre').setDescription('Membre (sinon toi)').setRequired(false)))
    .addSubcommand(s => s.setName('top').setDescription('Leaderboard des réputations'))
    .addSubcommand(s => s.setName('stats').setDescription('Tes statistiques de réputation')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'give') {
      const target = interaction.options.getUser('membre');
      const reason = interaction.options.getString('raison') || 'Aucune raison';

      // Anti self-rep
      if (target.id === interaction.user.id) {
        return interaction.reply({ content: '❌ Tu ne peux pas te donner de la réputation à toi-même !', ephemeral: true });
      }

      // Anti bot-rep
      if (target.bot) {
        return interaction.reply({ content: '❌ Tu ne peux pas donner de réputation à un bot !', ephemeral: true });
      }

      const result = reputation.add(interaction.user.id, target.id, interaction.guildId, 1, reason);

      if (!result.success) {
        return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
      }

      const badge = getRepBadge(result.newPoints);

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Réputation donnée !')
        .setDescription(`${interaction.user} a donné **+1 réputation** à ${target}`)
        .addFields(
          { name: '💬 Raison', value: reason, inline: false },
          { name: '⭐ Nouvelle réputation', value: `${result.newPoints} points`, inline: true },
          { name: '🏅 Badge', value: badge, inline: true }
        )
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'remove') {
      // Vérifier permissions
      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return interaction.reply({ content: '❌ Tu n\'as pas la permission (Modérer les membres requis) !', ephemeral: true });
      }

      const target = interaction.options.getUser('membre');
      const reason = interaction.options.getString('raison') || 'Action de modération';

      const result = reputation.add(interaction.user.id, target.id, interaction.guildId, -1, reason);

      if (!result.success) {
        return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
      }

      const badge = getRepBadge(result.newPoints);

      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('⚠️ Réputation retirée')
        .setDescription(`${interaction.user} a retiré **-1 réputation** à ${target}`)
        .addFields(
          { name: '💬 Raison', value: reason, inline: false },
          { name: '⭐ Nouvelle réputation', value: `${result.newPoints} points`, inline: true },
          { name: '🏅 Badge', value: badge, inline: true }
        )
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'voir') {
      const target = interaction.options.getUser('membre') || interaction.user;
      const rep = reputation.get(target.id, interaction.guildId);
      const history = reputation.getHistory(target.id, interaction.guildId, 5);
      const badge = getRepBadge(rep.points);

      let historyText = '';
      if (history.length > 0) {
        for (const entry of history.slice(0, 5)) {
          const fromUser = await interaction.guild.members.fetch(entry.from_user_id).catch(() => null);
          const sign = entry.points > 0 ? '+' : '';
          const date = new Date(entry.timestamp);
          historyText += `${sign}${entry.points} par **${fromUser?.user.username || 'Inconnu'}** — *${entry.reason}*\n<t:${Math.floor(date / 1000)}:R>\n\n`;
        }
      } else {
        historyText = 'Aucun historique';
      }

      const embed = new EmbedBuilder()
        .setColor(rep.points >= 0 ? '#00FF00' : '#FF0000')
        .setTitle(`💌 Réputation de ${target.username}`)
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '⭐ Points', value: `${rep.points}`, inline: true },
          { name: '🏅 Badge', value: badge, inline: true },
          { name: '\u200b', value: '\u200b', inline: true },
          { name: '📜 Historique récent', value: historyText, inline: false }
        )
        .setFooter({ text: `ID: ${target.id}` })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'top') {
      const leaderboard = reputation.getLeaderboard(interaction.guildId, 10);

      if (leaderboard.length === 0) {
        return interaction.reply({ content: '❌ Aucune donnée de réputation !', ephemeral: true });
      }

      let description = '';
      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

      for (let i = 0; i < leaderboard.length; i++) {
        const entry = leaderboard[i];
        const member = await interaction.guild.members.fetch(entry.user_id).catch(() => null);
        const badge = getRepBadge(entry.points);
        description += `${medals[i]} **${member?.user.username || 'Inconnu'}** — ${entry.points} pts ${badge}\n`;
      }

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🏆 Top Réputation du Serveur')
        .setDescription(description)
        .setFooter({ text: 'Basé sur les points de réputation reçus' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'stats') {
      const stats = reputation.getStats(interaction.user.id, interaction.guildId);
      const myRep = reputation.get(interaction.user.id, interaction.guildId);

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`📊 Tes Statistiques de Réputation`)
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '⭐ Ta réputation', value: `${myRep.points} points`, inline: true },
          { name: '🏅 Ton badge', value: getRepBadge(myRep.points), inline: true },
          { name: '\u200b', value: '\u200b', inline: true },
          { name: '👍 Réputation donnée', value: `${stats.given.count || 0} fois (${stats.given.total || 0} pts)`, inline: true },
          { name: '💝 Réputation reçue', value: `${stats.received.count || 0} fois (${stats.received.total || 0} pts)`, inline: true }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  },
};

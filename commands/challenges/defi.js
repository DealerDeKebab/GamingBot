const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { challenges } = require('../../database/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('defi')
    .setDescription('🎯 Défis quotidiens communautaires')
    .addSubcommand(s => s.setName('actuel').setDescription('Voir le défi du jour'))
    .addSubcommand(s => s.setName('stats').setDescription('Voir tes contributions'))
    .addSubcommand(s => s.setName('historique').setDescription('Voir les défis passés'))
    .addSubcommand(s => s.setName('forcer').setDescription('Forcer la création d\'un défi (Admin)')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'actuel') {
      const challenge = challenges.getCurrent(interaction.guild.id);
      
      if (!challenge) {
        return interaction.reply({ 
          content: '❌ Aucun défi actif aujourd\'hui ! Le prochain défi sera lancé automatiquement à minuit.', 
          ephemeral: true 
        });
      }

      const progress = challenge.progress;
      const target = challenge.target;
      const percentage = Math.min(100, Math.floor((progress / target) * 100));
      const barLength = 20;
      const filledBars = Math.floor((percentage / 100) * barLength);
      const progressBar = '█'.repeat(filledBars) + '░'.repeat(barLength - filledBars);

      const contributors = JSON.parse(challenge.contributors || '{}');
      const topContributors = Object.entries(contributors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      const typeLabels = {
        'messages': '📝 Messages envoyés',
        'xp': '⭐ XP gagnés',
        'coins_bet': '🎲 Coins misés',
        'voice_time': '🎮 Minutes en vocal',
        'unique_members': '👥 Membres actifs',
      };

      const embed = new EmbedBuilder()
        .setColor(challenge.status === 'completed' ? '#00FF7F' : '#5865F2')
        .setTitle(`🎯 Défi du jour — ${new Date(challenge.date).toLocaleDateString('fr-FR')}`)
        .setDescription(`**${typeLabels[challenge.type] || challenge.type}**\n\n${progressBar}\n**${progress.toLocaleString()}** / **${target.toLocaleString()}** (${percentage}%)`)
        .setTimestamp();

      if (challenge.status === 'completed') {
        embed.addFields({ name: '✅ Défi réussi !', value: 'Tout le monde a reçu sa récompense !', inline: false });
      } else if (challenge.status === 'failed') {
        embed.addFields({ name: '❌ Défi échoué', value: 'Peut-être la prochaine fois !', inline: false });
      }

      if (topContributors.length > 0) {
        const top = topContributors.map((e, i) => `${['🥇','🥈','🥉'][i]} <@${e[0]}> — **${e[1].toLocaleString()}**`).join('\n');
        embed.addFields({ name: '🏆 Top contributeurs', value: top, inline: false });
      }

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'stats') {
      const totalContributions = challenges.getUserStats(interaction.guild.id, interaction.user.id);
      
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('📊 Tes statistiques de défis')
        .setDescription(`Tu as contribué un total de **${totalContributions.toLocaleString()}** points dans tous les défis !`)
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'historique') {
      const history = challenges.getHistory(interaction.guild.id);
      
      if (history.length === 0) {
        return interaction.reply({ content: '❌ Aucun défi dans l\'historique !', ephemeral: true });
      }

      const typeLabels = {
        'messages': '📝 Messages',
        'xp': '⭐ XP',
        'coins_bet': '🎲 Coins misés',
        'voice_time': '🎮 Temps vocal',
        'unique_members': '👥 Membres actifs',
      };

      const embed = new EmbedBuilder()
        .setColor('#9146FF')
        .setTitle('📜 Historique des défis')
        .setTimestamp();

      history.slice(0, 10).forEach(c => {
        const status = c.status === 'completed' ? '✅' : c.status === 'failed' ? '❌' : '⏳';
        const percentage = Math.floor((c.progress / c.target) * 100);
        embed.addFields({
          name: `${status} ${new Date(c.date).toLocaleDateString('fr-FR')}`,
          value: `${typeLabels[c.type] || c.type}\n${c.progress.toLocaleString()}/${c.target.toLocaleString()} (${percentage}%)`,
          inline: true
        });
      });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'forcer') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: '❌ Seuls les admins peuvent forcer un défi !', ephemeral: true });
      }

      const { createDailyChallenge } = require('../../utils/challengeManager');
      await interaction.deferReply({ ephemeral: true });
      
      try {
        await createDailyChallenge(interaction.client);
        return interaction.editReply({ content: '✅ Un nouveau défi a été créé !' });
      } catch (error) {
        console.error('Erreur création défi:', error);
        return interaction.editReply({ content: '❌ Erreur lors de la création du défi !' });
      }
    }
  },
};

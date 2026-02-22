const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { birthday } = require('../../database/database');

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

function getUpcomingBirthdays(guildId, limit = 10) {
  const all = birthday.all(guildId);
  if (!all.length) return [];

  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth() + 1;

  // Calculer les jours restants pour chaque anniversaire
  const withDays = all.map(b => {
    let daysUntil;
    
    // Si c'est ce mois et que la date n'est pas passée
    if (b.month === currentMonth && b.day >= currentDay) {
      daysUntil = b.day - currentDay;
    }
    // Si c'est un mois futur cette année
    else if (b.month > currentMonth) {
      const thisYear = new Date(now.getFullYear(), b.month - 1, b.day);
      daysUntil = Math.ceil((thisYear - now) / (1000 * 60 * 60 * 24));
    }
    // Sinon c'est l'année prochaine
    else {
      const nextYear = new Date(now.getFullYear() + 1, b.month - 1, b.day);
      daysUntil = Math.ceil((nextYear - now) / (1000 * 60 * 60 * 24));
    }

    return { ...b, daysUntil };
  });

  // Trier par nombre de jours restants
  return withDays.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, limit);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('anniversaires')
    .setDescription('🎂 Voir les anniversaires')
    .addSubcommand(s => s.setName('prochains').setDescription('Prochains anniversaires'))
    .addSubcommand(s => s.setName('aujourdhui').setDescription('Anniversaires d\'aujourd\'hui'))
    .addSubcommand(s => s.setName('mois').setDescription('Anniversaires ce mois-ci')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'prochains') {
      const upcoming = getUpcomingBirthdays(interaction.guildId, 10);

      if (!upcoming.length) {
        return interaction.reply({ content: '❌ Aucun anniversaire enregistré !', ephemeral: true });
      }

      let description = '';
      
      for (const b of upcoming) {
        const member = await interaction.guild.members.fetch(b.user_id).catch(() => null);
        if (!member) continue;

        const dateStr = `${b.day} ${MONTHS[b.month - 1]}`;
        const daysText = b.daysUntil === 0 
          ? '🎉 **Aujourd\'hui !**' 
          : b.daysUntil === 1 
            ? '🎈 **Demain**' 
            : `📅 Dans ${b.daysUntil} jours`;

        description += `${daysText} — **${member.user.username}** (${dateStr})\n`;
      }

      const embed = new EmbedBuilder()
        .setColor('#FF69B4')
        .setTitle('🎂 Prochains Anniversaires')
        .setDescription(description)
        .setFooter({ text: `${upcoming.length} anniversaire(s) à venir` })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'aujourdhui') {
      const today = birthday.today(interaction.guildId);

      if (!today.length) {
        return interaction.reply({ content: '😔 Aucun anniversaire aujourd\'hui !', ephemeral: true });
      }

      let description = '';
      
      for (const b of today) {
        const member = await interaction.guild.members.fetch(b.user_id).catch(() => null);
        if (!member) continue;

        const age = b.year ? new Date().getFullYear() - b.year : null;
        description += `🎉 ${member} ${age ? `— **${age} ans**` : ''}\n`;
      }

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🎂 Anniversaires d\'aujourd\'hui !')
        .setDescription(description)
        .setImage('https://media.giphy.com/media/g5R9dok94mrIvplmZd/giphy.gif')
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'mois') {
      const all = birthday.all(interaction.guildId);
      const currentMonth = new Date().getMonth() + 1;
      
      const thisMonth = all.filter(b => b.month === currentMonth);

      if (!thisMonth.length) {
        return interaction.reply({ content: '😔 Aucun anniversaire ce mois-ci !', ephemeral: true });
      }

      // Trier par jour
      thisMonth.sort((a, b) => a.day - b.day);

      let description = '';
      
      for (const b of thisMonth) {
        const member = await interaction.guild.members.fetch(b.user_id).catch(() => null);
        if (!member) continue;

        const dateStr = `${b.day} ${MONTHS[b.month - 1]}`;
        const age = b.year ? new Date().getFullYear() - b.year : null;
        
        description += `${dateStr} — **${member.user.username}** ${age ? `(${age} ans)` : ''}\n`;
      }

      const embed = new EmbedBuilder()
        .setColor('#9B59B6')
        .setTitle(`🎂 Anniversaires de ${MONTHS[currentMonth - 1]}`)
        .setDescription(description)
        .setFooter({ text: `${thisMonth.length} anniversaire(s) ce mois-ci` })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  },
};

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { birthday } = require('../../database/database');
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MSHORT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
module.exports = {
  data: new SlashCommandBuilder().setName('anniversaire').setDescription('🎂 Gestion des anniversaires')
    .addSubcommand(s => s.setName('définir').setDescription('Enregistrer ton anniversaire')
      .addIntegerOption(o => o.setName('jour').setDescription('Jour (1-31)').setRequired(true).setMinValue(1).setMaxValue(31))
      .addIntegerOption(o => o.setName('mois').setDescription('Mois (1-12)').setRequired(true).setMinValue(1).setMaxValue(12))
      .addIntegerOption(o => o.setName('année').setDescription('Année (optionnel)').setMinValue(1900).setMaxValue(2010)))
    .addSubcommand(s => s.setName('voir').setDescription('Voir l\'anniversaire d\'un membre')
      .addUserOption(o => o.setName('membre').setDescription('Membre')))
    .addSubcommand(s => s.setName('prochain').setDescription('Prochains anniversaires')),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'définir') {
      const day = interaction.options.getInteger('jour');
      const month = interaction.options.getInteger('mois');
      const year = interaction.options.getInteger('année');
      birthday.set(interaction.user.id, interaction.guild.id, day, month, year);
      await interaction.reply({ embeds: [new EmbedBuilder().setColor('#FF69B4').setTitle('🎂 Anniversaire enregistré !')
        .setDescription(`Ton anniversaire est le **${day} ${MONTHS[month-1]}${year ? ` ${year}` : ''}** 🎉`)], ephemeral: true });
    } else if (sub === 'voir') {
      const target = interaction.options.getUser('membre') || interaction.user;
      const data = birthday.get(target.id, interaction.guild.id);
      if (!data) return interaction.reply({ content: `❌ **${target.username}** n'a pas enregistré son anniversaire.`, ephemeral: true });
      await interaction.reply({ embeds: [new EmbedBuilder().setColor('#FF69B4').setTitle(`🎂 ${target.username}`)
        .setDescription(`**${data.day} ${MONTHS[data.month-1]}${data.year ? ` ${data.year}` : ''}**`)
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))] });
    } else if (sub === 'prochain') {
      const all = birthday.all(interaction.guild.id);
      if (!all.length) return interaction.reply({ content: '❌ Aucun anniversaire enregistré.', ephemeral: true });
      const now = new Date();
      const sorted = all.map(b => {
        let days = (b.month - now.getMonth() - 1) * 30 + (b.day - now.getDate());
        if (days < 0) days += 365;
        return { ...b, days };
      }).sort((a, b) => a.days - b.days).slice(0, 5);
      await interaction.reply({ embeds: [new EmbedBuilder().setColor('#FF69B4').setTitle('🎂 Prochains anniversaires')
        .setDescription(sorted.map(b =>
          `🎉 <@${b.user_id}> — **${b.day} ${MSHORT[b.month-1]}** (${b.days === 0 ? "aujourd'hui !" : `dans ${b.days} jour(s)`})`
        ).join('\n'))] });
    }
  },
};

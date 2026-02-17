const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { xp } = require('../../database/database');
module.exports = {
  data: new SlashCommandBuilder().setName('rank').setDescription('📊 Voir ton niveau et XP')
    .addUserOption(o => o.setName('membre').setDescription('Voir le rang d\'un autre membre')),
  async execute(interaction) {
    const target = interaction.options.getUser('membre') || interaction.user;
    const data   = xp.getUser(target.id, interaction.guild.id);
    if (!data) return interaction.reply({ content: `${target.username} n'a pas encore d'XP !`, ephemeral: true });
    const needed   = xp.xpForLevel(data.level);
    const progress = Math.min(100, Math.floor((data.xp / needed) * 100));
    const bar      = '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));
    const lb       = xp.leaderboard(interaction.guild.id, 100);
    const rank     = lb.findIndex(u => u.user_id === target.id) + 1;
    await interaction.reply({ embeds: [
      new EmbedBuilder().setColor('#5865F2').setTitle(`📊 ${target.username}`)
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '🏆 Rang',      value: `#${rank} / ${lb.length}`,    inline: true },
          { name: '⭐ Niveau',     value: `${data.level}`,              inline: true },
          { name: '💬 Messages',   value: `${data.messages}`,           inline: true },
          { name: '✨ XP',          value: `${data.xp} / ${needed}`,    inline: true },
          { name: '📈 Progression', value: `${bar} **${progress}%**` }
        )
        .setFooter({ text: `${needed - data.xp} XP pour le niveau ${data.level + 1}` }).setTimestamp()
    ]});
  },
};

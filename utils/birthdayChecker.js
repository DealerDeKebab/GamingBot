const { EmbedBuilder } = require('discord.js');
const { birthday } = require('../database/database');

async function checkBirthdays(client) {
  const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  for (const [guildId, guild] of client.guilds.cache) {
    const today = birthday.today(guildId);
    if (!today.length) continue;
    const ch = guild.channels.cache.get(process.env.BIRTHDAY_CHANNEL_ID);
    if (!ch) continue;
    for (const b of today) {
      const member = guild.members.cache.get(b.user_id);
      if (!member) continue;
      const age = b.year ? new Date().getFullYear() - b.year : null;
      const embed = new EmbedBuilder().setColor('#FF69B4').setTitle('🎂 Joyeux Anniversaire !')
        .setDescription(
          `🎉 Toute la communauté souhaite un joyeux anniversaire à **${member.user.username}** !\n` +
          (age ? `🎈 Il/Elle a **${age} ans** aujourd'hui !\n` : '') +
          '\n🎮 On t\'espère une super journée full gaming !'
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true })).setTimestamp();
      await ch.send({ content: `<@${b.user_id}>`, embeds: [embed] });
    }
  }
}
module.exports = { checkBirthdays };

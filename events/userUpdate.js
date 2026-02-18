const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'userUpdate',
  async execute(oldUser, newUser, client) {
    // Avatar changé
    if (oldUser.displayAvatarURL() !== newUser.displayAvatarURL()) {
      for (const [, guild] of client.guilds.cache) {
        const member = guild.members.cache.get(newUser.id);
        if (!member) continue;

        const logChannel = guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
        if (!logChannel) continue;

        const embed = new EmbedBuilder()
          .setColor('#9146FF')
          .setTitle('🖼️ Avatar modifié')
          .addFields({ name: '👤 Membre', value: `${newUser.tag} (${newUser.id})` })
          .setThumbnail(newUser.displayAvatarURL({ dynamic: true, size: 256 }))
          .setImage(oldUser.displayAvatarURL({ dynamic: true, size: 256 }))
          .setFooter({ text: 'Ancien avatar ci-dessus' })
          .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch(() => {});
        break; // Log qu'une fois même si dans plusieurs serveurs
      }
    }

    // Pseudo changé
    if (oldUser.username !== newUser.username) {
      for (const [, guild] of client.guilds.cache) {
        const member = guild.members.cache.get(newUser.id);
        if (!member) continue;

        const logChannel = guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
        if (!logChannel) continue;

        const embed = new EmbedBuilder()
          .setColor('#00BFFF')
          .setTitle('✏️ Pseudo Discord modifié')
          .addFields(
            { name: '👤 Membre', value: `${newUser.tag} (${newUser.id})`, inline: false },
            { name: '📝 Ancien pseudo', value: oldUser.username, inline: true },
            { name: '📝 Nouveau pseudo', value: newUser.username, inline: true },
          )
          .setThumbnail(newUser.displayAvatarURL({ dynamic: true }))
          .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch(() => {});
        break;
      }
    }
  },
};

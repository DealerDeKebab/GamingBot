const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
module.exports = {
  data: new SlashCommandBuilder().setName('twitch').setDescription('📺 Vérifier si un streamer est en live')
    .addStringOption(o => o.setName('streamer').setDescription('Nom du streamer').setRequired(true)),
  async execute(interaction) {
    const name = interaction.options.getString('streamer');
    await interaction.deferReply();
    try {
      const tokenRes = await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`);
      const token = tokenRes.data.access_token;
      const headers = { 'Client-Id': process.env.TWITCH_CLIENT_ID, 'Authorization': `Bearer ${token}` };
      const streamRes = await axios.get(`https://api.twitch.tv/helix/streams?user_login=${name}`, { headers });
      if (!streamRes.data.data.length) {
        return interaction.editReply({ embeds: [new EmbedBuilder().setColor('#9146FF').setTitle(`📴 ${name} n'est pas en live`).setTimestamp()] });
      }
      const s = streamRes.data.data[0];
      const userRes = await axios.get(`https://api.twitch.tv/helix/users?login=${name}`, { headers });
      const u = userRes.data.data[0];
      await interaction.editReply({ embeds: [new EmbedBuilder().setColor('#9146FF')
        .setTitle(`🔴 ${s.user_name} est EN LIVE !`).setURL(`https://twitch.tv/${s.user_login}`)
        .setDescription(`**${s.title}**`)
        .addFields(
          { name: '🎮 Jeu',     value: s.game_name || 'Non spécifié', inline: true },
          { name: '👥 Viewers', value: String(s.viewer_count),        inline: true },
          { name: '🌐 Langue',  value: s.language.toUpperCase(),      inline: true },
        )
        .setThumbnail(u?.profile_image_url)
        .setImage(s.thumbnail_url.replace('{width}','1280').replace('{height}','720'))
        .setTimestamp()] });
    } catch { await interaction.editReply({ content: '❌ Erreur Twitch. Vérifie tes clés API dans `.env`.' }); }
  },
};

const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

let _token = null;
let _wasLive = false;

async function getToken() {
  if (_token) return _token;
  const res = await axios.post(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`
  );
  _token = res.data.access_token;
  // Renouvellement auto après 50 jours
  setTimeout(() => { _token = null; }, 50 * 24 * 60 * 60 * 1000);
  return _token;
}

async function checkTwitch(client) {
  const username = process.env.TWITCH_USERNAME;
  if (!username || !process.env.TWITCH_CLIENT_ID) return;
  try {
    const token = await getToken();
    const res = await axios.get(
      `https://api.twitch.tv/helix/streams?user_login=${username}`,
      { headers: { 'Client-Id': process.env.TWITCH_CLIENT_ID, 'Authorization': `Bearer ${token}` }, timeout: 5000 }
    );
    const isLive = res.data.data.length > 0;
    if (isLive && !_wasLive) {
      _wasLive = true;
      const stream = res.data.data[0];
      const ch = client.guilds.cache.map(g => g.channels.cache.get(process.env.TWITCH_CHANNEL_ID)).find(Boolean);
      if (!ch) return;
      const embed = new EmbedBuilder().setColor('#9146FF')
        .setTitle(`🔴 ${stream.user_name} est EN LIVE !`)
        .setURL(`https://twitch.tv/${stream.user_login}`)
        .setDescription(`**${stream.title}**`)
        .addFields(
          { name: '🎮 Jeu', value: stream.game_name || 'Non spécifié', inline: true },
          { name: '👥 Viewers', value: String(stream.viewer_count), inline: true },
          { name: '🌐 Langue',  value: stream.language.toUpperCase(), inline: true },
        )
        .setImage(stream.thumbnail_url.replace('{width}','1280').replace('{height}','720'))
        .setTimestamp();
      ch.send({ content: '@here 🎮 Le stream vient de démarrer !', embeds: [embed] });
    } else if (!isLive) {
      _wasLive = false;
    }
  } catch (e) {
    if (e.response?.status === 401) _token = null; // Token expiré, renouvellement au prochain check
    else console.error('Twitch checker error:', e.message);
  }
}
module.exports = { checkTwitch };

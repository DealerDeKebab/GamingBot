const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const EMOJIS = { Clear:'☀️', Clouds:'☁️', Rain:'🌧️', Drizzle:'🌦️', Thunderstorm:'⛈️', Snow:'❄️', Mist:'🌫️', Fog:'🌫️' };
module.exports = {
  data: new SlashCommandBuilder().setName('meteo').setDescription('🌤️ Météo d\'une ville')
    .addStringOption(o => o.setName('ville').setDescription('Nom de la ville').setRequired(true)),
  async execute(interaction) {
    const city = interaction.options.getString('ville');
    await interaction.deferReply();
    try {
      const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${process.env.WEATHER_API_KEY}&units=metric&lang=fr`, { timeout: 6000 });
      const d = res.data;
      const emoji = EMOJIS[d.weather[0].main] || '🌡️';
      await interaction.editReply({ embeds: [new EmbedBuilder().setColor('#87CEEB')
        .setTitle(`${emoji} Météo à ${d.name}, ${d.sys.country}`)
        .setDescription(`**${d.weather[0].description.charAt(0).toUpperCase() + d.weather[0].description.slice(1)}**`)
        .addFields(
          { name: '🌡️ Température', value: `${Math.round(d.main.temp)}°C (ressenti ${Math.round(d.main.feels_like)}°C)`, inline: true },
          { name: '💧 Humidité',    value: `${d.main.humidity}%`, inline: true },
          { name: '💨 Vent',        value: `${Math.round(d.wind.speed * 3.6)} km/h`, inline: true },
          { name: '👁️ Visibilité',  value: `${(d.visibility/1000).toFixed(1)} km`, inline: true },
          { name: '📊 Pression',    value: `${d.main.pressure} hPa`, inline: true },
          { name: '🌅 Lever/Coucher', value: `<t:${d.sys.sunrise}:t> / <t:${d.sys.sunset}:t>`, inline: true },
        ).setFooter({ text: 'OpenWeatherMap' }).setTimestamp()] });
    } catch (e) {
      await interaction.editReply({ content: e.response?.status === 404 ? '❌ Ville introuvable.' : '❌ Erreur API météo.' });
    }
  },
};

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, StreamType } = require('@discordjs/voice');
const { spawn } = require('child_process');

// Liste des radios disponibles
const RADIOS = {
  'lofi': {
    name: '🎵 Lofi Girl 24/7',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    emoji: '🎵',
  },
  'nrj': {
    name: '📻 NRJ France',
    url: 'http://cdn.nrjaudio.fm/audio1/fr/30001/mp3_128.mp3',
    emoji: '📻',
  },
  'skyrock': {
    name: '🎤 Skyrock',
    url: 'http://icecast.skyrock.net/s/natio_mp3_128k',
    emoji: '🎤',
  },
  'funradio': {
    name: '🎧 Fun Radio',
    url: 'http://streaming.radio.funradio.fr/fun-1-48-192',
    emoji: '🎧',
  },
  'fip': {
    name: '🎼 FIP',
    url: 'https://stream.radiofrance.fr/fip/fip_hifi.m3u8',
    emoji: '🎼',
  },
  'monstercat': {
    name: '🎮 Monstercat FM',
    url: 'https://live.monstercat.com/radio.mp3',
    emoji: '🎮',
  },
  'synthwave': {
    name: '🌆 Nightride FM (Synthwave)',
    url: 'https://stream.nightride.fm/nightride.m4a',
    emoji: '🌆',
  },
  'chillhop': {
    name: '🍃 Chillhop Music',
    url: 'http://stream.zeno.fm/fyn8eh3h5f8uv',
    emoji: '🍃',
  },
  'anime': {
    name: '🎌 Anime Music Radio',
    url: 'https://cast1.torontocast.com:2020/stream/animemusic',
    emoji: '🎌',
  },
  'jazz': {
    name: '🎷 Jazz24',
    url: 'https://live.wostreaming.net/direct/ppm-jazz24aac-ibc1',
    emoji: '🎷',
  },
};

// Stockage des radios actives par serveur
const activeRadios = new Map();

function createRadioStream(url) {
  // Utiliser ffmpeg pour streamer la radio
  const ffmpeg = spawn('ffmpeg', [
    '-reconnect', '1',
    '-reconnect_streamed', '1',
    '-reconnect_delay_max', '5',
    '-i', url,
    '-f', 's16le',
    '-ar', '48000',
    '-ac', '2',
    'pipe:1'
  ]);
  return ffmpeg.stdout;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('radio')
    .setDescription('🎵 Radio 24h/24 dans un salon vocal')
    .addSubcommand(s => s.setName('start').setDescription('Lancer une radio')
      .addStringOption(o => {
        o.setName('station').setDescription('Station de radio').setRequired(true);
        Object.entries(RADIOS).forEach(([key, radio]) => {
          o.addChoices({ name: radio.name, value: key });
        });
        return o;
      })
      .addChannelOption(o => o.setName('salon').setDescription('Salon vocal (optionnel)')))
    .addSubcommand(s => s.setName('stop').setDescription('Arrêter la radio'))
    .addSubcommand(s => s.setName('volume').setDescription('Régler le volume')
      .addIntegerOption(o => o.setName('niveau').setDescription('Volume (0-150)').setRequired(true).setMinValue(0).setMaxValue(150)))
    .addSubcommand(s => s.setName('liste').setDescription('Voir toutes les radios disponibles'))
    .addSubcommand(s => s.setName('info').setDescription('Voir la radio en cours')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // ══════════════════════════════════════════
    //  START
    // ══════════════════════════════════════════
    if (sub === 'start') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: '❌ Seuls les admins peuvent lancer la radio !', ephemeral: true });
      }

      const stationKey = interaction.options.getString('station');
      const station = RADIOS[stationKey];
      const targetChannel = interaction.options.getChannel('salon') || interaction.member.voice.channel;

      if (!targetChannel) {
        return interaction.reply({ content: '❌ Tu dois être dans un salon vocal ou en spécifier un !', ephemeral: true });
      }

      await interaction.deferReply();

      try {
        const connection = joinVoiceChannel({
          channelId: targetChannel.id,
          guildId: interaction.guild.id,
          adapterCreator: interaction.guild.voiceAdapterCreator,
          selfDeaf: false,
        });

        const player = createAudioPlayer();
        connection.subscribe(player);

        const stream = createRadioStream(station.url);
        const resource = createAudioResource(stream, {
          inputType: StreamType.Raw,
          inlineVolume: true,
        });
        resource.volume?.setVolume(0.5);

        player.play(resource);

        // Gérer les déconnexions et redémarrer automatiquement
        player.on(AudioPlayerStatus.Idle, () => {
          setTimeout(() => {
            if (activeRadios.has(interaction.guild.id)) {
              const newStream = createRadioStream(station.url);
              const newResource = createAudioResource(newStream, {
                inputType: StreamType.Raw,
                inlineVolume: true,
              });
              const vol = activeRadios.get(interaction.guild.id).volume || 0.5;
              newResource.volume?.setVolume(vol);
              player.play(newResource);
            }
          }, 1000);
        });

        player.on('error', error => {
          console.error('Radio error:', error);
          setTimeout(() => {
            if (activeRadios.has(interaction.guild.id)) {
              const newStream = createRadioStream(station.url);
              const newResource = createAudioResource(newStream, {
                inputType: StreamType.Raw,
                inlineVolume: true,
              });
              player.play(newResource);
            }
          }, 5000);
        });

        activeRadios.set(interaction.guild.id, {
          connection,
          player,
          station: stationKey,
          channel: targetChannel,
          volume: 0.5,
        });

        const embed = new EmbedBuilder()
          .setColor('#9146FF')
          .setTitle('📻 Radio démarrée !')
          .setDescription(`${station.emoji} **${station.name}**`)
          .addFields(
            { name: '📍 Salon', value: targetChannel.name, inline: true },
            { name: '🔊 Volume', value: '50%', inline: true },
          )
          .setFooter({ text: 'La radio tournera 24h/24 jusqu\'à ce que tu l\'arrêtes !' })
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });

      } catch (error) {
        console.error('Radio start error:', error);
        return interaction.editReply({ content: '❌ Erreur lors du démarrage de la radio !' });
      }
    }

    // ══════════════════════════════════════════
    //  STOP
    // ══════════════════════════════════════════
    if (sub === 'stop') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: '❌ Seuls les admins peuvent arrêter la radio !', ephemeral: true });
      }

      const radio = activeRadios.get(interaction.guild.id);
      if (!radio) {
        return interaction.reply({ content: '❌ Aucune radio en cours !', ephemeral: true });
      }

      radio.connection.destroy();
      activeRadios.delete(interaction.guild.id);

      return interaction.reply({ content: '⏹️ Radio arrêtée !', ephemeral: true });
    }

    // ══════════════════════════════════════════
    //  VOLUME
    // ══════════════════════════════════════════
    if (sub === 'volume') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: '❌ Seuls les admins peuvent changer le volume !', ephemeral: true });
      }

      const radio = activeRadios.get(interaction.guild.id);
      if (!radio) {
        return interaction.reply({ content: '❌ Aucune radio en cours !', ephemeral: true });
      }

      const volume = interaction.options.getInteger('niveau') / 100;
      radio.volume = volume;

      // Note: on ne peut pas changer le volume d'un stream en cours avec ffmpeg
      // Il faudrait restart le stream, donc on informe juste l'utilisateur
      return interaction.reply({ 
        content: `🔊 Volume défini à **${Math.round(volume * 100)}%**\n⚠️ Le changement prendra effet au prochain redémarrage automatique de la radio.`, 
        ephemeral: true 
      });
    }

    // ══════════════════════════════════════════
    //  LISTE
    // ══════════════════════════════════════════
    if (sub === 'liste') {
      const embed = new EmbedBuilder()
        .setColor('#9146FF')
        .setTitle('📻 Radios disponibles')
        .setDescription('Utilise `/radio start` pour lancer une station !')
        .setTimestamp();

      Object.entries(RADIOS).forEach(([key, radio]) => {
        embed.addFields({ name: radio.name, value: `\`/radio start station:${key}\``, inline: false });
      });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ══════════════════════════════════════════
    //  INFO
    // ══════════════════════════════════════════
    if (sub === 'info') {
      const radio = activeRadios.get(interaction.guild.id);
      if (!radio) {
        return interaction.reply({ content: '❌ Aucune radio en cours !', ephemeral: true });
      }

      const station = RADIOS[radio.station];
      const embed = new EmbedBuilder()
        .setColor('#9146FF')
        .setTitle('📻 Radio en cours')
        .setDescription(`${station.emoji} **${station.name}**`)
        .addFields(
          { name: '📍 Salon', value: radio.channel.name, inline: true },
          { name: '🔊 Volume', value: `${Math.round(radio.volume * 100)}%`, inline: true },
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

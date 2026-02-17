const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {
  joinVoiceChannel, createAudioPlayer, createAudioResource,
  AudioPlayerStatus, VoiceConnectionStatus, StreamType,
} = require('@discordjs/voice');
const { spawn } = require('child_process');

function getOrCreateQueue(client, guild) {
  if (!client.musicQueues.has(guild.id)) {
    client.musicQueues.set(guild.id, { connection: null, player: null, queue: [], current: null });
  }
  return client.musicQueues.get(guild.id);
}

async function fetchTrackInfo(query) {
  return new Promise((resolve, reject) => {
    const isUrl = /^https?:\/\//.test(query);
    const args  = ['--dump-json', '--no-playlist', '--quiet', isUrl ? query : `ytsearch1:${query}`];
    const proc  = spawn('yt-dlp', args);
    let data = '', err = '';
    proc.stdout.on('data', d => data += d);
    proc.stderr.on('data', d => err  += d);
    proc.on('close', code => {
      if (code !== 0 || !data) return reject(new Error(err || 'Aucun résultat'));
      try {
        const info = JSON.parse(data.trim().split('\n')[0]);
        resolve({ title: info.title, url: info.webpage_url || info.url, thumbnail: info.thumbnail || null, duration: info.duration_string || '?' });
      } catch (e) { reject(e); }
    });
    setTimeout(() => { proc.kill(); reject(new Error('Timeout')); }, 15000);
  });
}

function createYtDlpStream(url) {
  return spawn('yt-dlp', [
    '--extractor-args', 'youtube:player_client=android',
    '--extractor-args', 'youtube:formats=missing_pot',
    '-f', 'bestaudio',
    '--no-playlist',
    '-o', '-',
    '--quiet',
    url
  ]).stdout;
}

async function startPlaying(queue, channel) {
  if (!queue.queue.length) { queue.current = null; return; }
  const track = queue.queue[0];
  try {
    const stream   = createYtDlpStream(track.url);
    const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary, inlineVolume: true });
    resource.volume?.setVolume(0.8);
    queue.player.play(resource);
    queue.current = track;
    if (channel) {
      channel.send({ embeds: [new EmbedBuilder().setColor('#1DB954').setTitle('🎵 En lecture')
        .setDescription(`**[${track.title}](${track.url})**`)
        .addFields(
          { name: '⏱️ Durée',       value: track.duration,  inline: true },
          { name: '👤 Demandé par', value: track.requester, inline: true },
          { name: '📋 File',        value: `${queue.queue.length} titre(s)`, inline: true }
        ).setThumbnail(track.thumbnail)] }).catch(() => {});
    }
  } catch (err) {
    console.error('Erreur lecture piste:', err.message);
    queue.queue.shift();
    await startPlaying(queue, channel);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play').setDescription('🎵 Jouer de la musique (YouTube)')
    .addStringOption(o => o.setName('recherche').setDescription('Titre, artiste ou lien YouTube').setRequired(true)),

  async execute(interaction, client) {
    const voiceCh = interaction.member.voice.channel;
    if (!voiceCh) return interaction.reply({ content: '❌ Rejoins un salon vocal !', ephemeral: true });
    const query = interaction.options.getString('recherche');
    await interaction.deferReply();
    let track;
    try { track = await fetchTrackInfo(query); }
    catch (e) { return interaction.editReply({ content: `❌ Erreur : ${e.message}` }); }
    track.requester = interaction.user.tag;

    const queue = getOrCreateQueue(client, interaction.guild);
    queue.queue.push(track);

    if (!queue.connection || queue.connection.state.status === VoiceConnectionStatus.Disconnected) {
      queue.connection = joinVoiceChannel({ channelId: voiceCh.id, guildId: interaction.guild.id, adapterCreator: interaction.guild.voiceAdapterCreator, selfDeaf: true });
      queue.player = createAudioPlayer();
      queue.connection.subscribe(queue.player);

      queue.player.on(AudioPlayerStatus.Idle, () => {
        queue.queue.shift();
        if (queue.queue.length > 0) { startPlaying(queue, interaction.channel); }
        else {
          queue.current = null;
          interaction.channel.send('⏹️ File vide — déconnexion dans 30s.').then(m => {
            setTimeout(() => { if (!queue.current) { queue.connection?.destroy(); client.musicQueues.delete(interaction.guild.id); } m.delete().catch(() => {}); }, 30000);
          }).catch(() => {});
        }
      });
      queue.player.on('error', err => { console.error('Player error:', err.message); queue.queue.shift(); startPlaying(queue, interaction.channel); });
    }

    if (queue.queue.length === 1 && !queue.current) {
      await startPlaying(queue, null);
      await interaction.editReply({ embeds: [new EmbedBuilder().setColor('#1DB954').setTitle('▶️ Lecture démarrée').setDescription(`**[${track.title}](${track.url})**`).addFields({ name: '⏱️ Durée', value: track.duration, inline: true }).setThumbnail(track.thumbnail)] });
    } else {
      await interaction.editReply({ embeds: [new EmbedBuilder().setColor('#1DB954').setTitle('➕ Ajouté à la file').setDescription(`**[${track.title}](${track.url})**`).addFields({ name: '📋 Position', value: `#${queue.queue.length}`, inline: true }).setThumbnail(track.thumbnail)] });
    }
  },
};

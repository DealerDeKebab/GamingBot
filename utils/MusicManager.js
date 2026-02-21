const { Shoukaku, Connectors } = require('shoukaku');

class MusicManager {
  constructor(client) {
    this.client = client;
    this.queues = new Map();
    
    // Configuration Shoukaku
    const nodes = [{
      name: 'main',
      url: `${process.env.LAVALINK_HOST || 'localhost'}:${process.env.LAVALINK_PORT || 2333}`,
      auth: process.env.LAVALINK_PASSWORD || 'youshallnotpass'
    }];

    this.shoukaku = new Shoukaku(new Connectors.DiscordJS(client), nodes, {
      moveOnDisconnect: false,
      resumable: false,
      resumableTimeout: 30,
      reconnectTries: 2,
      restTimeout: 10000
    });

    this.setupEvents();
  }

  setupEvents() {
    this.shoukaku.on('ready', (name) => console.log(`✅ Noeud Lavalink "${name}" prêt`));
    this.shoukaku.on('error', (name, error) => console.error(`❌ Erreur Lavalink "${name}":`, error));
    this.shoukaku.on('close', (name, code, reason) => console.log(`🔌 Noeud "${name}" déconnecté (${code}): ${reason}`));
    this.shoukaku.on('disconnect', (name, count) => console.log(`⚠️  Noeud "${name}" déconnecté (tentatives: ${count})`));
  }

  async play(interaction, query) {
    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({ content: '❌ Tu dois être dans un salon vocal !', ephemeral: true });
    }

    await interaction.deferReply();

    // Créer ou récupérer le player
    let player = this.shoukaku.players.get(interaction.guildId);
    const node = this.shoukaku.getNode();
    
    if (!player) {
      const node = this.shoukaku.getNode();
      player = await node.joinChannel({
        guildId: interaction.guildId,
        channelId: voiceChannel.id,
        shardId: interaction.guild.shardId,
        deaf: true
      });

      // Events du player
      player.on('end', () => this.handleTrackEnd(interaction.guildId, player));
      player.on('exception', (data) => {
        console.error('Erreur lecture:', data);
        interaction.channel.send('❌ Erreur lors de la lecture.');
      });
      player.on('stuck', () => {
        console.log('Track stuck, skipping...');
        this.skip(interaction.guildId, player);
      });
    }

    // Rechercher la piste
    const result = await node.rest.resolve(query.startsWith('http') ? query : `ytsearch:${query}`);
    
    if (!result || !result.tracks.length) {
      return interaction.editReply('❌ Aucun résultat trouvé !');
    }

    const track = result.tracks[0];

    // Ajouter à la queue
    let queue = this.queues.get(interaction.guildId);
    if (!queue) {
      queue = { tracks: [], current: null, textChannel: interaction.channel.id, voiceChannel: voiceChannel.id };
      this.queues.set(interaction.guildId, queue);
    }

    queue.tracks.push(track);

    // Si rien ne joue, lancer
    if (!player.track) {
      this.playNext(interaction.guildId, player);
      return interaction.editReply(`🎵 Lecture : **${track.info.title}**`);
    } else {
      return interaction.editReply(`✅ Ajouté à la file : **${track.info.title}**`);
    }
  }

  playNext(guildId, player) {
    const queue = this.queues.get(guildId);
    if (!queue || queue.tracks.length === 0) {
      queue.current = null;
      return;
    }

    const track = queue.tracks.shift();
    queue.current = track;
    
    player.playTrack({ track: track.encoded });

    const channel = this.client.channels.cache.get(queue.textChannel);
    if (channel) {
      channel.send(`🎵 Lecture : **${track.info.title}**`);
    }
  }

  handleTrackEnd(guildId, player) {
    const queue = this.queues.get(guildId);
    if (!queue) return;

    if (queue.tracks.length > 0) {
      this.playNext(guildId, player);
    } else {
      queue.current = null;
      const channel = this.client.channels.cache.get(queue.textChannel);
      if (channel) {
        channel.send('✅ File d\'attente terminée !');
      }
    }
  }

  pause(guildId) {
    const player = this.shoukaku.players.get(guildId);
    if (player) {
      player.setPaused(true);
      return true;
    }
    return false;
  }

  resume(guildId) {
    const player = this.shoukaku.players.get(guildId);
    if (player) {
      player.setPaused(false);
      return true;
    }
    return false;
  }

  skip(guildId, player = null) {
    if (!player) player = this.shoukaku.players.get(guildId);
    if (player) {
      player.stopTrack();
      return true;
    }
    return false;
  }

  stop(guildId) {
    const player = this.shoukaku.players.get(guildId);
    if (player) {
      this.queues.delete(guildId);
      player.connection.disconnect();
      return true;
    }
    return false;
  }

  setVolume(guildId, volume) {
    const player = this.shoukaku.players.get(guildId);
    if (player) {
      player.setFilterVolume(volume / 100);
      return true;
    }
    return false;
  }

  getQueue(guildId) {
    return this.queues.get(guildId);
  }
}

module.exports = MusicManager;

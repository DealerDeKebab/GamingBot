const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { tempVoice } = require('../database/database');

// Configuration des salons par jeu (ajoutez vos jeux ici)
const GAME_CHANNELS = {
  // Format: 'ID_SALON_DECLENCHEUR': { name: 'Nom du jeu', emoji: 'Emoji' }
  // Exemples (à configurer dans .env) :
};

// Charger la config depuis .env
function loadGameChannels() {
  const gameConfig = process.env.GAME_VOICE_CHANNELS;
  if (!gameConfig) return GAME_CHANNELS;
  
  try {
    // Format: ID:NOM:EMOJI,ID:NOM:EMOJI
    // Exemple: 123456:CS2:🎮,789012:Rocket League:🚗
    const games = gameConfig.split(',');
    games.forEach(game => {
      const [id, name, emoji] = game.split(':');
      if (id && name && emoji) {
        GAME_CHANNELS[id.trim()] = { name: name.trim(), emoji: emoji.trim() };
      }
    });
  } catch (error) {
    console.error('Erreur chargement config jeux:', error.message);
  }
  
  return GAME_CHANNELS;
}

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, client) {
    const CREATE_CHANNEL_ID = process.env.VOICE_CREATE_CHANNEL_ID;
    const gameChannels = loadGameChannels();

    // ══════════════════════════════════════════
    //  CRÉATION D'UN SALON TEMPORAIRE (GÉNÉRAL)
    // ══════════════════════════════════════════
    if (newState.channelId === CREATE_CHANNEL_ID && !oldState.channelId) {
      await createTempVoiceChannel(newState, '🎤', null);
      return;
    }

    // ══════════════════════════════════════════
    //  CRÉATION D'UN SALON TEMPORAIRE (JEUX)
    // ══════════════════════════════════════════
    if (gameChannels[newState.channelId] && !oldState.channelId) {
      const gameConfig = gameChannels[newState.channelId];
      await createTempVoiceChannel(newState, gameConfig.emoji, gameConfig.name);
      return;
    }

    // ══════════════════════════════════════════
    //  SUPPRESSION D'UN SALON VIDE
    // ══════════════════════════════════════════
    if (oldState.channelId) {
      const oldChannel = oldState.guild.channels.cache.get(oldState.channelId);
      if (!oldChannel) return;

      const tempChannel = tempVoice.get(oldState.channelId);
      if (!tempChannel) return;

      // Vérifier si le salon est vide
      if (oldChannel.members.size === 0) {
        try {
          await oldChannel.delete();
          tempVoice.delete(oldState.channelId);
          console.log(`🗑️ Salon vocal temporaire supprimé: ${oldChannel.name}`);
        } catch (error) {
          console.error('Erreur suppression salon vocal:', error.message);
        }
      }
    }
  },
};

// ══════════════════════════════════════════
//  FONCTION DE CRÉATION DE SALON
// ══════════════════════════════════════════
async function createTempVoiceChannel(newState, emoji, gameName) {
  const member = newState.member;
  const guild = newState.guild;

  // Vérifier si le membre a déjà un salon
  const existing = tempVoice.getByOwner(member.id);
  if (existing) {
    const existingChannel = guild.channels.cache.get(existing.channel_id);
    if (existingChannel) {
      try {
        await member.voice.setChannel(existingChannel);
        return;
      } catch (error) {
        console.error('Erreur déplacement vers salon existant:', error.message);
      }
    } else {
      // Le salon n'existe plus, nettoyer la DB
      tempVoice.delete(existing.channel_id);
    }
  }

  // Créer un nouveau salon temporaire
  const createChannel = guild.channels.cache.get(newState.channelId);
  const category = createChannel.parent;

  // Nom du salon
  const channelName = gameName 
    ? `${emoji} ${gameName} - ${member.user.username}`
    : `${emoji} ${member.user.username}`;

  try {
    const voiceChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildVoice,
      parent: category,
      permissionOverwrites: [
        {
          id: member.id,
          allow: [
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.MoveMembers,
            PermissionFlagsBits.Connect,
          ],
        },
        {
          id: guild.id,
          allow: [PermissionFlagsBits.Connect],
        },
      ],
    });

    // Enregistrer en DB
    tempVoice.create(voiceChannel.id, member.id, guild.id);

    // Déplacer le membre
    await member.voice.setChannel(voiceChannel);
    
    console.log(`✅ Salon vocal temporaire créé: ${voiceChannel.name} par ${member.user.tag}`);
  } catch (error) {
    console.error('Erreur création salon vocal:', error.message);
  }
}

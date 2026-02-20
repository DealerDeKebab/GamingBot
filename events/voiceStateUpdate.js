const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { tempVoice } = require('../database/database');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, client) {
    const CREATE_CHANNEL_ID = process.env.VOICE_CREATE_CHANNEL_ID;
    if (!CREATE_CHANNEL_ID) return;

    // ══════════════════════════════════════════
    //  CRÉATION D'UN SALON TEMPORAIRE
    // ══════════════════════════════════════════
    if (newState.channelId === CREATE_CHANNEL_ID && !oldState.channelId) {
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
      const createChannel = guild.channels.cache.get(CREATE_CHANNEL_ID);
      const category = createChannel.parent;

      try {
        const voiceChannel = await guild.channels.create({
          name: `🎤 ${member.user.username}`,
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

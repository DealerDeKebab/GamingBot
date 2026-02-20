const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { tempVoice } = require('../../database/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('voice')
    .setDescription('🎤 Gérer ton salon vocal temporaire')
    .addSubcommand(s => s.setName('rename').setDescription('Renommer ton salon')
      .addStringOption(o => o.setName('nom').setDescription('Nouveau nom du salon').setRequired(true).setMaxLength(50)))
    .addSubcommand(s => s.setName('limit').setDescription('Limiter le nombre de personnes')
      .addIntegerOption(o => o.setName('nombre').setDescription('Nombre max (0 = illimité)').setRequired(true).setMinValue(0).setMaxValue(99)))
    .addSubcommand(s => s.setName('lock').setDescription('Verrouiller ton salon (personne ne peut rejoindre)'))
    .addSubcommand(s => s.setName('unlock').setDescription('Déverrouiller ton salon'))
    .addSubcommand(s => s.setName('kick').setDescription('Expulser quelqu\'un de ton salon')
      .addUserOption(o => o.setName('membre').setDescription('Le membre à expulser').setRequired(true)))
    .addSubcommand(s => s.setName('claim').setDescription('Récupérer la propriété d\'un salon abandonné'))
    .addSubcommand(s => s.setName('transfer').setDescription('Transférer la propriété du salon')
      .addUserOption(o => o.setName('membre').setDescription('Le nouveau propriétaire').setRequired(true))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const member = interaction.member;

    // Vérifier que le membre est dans un salon vocal
    if (!member.voice.channelId) {
      return interaction.reply({ content: '❌ Tu dois être dans un salon vocal !', ephemeral: true });
    }

    const voiceChannel = member.voice.channel;
    const tempChannel = tempVoice.get(voiceChannel.id);

    // Vérifier que c'est un salon temporaire
    if (!tempChannel && sub !== 'claim') {
      return interaction.reply({ content: '❌ Ce n\'est pas un salon vocal temporaire !', ephemeral: true });
    }

    // Vérifier que c'est le propriétaire (sauf pour claim)
    if (sub !== 'claim' && tempChannel.owner_id !== member.id) {
      return interaction.reply({ content: '❌ Seul le propriétaire du salon peut faire ça !', ephemeral: true });
    }

    if (sub === 'rename') {
      const newName = interaction.options.getString('nom');
      
      try {
        await voiceChannel.setName(`🎤 ${newName}`);
        return interaction.reply({ content: `✅ Salon renommé en **${newName}** !`, ephemeral: true });
      } catch (error) {
        return interaction.reply({ content: '❌ Erreur lors du renommage !', ephemeral: true });
      }
    }

    if (sub === 'limit') {
      const limit = interaction.options.getInteger('nombre');
      
      try {
        await voiceChannel.setUserLimit(limit);
        return interaction.reply({ content: `✅ Limite fixée à **${limit === 0 ? 'illimité' : limit + ' personnes'}** !`, ephemeral: true });
      } catch (error) {
        return interaction.reply({ content: '❌ Erreur lors du changement de limite !', ephemeral: true });
      }
    }

    if (sub === 'lock') {
      try {
        await voiceChannel.permissionOverwrites.edit(interaction.guild.id, {
          Connect: false,
        });
        return interaction.reply({ content: '🔒 Salon verrouillé ! Personne ne peut rejoindre.', ephemeral: true });
      } catch (error) {
        return interaction.reply({ content: '❌ Erreur lors du verrouillage !', ephemeral: true });
      }
    }

    if (sub === 'unlock') {
      try {
        await voiceChannel.permissionOverwrites.edit(interaction.guild.id, {
          Connect: true,
        });
        return interaction.reply({ content: '🔓 Salon déverrouillé !', ephemeral: true });
      } catch (error) {
        return interaction.reply({ content: '❌ Erreur lors du déverrouillage !', ephemeral: true });
      }
    }

    if (sub === 'kick') {
      const targetMember = interaction.options.getUser('membre');
      const memberToKick = voiceChannel.members.get(targetMember.id);

      if (!memberToKick) {
        return interaction.reply({ content: '❌ Ce membre n\'est pas dans ton salon !', ephemeral: true });
      }

      if (memberToKick.id === member.id) {
        return interaction.reply({ content: '❌ Tu ne peux pas t\'expulser toi-même !', ephemeral: true });
      }

      try {
        await memberToKick.voice.disconnect();
        return interaction.reply({ content: `✅ ${targetMember.tag} a été expulsé !`, ephemeral: true });
      } catch (error) {
        return interaction.reply({ content: '❌ Erreur lors de l\'expulsion !', ephemeral: true });
      }
    }

    if (sub === 'claim') {
      if (!tempChannel) {
        return interaction.reply({ content: '❌ Ce n\'est pas un salon vocal temporaire !', ephemeral: true });
      }

      // Vérifier que le propriétaire n'est plus dans le salon
      const owner = voiceChannel.members.get(tempChannel.owner_id);
      if (owner) {
        return interaction.reply({ content: '❌ Le propriétaire est toujours dans le salon !', ephemeral: true });
      }

      try {
        // Transférer la propriété
        tempVoice.delete(voiceChannel.id);
        tempVoice.create(voiceChannel.id, member.id, interaction.guild.id);

        await voiceChannel.permissionOverwrites.edit(member.id, {
          ManageChannels: true,
          MoveMembers: true,
        });

        return interaction.reply({ content: '✅ Tu es maintenant le propriétaire de ce salon !', ephemeral: true });
      } catch (error) {
        return interaction.reply({ content: '❌ Erreur lors du transfert !', ephemeral: true });
      }
    }

    if (sub === 'transfer') {
      const newOwner = interaction.options.getUser('membre');
      const newOwnerMember = voiceChannel.members.get(newOwner.id);

      if (!newOwnerMember) {
        return interaction.reply({ content: '❌ Ce membre n\'est pas dans ton salon !', ephemeral: true });
      }

      try {
        // Retirer les permissions de l'ancien propriétaire
        await voiceChannel.permissionOverwrites.edit(member.id, {
          ManageChannels: false,
          MoveMembers: false,
        });

        // Donner les permissions au nouveau propriétaire
        await voiceChannel.permissionOverwrites.edit(newOwner.id, {
          ManageChannels: true,
          MoveMembers: true,
        });

        // Mettre à jour la DB
        tempVoice.delete(voiceChannel.id);
        tempVoice.create(voiceChannel.id, newOwner.id, interaction.guild.id);

        return interaction.reply({ content: `✅ ${newOwner.tag} est maintenant le propriétaire du salon !`, ephemeral: true });
      } catch (error) {
        return interaction.reply({ content: '❌ Erreur lors du transfert !', ephemeral: true });
      }
    }
  },
};

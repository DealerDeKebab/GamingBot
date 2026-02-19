const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { betting, economy } = require('../../database/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pari')
    .setDescription('🎲 Système de paris')
    .addSubcommand(s => s.setName('creer').setDescription('Créer un pari (Admin)')
      .addStringOption(o => o.setName('titre').setDescription('Titre du pari').setRequired(true).setMaxLength(200))
      .addStringOption(o => o.setName('option1').setDescription('Option 1').setRequired(true).setMaxLength(50))
      .addStringOption(o => o.setName('option2').setDescription('Option 2').setRequired(true).setMaxLength(50))
      .addIntegerOption(o => o.setName('duree').setDescription('Durée en heures avant clôture').setRequired(true).setMinValue(1).setMaxValue(168))
      .addStringOption(o => o.setName('option3').setDescription('Option 3').setMaxLength(50))
      .addStringOption(o => o.setName('option4').setDescription('Option 4').setMaxLength(50))
      .addStringOption(o => o.setName('option5').setDescription('Option 5').setMaxLength(50)))
    .addSubcommand(s => s.setName('terminer').setDescription('Terminer un pari et déclarer le gagnant (Admin)')
      .addStringOption(o => o.setName('pari_id').setDescription('ID du message du pari').setRequired(true))
      .addStringOption(o => o.setName('gagnant').setDescription('Option gagnante').setRequired(true)))
    .addSubcommand(s => s.setName('annuler').setDescription('Annuler un pari (rembourse tout le monde) (Admin)')
      .addStringOption(o => o.setName('pari_id').setDescription('ID du message du pari').setRequired(true))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'creer') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: '❌ Seuls les admins peuvent créer des paris !', ephemeral: true });
      }

      const title = interaction.options.getString('titre');
      const duree = interaction.options.getInteger('duree');
      const endTime = Date.now() + (duree * 3600000);

      const options = [
        interaction.options.getString('option1'),
        interaction.options.getString('option2'),
        interaction.options.getString('option3'),
        interaction.options.getString('option4'),
        interaction.options.getString('option5'),
      ].filter(Boolean);

      if (options.length < 2) return interaction.reply({ content: '❌ Il faut au moins 2 options !', ephemeral: true });

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle(`🎲 ${title}`)
        .setDescription(`Mise des coins sur ton choix ! Le pari se termine <t:${Math.floor(endTime/1000)}:R>`)
        .addFields({ name: '💰 Pool total', value: '0 🪙', inline: true })
        .setFooter({ text: `Créé par ${interaction.user.tag}` })
        .setTimestamp();

      options.forEach((opt, i) => {
        embed.addFields({ name: `${i+1}️⃣ ${opt}`, value: '0 🪙 (0 joueurs) — Cote: ∞', inline: false });
      });

      const row = new ActionRowBuilder();
      options.forEach((opt, i) => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`bet_${i}`)
            .setLabel(opt)
            .setStyle(ButtonStyle.Primary)
            .setEmoji(['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣'][i])
        );
      });

      const msg = await interaction.reply({ content: '@everyone', embeds: [embed], components: [row], fetchReply: true });

      betting.create({
        messageId: msg.id,
        channelId: interaction.channel.id,
        guildId: interaction.guild.id,
        title,
        options,
        endTime,
        creatorId: interaction.user.id,
      });

      // Ajouter boutons admin après expiration
      setTimeout(async () => {
        const adminRow = new ActionRowBuilder();
        options.forEach((opt, i) => {
          adminRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`bet_win_${msg.id}_${i}`)
              .setLabel(`✅ ${opt} gagne`)
              .setStyle(ButtonStyle.Success)
          );
        });
        adminRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`bet_cancel_${msg.id}`)
            .setLabel('❌ Annuler')
            .setStyle(ButtonStyle.Danger)
        );

        try {
          const updatedMsg = await msg.fetch();
          await updatedMsg.edit({ components: [adminRow] });
          await msg.channel.send(`⏰ Le pari **"${title}"** est terminé ! <@&${process.env.ADMIN_ROLE_ID || ''}> Déclarez le gagnant ci-dessus.`);
        } catch (e) {}
      }, duree * 3600000);

      return;
    }

    if (sub === 'terminer') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: '❌ Seuls les admins peuvent terminer des paris !', ephemeral: true });
      }

      const msgId = interaction.options.getString('pari_id');
      const winner = interaction.options.getString('gagnant');
      const bet = betting.get(msgId);

      if (!bet) return interaction.reply({ content: '❌ Pari introuvable !', ephemeral: true });
      if (bet.status !== 'active') return interaction.reply({ content: '❌ Ce pari est déjà terminé !', ephemeral: true });

      const options = JSON.parse(bet.options);
      const betsData = JSON.parse(bet.bets_data);

      if (!options.includes(winner)) return interaction.reply({ content: '❌ Cette option n\'existe pas !', ephemeral: true });

      const winnerIndex = options.indexOf(winner);
      const winners = betsData[winnerIndex] || {};
      const totalPool = Object.values(betsData).reduce((sum, opt) => sum + Object.values(opt).reduce((s, amt) => s + amt, 0), 0);
      const winnerPool = Object.values(winners).reduce((s, amt) => s + amt, 0);

      if (winnerPool === 0) {
        betting.cancel(msgId);
        const channel = interaction.guild.channels.cache.get(bet.channel_id);
        const message = await channel.messages.fetch(msgId).catch(() => null);
        if (message) {
          const embed = EmbedBuilder.from(message.embeds[0])
            .setColor('#FF0000')
            .setTitle(`🎲 ${bet.title} — Annulé`)
            .setDescription('Aucun parieur sur l\'option gagnante ! Aucun gain distribué.');
          await message.edit({ embeds: [embed], components: [] });
        }
        return interaction.reply({ content: '⚠️ Aucun parieur sur cette option — pari annulé.', ephemeral: true });
      }

      let totalWinners = 0;
      for (const [uid, amount] of Object.entries(winners)) {
        const gain = Math.floor((amount / winnerPool) * totalPool);
        economy.addWallet(uid, interaction.guild.id, gain);
        totalWinners++;
      }

      betting.finish(msgId, winner);

      const channel = interaction.guild.channels.cache.get(bet.channel_id);
      const message = await channel.messages.fetch(msgId).catch(() => null);
      if (message) {
        const embed = EmbedBuilder.from(message.embeds[0])
          .setColor('#00FF7F')
          .setTitle(`🎲 ${bet.title} — Terminé !`)
          .setDescription(`✅ **Option gagnante : ${winner}**\n\n💰 Pool total : ${totalPool.toLocaleString()} 🪙\n🏆 ${totalWinners} gagnant(s)`);
        await message.edit({ embeds: [embed], components: [] });
      }

      return interaction.reply({ content: `✅ Pari terminé ! **${winner}** a gagné. ${totalWinners} gagnant(s) ont reçu leurs gains.` });
    }

    if (sub === 'annuler') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: '❌ Seuls les admins peuvent annuler des paris !', ephemeral: true });
      }

      const msgId = interaction.options.getString('pari_id');
      const bet = betting.get(msgId);

      if (!bet) return interaction.reply({ content: '❌ Pari introuvable !', ephemeral: true });
      if (bet.status !== 'active') return interaction.reply({ content: '❌ Ce pari est déjà terminé !', ephemeral: true });

      const betsData = JSON.parse(bet.bets_data);
      let refunded = 0;

      for (const opt of Object.values(betsData)) {
        for (const [uid, amount] of Object.entries(opt)) {
          economy.addWallet(uid, interaction.guild.id, amount);
          refunded++;
        }
      }

      betting.cancel(msgId);

      const channel = interaction.guild.channels.cache.get(bet.channel_id);
      const message = await channel.messages.fetch(msgId).catch(() => null);
      if (message) {
        const embed = EmbedBuilder.from(message.embeds[0])
          .setColor('#FF0000')
          .setTitle(`🎲 ${bet.title} — Annulé`)
          .setDescription('Ce pari a été annulé. Tous les parieurs ont été remboursés.');
        await message.edit({ embeds: [embed], components: [] });
      }

      return interaction.reply({ content: `✅ Pari annulé ! ${refunded} joueur(s) remboursé(s).` });
    }
  },
};

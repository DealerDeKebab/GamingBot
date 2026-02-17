const { EmbedBuilder, ButtonStyle, ActionRowBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { verify, giveaway } = require('../database/database');

async function handleButton(interaction, client) {
  const { customId } = interaction;

  // ══════════════════════════════════════════
  //  RÈGLEMENT
  // ══════════════════════════════════════════
  if (customId === 'accept_rules') {
    if (verify.isVerified(interaction.user.id, interaction.guild.id)) {
      return interaction.reply({ content: '✅ Tu as déjà accepté le règlement !', ephemeral: true });
    }
    verify.verify(interaction.user.id, interaction.guild.id);
    const role = interaction.guild.roles.cache.get(process.env.MEMBER_ROLE_ID);
    if (role) await interaction.member.roles.add(role).catch(() => {});
    await interaction.reply({ content: '✅ Règlement accepté ! Tu as maintenant accès au serveur. Bienvenue 🎮', ephemeral: true });
    const welCh = interaction.guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID);
    if (welCh) {
      welCh.send({ content: `<@${interaction.user.id}>`, embeds: [
        new EmbedBuilder().setColor('#00FF7F').setTitle('🎮 Nouveau membre !')
          .setDescription(
            `Bienvenue **${interaction.user.username}** ! Tu es maintenant membre ! 🚀\n\n` +
            `🎮 Choisis tes jeux avec \`/jeux choisir\`\n` +
            `📊 Gagne de l'XP en discutant — tape \`/rank\` pour voir ta progression !`
          )
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true })).setTimestamp()
      ]});
    }
    return;
  }

  if (customId === 'decline_rules') {
    return interaction.reply({ content: '❌ Tu dois accepter le règlement pour accéder au serveur.', ephemeral: true });
  }

  // ══════════════════════════════════════════
  //  GIVEAWAY
  // ══════════════════════════════════════════
  if (customId === 'giveaway_join') {
    const data = giveaway.getByMsg(interaction.message.id);
    if (!data)      return interaction.reply({ content: '❌ Giveaway introuvable.', ephemeral: true });
    if (data.ended) return interaction.reply({ content: '❌ Ce giveaway est terminé.', ephemeral: true });
    const parts = JSON.parse(data.participants);
    if (parts.includes(interaction.user.id)) {
      const newParts = parts.filter(p => p !== interaction.user.id);
      giveaway.updatePart(interaction.message.id, newParts);
      const embed = EmbedBuilder.from(interaction.message.embeds[0]).setFooter({ text: `${newParts.length} participant(s)` });
      await interaction.message.edit({ embeds: [embed] });
      return interaction.reply({ content: '✅ Tu t\'es retiré du giveaway.', ephemeral: true });
    } else {
      parts.push(interaction.user.id);
      giveaway.updatePart(interaction.message.id, parts);
      const embed = EmbedBuilder.from(interaction.message.embeds[0]).setFooter({ text: `${parts.length} participant(s)` });
      await interaction.message.edit({ embeds: [embed] });
      return interaction.reply({ content: '🎉 Tu participes au giveaway ! Bonne chance !', ephemeral: true });
    }
  }

  if (customId === 'giveaway_list') {
    const data = giveaway.getByMsg(interaction.message.id);
    if (!data) return interaction.reply({ content: '❌ Giveaway introuvable.', ephemeral: true });
    const parts = JSON.parse(data.participants);
    if (!parts.length) return interaction.reply({ content: '❌ Aucun participant.', ephemeral: true });
    const list  = parts.slice(0, 20).map(id => `<@${id}>`).join(', ');
    const extra = parts.length > 20 ? ` *... et ${parts.length - 20} autres.*` : '';
    return interaction.reply({ content: `👥 **${parts.length} participant(s) :** ${list}${extra}`, ephemeral: true });
  }

  // ══════════════════════════════════════════
  //  TICKETS — Création
  // ══════════════════════════════════════════
  const ticketTypes = {
    ticket_support: { label: 'Support',      emoji: '🆘', color: '#5865F2' },
    ticket_mod:     { label: 'Modération',   emoji: '⚔️', color: '#FF0000' },
    ticket_partner: { label: 'Partenariat',  emoji: '🤝', color: '#00FF7F' },
    ticket_bug:     { label: 'Bug',          emoji: '🐛', color: '#FFD700' },
  };

  if (ticketTypes[customId]) {
    const type   = ticketTypes[customId];
    const guild  = interaction.guild;
    const member = interaction.member;

    // Vérifie si l'utilisateur a déjà un ticket ouvert
    const existing = guild.channels.cache.find(
      c => c.name === `ticket-${member.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}` ||
           c.topic === `Ticket de ${member.user.id}`
    );
    if (existing) {
      return interaction.reply({
        content: `❌ Tu as déjà un ticket ouvert : ${existing}\nFerme-le avant d'en ouvrir un nouveau.`,
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    // Trouve ou crée la catégorie Tickets
    let category = guild.channels.cache.find(
      c => c.name === '🎟️ TICKETS' && c.type === ChannelType.GuildCategory
    );
    if (!category) {
      category = await guild.channels.create({
        name: '🎟️ TICKETS',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [{ id: guild.roles.everyone, deny: ['ViewChannel'] }],
      });
    }

    // Crée le salon du ticket
    const ticketChannel = await guild.channels.create({
      name: `ticket-${member.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20)}`,
      type: ChannelType.GuildText,
      topic: `Ticket de ${member.user.id}`,
      parent: category.id,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: ['ViewChannel'] },
        { id: member.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
        { id: guild.roles.cache.find(r => r.permissions.has('ManageMessages'))?.id || guild.roles.everyone,
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageMessages'] },
      ],
    });

    // Message d'accueil dans le ticket
    const embed = new EmbedBuilder()
      .setColor(type.color)
      .setTitle(`${type.emoji} Ticket — ${type.label}`)
      .setDescription(
        `Bonjour **${member.user.username}** ! 👋\n\n` +
        `Un membre de l'équipe va te répondre rapidement.\n` +
        `Décris ton problème/demande ci-dessous avec un maximum de détails.\n\n` +
        `*Pour fermer ce ticket : \`/ticket fermer\` ou bouton ci-dessous*`
      )
      .addFields({ name: '📋 Catégorie', value: `${type.emoji} ${type.label}`, inline: true },
                 { name: '👤 Ouvert par', value: member.user.tag, inline: true })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_close_btn').setLabel('🔒 Fermer le ticket').setStyle(ButtonStyle.Danger),
    );

    await ticketChannel.send({ content: `<@${member.id}>`, embeds: [embed], components: [row] });

    // Log dans le salon de logs
    const logCh = guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
    if (logCh) {
      logCh.send({ embeds: [
        new EmbedBuilder().setColor(type.color)
          .setTitle('🎟️ Nouveau ticket ouvert')
          .addFields(
            { name: 'Membre',    value: `${member.user.tag} (${member.id})`, inline: true },
            { name: 'Type',      value: `${type.emoji} ${type.label}`,       inline: true },
            { name: 'Salon',     value: `${ticketChannel}`,                  inline: true },
          ).setTimestamp()
      ]});
    }

    await interaction.editReply({ content: `✅ Ton ticket a été créé : ${ticketChannel}` });
    return;
  }

  // ── Fermeture via bouton dans le ticket ──────────────────
  if (customId === 'ticket_close_btn') {
    const channel = interaction.channel;
    if (!channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: '❌ Ce n\'est pas un salon ticket.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('🔒 Fermeture du ticket')
      .setDescription(`Fermé par **${interaction.user.tag}**\nSuppression dans **5 secondes**...`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Log fermeture
    const logCh = interaction.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
    if (logCh) {
      logCh.send({ embeds: [
        new EmbedBuilder().setColor('#FF0000').setTitle('🔒 Ticket fermé')
          .addFields(
            { name: 'Salon',    value: channel.name,              inline: true },
            { name: 'Fermé par',value: interaction.user.tag,      inline: true },
          ).setTimestamp()
      ]});
    }

    setTimeout(() => channel.delete('Ticket fermé').catch(() => {}), 5000);
    return;
  }

  if (customId === 'ticket_cancel_close') {
    return interaction.update({ content: '✅ Fermeture annulée.', embeds: [], components: [] });
  }

  // ══════════════════════════════════════════
  //  PIERRE FEUILLE CISEAUX
  // ══════════════════════════════════════════
  if (customId.startsWith('rps_')) {
    const choices = { rock: '🪨 Pierre', paper: '📄 Feuille', scissors: '✂️ Ciseaux' };
    const wins    = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
    const user    = customId.replace('rps_', '');
    const bot     = Object.keys(choices)[Math.floor(Math.random() * 3)];
    const result  = user === bot ? '🟡 Égalité !' : wins[user] === bot ? '✅ Tu as gagné !' : '❌ Tu as perdu !';
    const color   = result.startsWith('✅') ? '#00FF7F' : result.startsWith('❌') ? '#FF0000' : '#FFD700';
    return interaction.update({ embeds: [
      new EmbedBuilder().setColor(color).setTitle('✌️ Pierre Feuille Ciseaux')
        .addFields(
          { name: '👤 Toi',      value: choices[user], inline: true },
          { name: '🤖 Bot',      value: choices[bot],  inline: true },
          { name: '🏆 Résultat', value: result }
        )
    ], components: [] });
  }

  // ══════════════════════════════════════════
  //  TRIVIA
  // ══════════════════════════════════════════
  if (customId.startsWith('trivia_') && !customId.startsWith('expired_')) {
    const [, chosen, correct] = customId.split('_').map(Number);
    const isRight = chosen === correct;
    const row = ActionRowBuilder.from(interaction.message.components[0]);
    row.components.forEach((btn, i) => {
      btn.setDisabled(true);
      if (i === correct) btn.setStyle(ButtonStyle.Success);
      else if (i === chosen && !isRight) btn.setStyle(ButtonStyle.Danger);
      else btn.setStyle(ButtonStyle.Secondary);
    });
    await interaction.update({ components: [row] });
    return interaction.followUp({
      content: isRight ? '✅ **Bonne réponse !** 🎉' : `❌ **Mauvaise réponse !** La bonne était l'option ${correct + 1}.`,
      ephemeral: true,
    });
  }
}

module.exports = { handleButton };

// Note: blackjack buttons handled via separate import in interactionCreate

// ══════════════════════════════════════════
//  BLACKJACK
// ══════════════════════════════════════════
// Note: imported in interactionCreate.js

// Blackjack déjà géré ci-dessous via bj_hit/bj_stand

async function handleBlackjack(interaction, client) {
  const { economy } = require('../database/database');
  const bj = require('../commands/economy/blackjack');
  const games = bj.games;
  const game  = games.get(interaction.user.id);
  if (!game) return interaction.update({ content: '❌ Partie expirée !', embeds: [], components: [] });

  const { player, dealer, mise } = game;

  if (interaction.customId === 'bj_hit') {
    player.push(bj.card());
    const pv = bj.handValue(player);

    if (pv > 21) {
      games.delete(interaction.user.id);
      return interaction.update({ embeds: [new EmbedBuilder().setColor('#FF0000').setTitle('🃏 Blackjack — Bust !')
        .addFields(
          { name: '🫵 Ta main',  value: `${bj.handStr(player)} = **${pv}**` },
          { name: '💸 Perdu',    value: `-${mise.toLocaleString()} 🪙` }
        )], components: [] });
    }

    if (pv === 21) {
      // Auto-stand à 21
      return resolveGame(interaction, game, bj, economy);
    }

    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('bj_hit').setLabel('🃏 Tirer').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('bj_stand').setLabel('✋ Rester').setStyle(ButtonStyle.Secondary),
    );

    return interaction.update({ embeds: [new EmbedBuilder().setColor('#5865F2').setTitle('🃏 Blackjack')
      .addFields(
        { name: '🫵 Ta main',   value: `${bj.handStr(player)} = **${pv}**` },
        { name: '🤖 Croupier', value: `${dealer[0].value}${dealer[0].suit} + 🂠` },
        { name: '💰 Mise',     value: `${mise.toLocaleString()} 🪙` }
      )], components: [row] });
  }

  if (interaction.customId === 'bj_stand') {
    return resolveGame(interaction, game, bj, economy);
  }
}

async function resolveGame(interaction, game, bj, economy) {
  const { player, dealer, mise } = game;
  const { EmbedBuilder } = require('discord.js');

  // Le croupier tire jusqu'à 17
  while (bj.handValue(dealer) < 17) dealer.push(bj.card());

  const pv = bj.handValue(player);
  const dv = bj.handValue(dealer);
  game.games?.delete(interaction.user.id);
  bj.games.delete(interaction.user.id);

  let result, gain, color;
  if (dv > 21 || pv > dv) {
    gain = mise; color = '#00FF7F';
    result = `🎉 **Tu gagnes +${gain.toLocaleString()} 🪙 !**`;
    economy.addWallet(interaction.user.id, interaction.guild.id, mise * 2);
  } else if (pv === dv) {
    gain = 0; color = '#FFD700';
    result = `😐 **Égalité — remboursé !**`;
    economy.addWallet(interaction.user.id, interaction.guild.id, mise);
  } else {
    gain = -mise; color = '#FF0000';
    result = `💸 **Tu perds ${mise.toLocaleString()} 🪙 !**`;
  }

  return interaction.update({ embeds: [new EmbedBuilder().setColor(color).setTitle('🃏 Blackjack — Résultat')
    .addFields(
      { name: '🫵 Ta main',   value: `${bj.handStr(player)} = **${pv}**` },
      { name: '🤖 Croupier', value: `${bj.handStr(dealer)} = **${dv}**` },
      { name: '🏆 Résultat', value: result }
    )], components: [] });
}

module.exports.handleBlackjack = handleBlackjack;

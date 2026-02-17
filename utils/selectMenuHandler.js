async function handleSelectMenu(interaction, client) {
  const { customId, values } = interaction;

  // Chargement dynamique pour éviter les dépendances circulaires
  let GAMES;
  try { GAMES = require('../commands/roles/jeux').GAMES; } catch { return; }

  // ══════════════════════════════════════════
  //  SÉLECTION DES JEUX
  // ══════════════════════════════════════════
  if (customId === 'game_select') {
    const member = interaction.member;
    const added = [], removed = [];

    for (const [gameName, gameData] of Object.entries(GAMES)) {
      const roleId = process.env[gameData.envKey];
      if (!roleId) continue;
      const role = interaction.guild.roles.cache.get(roleId);
      if (!role) continue;

      if (values.includes(gameName)) {
        if (!member.roles.cache.has(roleId)) {
          await member.roles.add(role).catch(() => {});
          added.push(`${gameData.emoji} ${gameName}`);
        }
      } else {
        if (member.roles.cache.has(roleId)) {
          await member.roles.remove(role).catch(() => {});
          removed.push(`${gameData.emoji} ${gameName}`);
          // Retire aussi les rôles de rang
          for (const envK of (gameData.rankEnv || [])) {
            const rId = process.env[envK];
            if (rId && member.roles.cache.has(rId)) await member.roles.remove(rId).catch(() => {});
          }
        }
      }
    }

    let msg = '✅ **Rôles de jeux mis à jour !**';
    if (added.length)   msg += `\n➕ Ajoutés : ${added.join(', ')}`;
    if (removed.length) msg += `\n➖ Retirés : ${removed.join(', ')}`;
    if (!added.length && !removed.length) msg = '✅ Aucun changement.';

    return interaction.reply({ content: msg, ephemeral: true });
  }

  // ══════════════════════════════════════════
  //  SÉLECTION DE RANG
  // ══════════════════════════════════════════
  if (customId.startsWith('rank_select_')) {
    const gameName = customId.replace('rank_select_', '').replace(/_/g, ' ');
    const game     = GAMES[gameName];
    if (!game) return interaction.reply({ content: '❌ Jeu introuvable.', ephemeral: true });

    const selectedRank = values[0];
    const rankIndex    = game.ranks.indexOf(selectedRank);

    // Retire tous les anciens rôles de rang pour ce jeu
    for (const envK of (game.rankEnv || [])) {
      const rId = process.env[envK];
      if (rId && interaction.member.roles.cache.has(rId)) {
        await interaction.member.roles.remove(rId).catch(() => {});
      }
    }

    // Ajoute le nouveau rang
    if (rankIndex >= 0 && game.rankEnv[rankIndex]) {
      const newRoleId = process.env[game.rankEnv[rankIndex]];
      if (newRoleId) {
        const role = interaction.guild.roles.cache.get(newRoleId);
        if (role) await interaction.member.roles.add(role).catch(() => {});
      }
    }

    return interaction.reply({
      content: `✅ Rang **${selectedRank}** en **${gameName}** enregistré ! ${game.emoji}`,
      ephemeral: true,
    });
  }
}

module.exports = { handleSelectMenu };

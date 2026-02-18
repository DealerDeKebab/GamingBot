const { handleButton, handleBlackjack, handleBetting, handleAcceptRules } = require('../utils/buttonHandler');
const { handleSelectMenu } = require('../utils/selectMenuHandler');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {

    // ── Slash commands ──────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return;
      try {
        await cmd.execute(interaction, client);
      } catch (err) {
        console.error(`Erreur /${interaction.commandName}:`, err);
        const msg = { content: '❌ Une erreur est survenue.', ephemeral: true };
        interaction.replied || interaction.deferred
          ? interaction.followUp(msg)
          : interaction.reply(msg);
      }
    }

    // ── Boutons ─────────────────────────────────────────────
    if (interaction.isButton()) {
      try {
        if (interaction.customId === 'accept_rules') {
          await handleAcceptRules(interaction, client);
        } else if (interaction.customId.startsWith('bet_')) {
          await handleBetting(interaction, client);
        } else if (['bj_hit','bj_stand'].includes(interaction.customId)) {
          await handleBlackjack(interaction, client);
        } else {
          await handleButton(interaction, client);
        }
      }
      catch (e) { console.error('Erreur bouton:', e.message); }
    }

    // ── Select menus ────────────────────────────────────────
    if (interaction.isStringSelectMenu()) {
      try { await handleSelectMenu(interaction, client); }
      catch (e) { console.error('Erreur select menu:', e.message); }
    }
  },
};

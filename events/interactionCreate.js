const { handleButton, handleBlackjack, handleBetting, handleAcceptRules, handleBettingAdmin } = require('../utils/buttonHandler');
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
        if (interaction.customId.startsWith('jackpot_join_')) {
          await handleJackpotJoin(interaction, client);
        } else if (interaction.customId.startsWith('hangman_')) {
          const penduCmd = client.commands.get('pendu');
          if (penduCmd) await penduCmd.handleButton(interaction);
        } else if (interaction.customId.startsWith('bet_win_') || interaction.customId.startsWith('bet_cancel_')) {
          await handleBettingAdmin(interaction, client);
        } else if (interaction.customId === 'accept_rules') {
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

// ── Jackpot Join Handler ─────────────────────────────────────
async function handleJackpotJoin(interaction, client) {
  const { jackpot, economy } = require('../database/database');
  
  const eventId = interaction.customId.split('_')[2];
  const event = jackpot.get(eventId);

  if (!event || event.status !== 'active') {
    return interaction.reply({ content: '❌ Ce jackpot n\'est plus actif !', ephemeral: true });
  }

  // Vérifier si déjà inscrit
  const participants = jackpot.getParticipants(eventId);
  if (participants.includes(interaction.user.id)) {
    return interaction.reply({ content: '❌ Tu participes déjà à ce jackpot !', ephemeral: true });
  }

  // Vérifier si assez de coins
  const userEconomy = economy.get(interaction.user.id, interaction.guildId);
  if (!userEconomy || userEconomy.wallet < event.entry_cost) {
    return interaction.reply({ content: `❌ Tu n'as pas assez de coins ! (${event.entry_cost.toLocaleString()} requis)`, ephemeral: true });
  }

  // Retirer les coins
  economy.addWallet(interaction.user.id, interaction.guildId, -event.entry_cost);

  // Ajouter au jackpot
  jackpot.addParticipant(eventId, interaction.user.id);

  return interaction.reply({ 
    content: `✅ Tu participes maintenant au jackpot ! (-${event.entry_cost.toLocaleString()} coins)\n🎰 Le pot est maintenant de **${(event.current_pot + event.entry_cost).toLocaleString()} coins** !`, 
    ephemeral: true 
  });
}


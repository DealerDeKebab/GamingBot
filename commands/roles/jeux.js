const {
  SlashCommandBuilder, EmbedBuilder,
  ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
} = require('discord.js');

const GAMES = {
  'Rocket League':     { emoji: '🚗', envKey: 'ROLE_RL',       ranks: ['Bronze','Silver','Gold','Platinum','Diamond','Champion','Grand Champion','Supersonic Legend'], rankEnv: ['ROLE_RL_BRONZE','ROLE_RL_SILVER','ROLE_RL_GOLD','ROLE_RL_PLAT','ROLE_RL_DIAMOND','ROLE_RL_CHAMP','ROLE_RL_GC','ROLE_RL_SSL'] },
  'CS2':               { emoji: '🔫', envKey: 'ROLE_CS2',      ranks: ['Silver','Gold Nova','Master Guardian','Legendary Eagle','Supreme','Global Elite'],              rankEnv: ['ROLE_CS2_SILVER','ROLE_CS2_GOLD','ROLE_CS2_MG','ROLE_CS2_LE','ROLE_CS2_SUPREME','ROLE_CS2_GE'] },
  'Valorant':          { emoji: '🎯', envKey: 'ROLE_VALORANT', ranks: ['Iron','Bronze','Silver','Gold','Platinum','Diamond','Ascendant','Immortal','Radiant'],           rankEnv: ['ROLE_VAL_IRON','ROLE_VAL_BRONZE','ROLE_VAL_SILVER','ROLE_VAL_GOLD','ROLE_VAL_PLAT','ROLE_VAL_DIAMOND','ROLE_VAL_ASC','ROLE_VAL_IMMORTAL','ROLE_VAL_RADIANT'] },
  'League of Legends': { emoji: '⚔️', envKey: 'ROLE_LOL',      ranks: ['Iron','Bronze','Silver','Gold','Platinum','Emerald','Diamond','Master','Grandmaster','Challenger'], rankEnv: [] },
  'Fortnite':          { emoji: '🏗️', envKey: 'ROLE_FORTNITE', ranks: ['Bronze','Silver','Gold','Platinum','Diamond','Elite','Champion','Unreal'],                       rankEnv: [] },
  'Minecraft':         { emoji: '⛏️', envKey: 'ROLE_MINECRAFT', ranks: [], rankEnv: [] },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('jeux')
    .setDescription('🎮 Gestion des rôles de jeux')
    .addSubcommand(s => s.setName('choisir').setDescription('Sélectionne tes jeux'))
    .addSubcommand(s => s.setName('rang').setDescription('Définis ton rang dans un jeu')
      .addStringOption(o => {
        o.setName('jeu').setDescription('Jeu').setRequired(true);
        Object.keys(GAMES).forEach(g => o.addChoices({ name: g, value: g }));
        return o;
      })),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'choisir') {
      const menu = new StringSelectMenuBuilder()
        .setCustomId('game_select')
        .setPlaceholder('Sélectionne tes jeux...')
        .setMinValues(0)
        .setMaxValues(Object.keys(GAMES).length)
        .addOptions(Object.entries(GAMES).map(([name, d]) =>
          new StringSelectMenuOptionBuilder().setLabel(name).setValue(name).setEmoji(d.emoji)
        ));

      await interaction.reply({
        embeds: [new EmbedBuilder().setColor('#5865F2').setTitle('🎮 Choisis tes jeux')
          .setDescription('Sélectionne les jeux auxquels tu joues pour obtenir les rôles. Tu peux en choisir plusieurs !')],
        components: [new ActionRowBuilder().addComponents(menu)],
        ephemeral: true,
      });

    } else if (sub === 'rang') {
      const gameName = interaction.options.getString('jeu');
      const game     = GAMES[gameName];
      if (!game.ranks.length) return interaction.reply({ content: `❌ **${gameName}** n'a pas de système de rangs.`, ephemeral: true });

      const menu = new StringSelectMenuBuilder()
        .setCustomId(`rank_select_${gameName.replace(/ /g, '_')}`)
        .setPlaceholder('Choisis ton rang...')
        .addOptions(game.ranks.map(r => new StringSelectMenuOptionBuilder().setLabel(r).setValue(r)));

      await interaction.reply({
        embeds: [new EmbedBuilder().setColor('#5865F2').setTitle(`${game.emoji} Rang — ${gameName}`).setDescription('Sélectionne ton rang actuel :')],
        components: [new ActionRowBuilder().addComponents(menu)],
        ephemeral: true,
      });
    }
  },

  GAMES, // exporté pour le selectMenuHandler
};

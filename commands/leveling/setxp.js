const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { xp } = require('../../database/database');
module.exports = {
  data: new SlashCommandBuilder().setName('setxp').setDescription('🛠️ Définir XP/niveau d\'un membre (Admin)')
    .addUserOption(o => o.setName('membre').setDescription('Membre').setRequired(true))
    .addIntegerOption(o => o.setName('xp').setDescription('XP').setRequired(true).setMinValue(0))
    .addIntegerOption(o => o.setName('niveau').setDescription('Niveau').setMinValue(0))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const target = interaction.options.getUser('membre');
    const newXP  = interaction.options.getInteger('xp');
    const newLvl = interaction.options.getInteger('niveau') || 0;
    xp.create(target.id, interaction.guild.id);
    xp.setLevel(target.id, interaction.guild.id, newLvl, newXP);
    await interaction.reply({ content: `✅ **${target.username}** → Niveau **${newLvl}**, XP: **${newXP}**`, ephemeral: true });
  },
};

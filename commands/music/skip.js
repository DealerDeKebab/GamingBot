const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder().setName('skip').setDescription('⏭️ Passer la musique'),
  async execute(interaction, client) {
    const q = client.musicQueues.get(interaction.guild.id);
    if (!q?.current) return interaction.reply({ content: '❌ Rien en lecture.', ephemeral: true });
    q.player.stop();
    await interaction.reply('⏭️ Piste passée !');
  },
};

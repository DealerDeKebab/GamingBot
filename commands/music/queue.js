const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder().setName('queue').setDescription('📋 File d\'attente musicale'),
  async execute(interaction, client) {
    const q = client.musicQueues.get(interaction.guild.id);
    if (!q?.queue.length) return interaction.reply({ content: '❌ La file est vide.', ephemeral: true });
    await interaction.reply({ embeds: [
      new EmbedBuilder().setColor('#1DB954').setTitle('📋 File d\'attente')
        .setDescription(q.queue.map((t, i) =>
          `${i === 0 ? '▶️' : `**${i+1}.**`} [${t.title}](${t.url}) — ${t.duration} — *${t.requester}*`
        ).join('\n').substring(0, 4096))
        .setFooter({ text: `${q.queue.length} titre(s)` })
    ]});
  },
};

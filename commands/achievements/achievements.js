const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { achievements, xp, economy } = require('../../database/database');
const { ACHIEVEMENTS, CATEGORIES } = require('../../utils/achievementsConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('achievements')
    .setDescription('🏅 Voir tes succès')
    .addSubcommand(s => s.setName('me').setDescription('Voir tes succès'))
    .addSubcommand(s => s.setName('user').setDescription('Voir les succès d\'un membre')
      .addUserOption(o => o.setName('membre').setDescription('Le membre').setRequired(true)))
    .addSubcommand(s => s.setName('list').setDescription('Voir tous les succès disponibles')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'list') {
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🏅 Tous les Succès Disponibles')
        .setDescription('Débloquez des succès pour gagner des récompenses !')
        .setTimestamp();

      for (const [catKey, catData] of Object.entries(CATEGORIES)) {
        const categoryAchievements = Object.values(ACHIEVEMENTS).filter(a => a.category === catKey);
        if (categoryAchievements.length === 0) continue;

        const list = categoryAchievements.map(a => 
          `${a.name}\n└ ${a.description} • **+${a.reward} 🪙**`
        ).join('\n\n');

        embed.addFields({ 
          name: `${catData.emoji} ${catData.name}`, 
          value: list, 
          inline: false 
        });
      }

      return interaction.reply({ embeds: [embed] });
    }

    const targetUser = sub === 'user' 
      ? interaction.options.getUser('membre') 
      : interaction.user;

    const member = await interaction.guild.members.fetch(targetUser.id);

    // Récupérer les stats du membre
    const userData = xp.getUser(targetUser.id, interaction.guild.id) || { level: 0, messages: 0 };
    const economyData = economy.get(targetUser.id, interaction.guild.id) || { wallet: 0, bank: 0 };

    const stats = {
      level: userData.level,
      messages: userData.messages,
      wallet: economyData.wallet + economyData.bank,
    };

    // Vérifier et débloquer les achievements automatiques
    const unlockedAchievements = achievements.getUser(targetUser.id, interaction.guild.id);
    const unlockedIds = unlockedAchievements.map(a => a.achievement_id);

    let newUnlocks = 0;
    for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
      if (achievement.manual) continue; // Skip les achievements manuels
      if (unlockedIds.includes(achievement.id)) continue; // Déjà débloqué

      if (achievement.check && achievement.check(targetUser, stats)) {
        const unlocked = achievements.unlock(targetUser.id, interaction.guild.id, achievement.id);
        if (unlocked) {
          newUnlocks++;
          economy.addWallet(targetUser.id, interaction.guild.id, achievement.reward);
          unlockedIds.push(achievement.id);
        }
      }
    }

    // Calculer la progression
    const totalAchievements = Object.keys(ACHIEVEMENTS).length;
    const unlockedCount = unlockedIds.length;
    const percentage = Math.floor((unlockedCount / totalAchievements) * 100);

    // Créer l'embed
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle(`🏅 Succès de ${targetUser.username}`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setDescription(
        `📊 Progression : **${unlockedCount}/${totalAchievements}** (${percentage}%)\n` +
        `${'█'.repeat(Math.floor(percentage / 5))}${'░'.repeat(20 - Math.floor(percentage / 5))}`
      )
      .setTimestamp();

    // Grouper par catégorie
    for (const [catKey, catData] of Object.entries(CATEGORIES)) {
      const categoryAchievements = Object.values(ACHIEVEMENTS).filter(a => a.category === catKey);
      if (categoryAchievements.length === 0) continue;

      const unlocked = categoryAchievements.filter(a => unlockedIds.includes(a.id));
      const locked = categoryAchievements.filter(a => !unlockedIds.includes(a.id));

      let text = '';
      
      // Débloqués
      if (unlocked.length > 0) {
        text += unlocked.map(a => `✅ ${a.name}`).join('\n') + '\n';
      }
      
      // Verrouillés (max 3)
      if (locked.length > 0) {
        const preview = locked.slice(0, 3);
        text += preview.map(a => `🔒 ${a.name}`).join('\n');
        if (locked.length > 3) {
          text += `\n*+${locked.length - 3} autre(s)...*`;
        }
      }

      if (text) {
        embed.addFields({ 
          name: `${catData.emoji} ${catData.name} (${unlocked.length}/${categoryAchievements.length})`, 
          value: text || 'Aucun succès', 
          inline: true 
        });
      }
    }

    if (newUnlocks > 0 && targetUser.id === interaction.user.id) {
      embed.setFooter({ text: `🎉 ${newUnlocks} nouveau(x) succès débloqué(s) ! Consultez la liste ci-dessous.` });
    }

    return interaction.reply({ embeds: [embed], ephemeral: targetUser.id === interaction.user.id });
  },
};

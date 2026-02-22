const { shop } = require('../database/database');
const cron = require('node-cron');

async function checkExpiredRoles(client) {
  const expiredRoles = shop.getExpiredRoles();

  for (const roleData of expiredRoles) {
    try {
      const guild = client.guilds.cache.get(roleData.guild_id);
      if (!guild) continue;

      const member = await guild.members.fetch(roleData.user_id).catch(() => null);
      if (!member) {
        shop.removeExpiredRole(roleData.id);
        continue;
      }

      const role = guild.roles.cache.get(roleData.role_id);
      if (role && member.roles.cache.has(role.id)) {
        await member.roles.remove(role);
        console.log(`🎭 Rôle ${role.name} retiré de ${member.user.username} (expiré)`);
      }

      shop.removeExpiredRole(roleData.id);
    } catch (error) {
      console.error('Erreur retrait rôle temporaire:', error);
    }
  }
}

function startShopRoleChecker(client) {
  // Vérifier toutes les heures
  cron.schedule('0 * * * *', () => checkExpiredRoles(client));

  // Premier check 2 minutes après le démarrage
  setTimeout(() => checkExpiredRoles(client), 120000);

  console.log('🛒 Auto-check rôles temporaires shop activé (toutes les heures)');
}

module.exports = { startShopRoleChecker, checkExpiredRoles };

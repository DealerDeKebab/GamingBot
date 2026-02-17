require('dotenv').config();
const { REST, Routes } = require('discord.js');
const { readdirSync }  = require('fs');
const path             = require('path');

const commands = [];
const base     = path.join(__dirname, 'commands');

for (const folder of readdirSync(base)) {
  for (const file of readdirSync(path.join(base, folder)).filter(f => f.endsWith('.js'))) {
    try {
      const cmd = require(path.join(base, folder, file));
      if (cmd.data) commands.push(cmd.data.toJSON());
    } catch (e) { console.error(`Erreur chargement ${file}:`, e.message); }
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`📡 Déploiement de ${commands.length} commandes slash...`);
    // Guild commands (instantané)
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log(`✅ ${commands.length} commandes déployées sur le serveur !`);
    console.log('💡 Pour déployer globalement (1h de délai), change en applicationCommands()');
  } catch (e) { console.error('Erreur déploiement:', e); }
})();

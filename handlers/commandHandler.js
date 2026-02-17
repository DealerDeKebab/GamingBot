const { readdirSync } = require('fs');
const path = require('path');

async function loadCommands(client) {
  const base = path.join(__dirname, '..', 'commands');
  let count = 0;
  for (const folder of readdirSync(base)) {
    for (const file of readdirSync(path.join(base, folder)).filter(f => f.endsWith('.js'))) {
      try {
        const cmd = require(path.join(base, folder, file));
        if (cmd.data && cmd.execute) { client.commands.set(cmd.data.name, cmd); count++; }
      } catch (e) { console.error(`❌ Commande ${file}:`, e.message); }
    }
  }
  console.log(`📦 ${count} commandes chargées`);
}
module.exports = { loadCommands };

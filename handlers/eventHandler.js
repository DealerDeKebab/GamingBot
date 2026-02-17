const { readdirSync } = require('fs');
const path = require('path');

async function loadEvents(client) {
  const base = path.join(__dirname, '..', 'events');
  let count = 0;
  for (const file of readdirSync(base).filter(f => f.endsWith('.js'))) {
    try {
      const event = require(path.join(base, file));
      event.once
        ? client.once(event.name, (...args) => event.execute(...args, client))
        : client.on(event.name,   (...args) => event.execute(...args, client));
      count++;
    } catch (e) { console.error(`❌ Event ${file}:`, e.message); }
  }
  console.log(`⚡ ${count} événements chargés`);
}
module.exports = { loadEvents };

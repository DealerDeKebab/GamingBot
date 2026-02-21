# Installation Lavalink - Modifications à faire

## Fichiers modifiés dans ce commit :
- `commands/music/` → Toutes les commandes musique refaites
- `utils/MusicManager.js` → Nouveau gestionnaire de musique

## À faire manuellement après le git pull :

### 1. Installer Shoukaku
```bash
cd ~/GamingBot
npm install shoukaku --ignore-scripts --legacy-peer-deps
```

### 2. Modifier index.js
Ajoute après `const client = new Client({...});` :
```javascript
// Music Manager avec Lavalink
const MusicManager = require('./utils/MusicManager');
client.musicManager = new MusicManager(client);
```

### 3. Ajouter dans .env
```
LAVALINK_HOST=localhost
LAVALINK_PORT=2333
LAVALINK_PASSWORD=ton_mot_de_passe_lavalink
```

### 4. Lancer Lavalink (déjà fait normalement)
```bash
cd ~/lavalink && pm2 start 'java -jar Lavalink.jar' --name lavalink
pm2 save
```

### 5. Redémarrer
```bash
cd ~/GamingBot
node deploy-commands.js
pm2 restart GamingBot
```

## Test
`/play never gonna give you up`

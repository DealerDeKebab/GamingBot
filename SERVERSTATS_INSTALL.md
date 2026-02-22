# Installation Stats Serveur Auto-Update

## Étapes à suivre :

### 1. Créer un salon dédié
Crée un salon texte pour les stats (exemple: `#📊-stats-serveur`)

### 2. Copier l'ID du salon
Clic droit sur le salon → Copier l'identifiant du salon

### 3. Ajouter dans .env
```
SERVERSTATS_CHANNEL_ID=id_du_salon
```

### 4. Modifier index.js
Ajoute après les autres auto-updaters (ligne ~35) :

```javascript
const { startServerStatsUpdater } = require('./utils/serverStatsUpdater');
```

Et plus bas dans le `client.once('ready', ...)` :

```javascript
startServerStatsUpdater(client);
```

### 5. Redémarrer
```bash
cd ~/GamingBot
node deploy-commands.js
pm2 restart GamingBot
```

## Comment ça marche ?

- Message permanent dans le salon choisi
- Mise à jour **toutes les heures**
- Affiche : membres, activité, top membres, économie, gaming, achievements
- Design moderne et compact

## Test manuel

Pour forcer une mise à jour immédiatement :
```javascript
const { updateServerStats } = require('./utils/serverStatsUpdater');
updateServerStats(client);
```


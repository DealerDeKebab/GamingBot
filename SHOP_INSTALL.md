# 🛒 Installation du Système de Shop

## Modification à faire dans index.js

### Ligne ~7 (avec les autres require)
Ajoute :
```javascript
const { startShopRoleChecker } = require('./utils/shopRoleChecker');
```

### Dans la fonction main() (après startBirthdayChecker)
Ajoute :
```javascript
startShopRoleChecker(client);
```

## Exemple de modification :
```javascript
async function main() {
  console.log('🚀 Démarrage du bot Gaming v2...');
  initDatabase();
  await loadCommands(client);
  await loadEvents(client);
  await client.login(process.env.DISCORD_TOKEN);
  
  // Démarrer les systèmes automatiques
  startBirthdayChecker(client);
  startShopRoleChecker(client);  // ← AJOUTER CETTE LIGNE
}
```

## Utilisation

### Commandes Admin :
- `/shopadmin add-role` → Ajouter un rôle temporaire
- `/shopadmin add-boost` → Ajouter un boost XP/Coins
- `/shopadmin add-item` → Ajouter un item de collection
- `/shopadmin remove id:X` → Retirer un item
- `/shopadmin list` → Lister tous les items

### Commandes Membres :
- `/shop voir` → Voir toutes les catégories
- `/shop voir categorie:roles` → Voir une catégorie
- `/shop acheter id:X` → Acheter un item
- `/inventaire` → Voir inventaire et boosts actifs

## Fonctionnalités

- 🎭 Rôles temporaires (24h/7j/30j)
- ⚡ Boosts XP/Coins (multiplicateurs actifs)
- 📦 Items de collection
- 🏅 Badges (à venir)
- 🎨 Cosmétiques (à venir)

## C'est tout !
Le système est 100% fonctionnel après cette modification !

# 🎁 Configuration des Récompenses de Niveau

## 1️⃣ Créer les Rôles sur Discord

Crée ces 5 rôles sur ton serveur Discord :

- `@🎮 Gamer` (couleur verte)
- `@⚔️ Guerrier` (couleur bleue)
- `@💎 Diamant` (couleur cyan/diamant)
- `@👑 Légende` (couleur or/jaune)
- `@🌟 Mythique` (couleur violet/rose)

**Important :** Place ces rôles **en dessous** du rôle du bot dans la hiérarchie !

## 2️⃣ Copier les IDs des Rôles

Clic droit sur chaque rôle → Copier l'identifiant

## 3️⃣ Ajouter dans .env

```env
# Récompenses de niveau
LEVEL_ROLE_5=id_du_role_gamer
LEVEL_ROLE_10=id_du_role_guerrier
LEVEL_ROLE_20=id_du_role_diamant
LEVEL_ROLE_30=id_du_role_legende
LEVEL_ROLE_50=id_du_role_mythique
```

## 📋 Paliers de Récompenses

| Niveau | Rôle | Coins Bonus |
|--------|------|-------------|
| **5** | 🎮 Gamer | - |
| **10** | ⚔️ Guerrier | 1 000 |
| **20** | 💎 Diamant | 2 500 |
| **30** | 👑 Légende | 5 000 |
| **50** | 🌟 Mythique | 10 000 |

## 🎨 Notification Automatique

Quand quelqu'un atteint un palier, il reçoit automatiquement :
- Le rôle correspondant
- Les coins bonus
- Une notification stylée dans le salon de level-up

Exemple :
```
🎉 GG @Membre ! Tu passes au niveau 10 ! 🚀

🎁 Récompenses Débloquées !
⚔️ Rôle Guerrier débloqué !
💰 1000 coins bonus !
```

## ⚙️ C'est Tout !

Le système est 100% automatique. Dès qu'un membre atteint un niveau, 
il reçoit ses récompenses instantanément !

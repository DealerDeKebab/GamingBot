# 🎮 Kebab Bot — Bot Discord Gaming Communautaire

Un bot Discord complet et moderne pour serveurs gaming, développé avec Discord.js v14.

---

## ✨ Fonctionnalités

### 🛡️ Modération
| Commande | Description |
|----------|-------------|
| `/ban` | Bannir un membre |
| `/kick` | Expulser un membre |
| `/mute` | Mettre en sourdine (durée configurable) |
| `/unmute` | Retirer la sourdine |
| `/unban` | Débannir un membre |
| `/warn` | Gérer les avertissements |
| `/purge` | Supprimer des messages en masse |
| `/slowmode` | Configurer le mode lent |
| `/lockdown` | Verrouiller/déverrouiller un salon |

### 🔒 Sécurité Automatique
- **Anti-raid** — Détection automatique, 3 modes : alerte/kick/ban
- **Anti-spam** — Mute automatique après 5 messages en 5 secondes
- **Captcha DM** — Vérification automatique des nouveaux membres

### 📊 XP & Niveaux
| Commande | Description |
|----------|-------------|
| `/rank` | Voir son niveau et sa barre de progression |
| `/leaderboard` | Classement XP du serveur |
| `/setxp` | Définir l'XP d'un membre (Admin) |

### 💰 Économie
| Commande | Description |
|----------|-------------|
| `/daily` | Bonus quotidien (500 🪙 + streak bonus) |
| `/solde` | Voir son portefeuille et sa banque |
| `/banque` | Déposer/retirer des coins en banque |
| `/payer` | Envoyer des coins à un membre |
| `/richesse` | Classement des membres les plus riches |
| `/slots` | Machine à sous 🎰 |
| `/blackjack` | Jouer au blackjack 🃏 |

> 💡 Les membres gagnent automatiquement des coins en chattant !

### 🎵 Musique
| Commande | Description |
|----------|-------------|
| `/play` | Jouer une musique depuis YouTube |
| `/skip` | Passer à la musique suivante |
| `/stop` | Arrêter la musique |
| `/pause` | Mettre en pause / reprendre |
| `/queue` | Voir la file d'attente |
| `/volume` | Régler le volume (0-150%) |

### 🎉 Giveaway
| Commande | Description |
|----------|-------------|
| `/giveaway créer` | Créer un giveaway |
| `/giveaway terminer` | Terminer manuellement |
| `/giveaway reroll` | Relancer le tirage |

### 🎮 Rôles de Jeux
| Commande | Description |
|----------|-------------|
| `/jeux choisir` | Choisir ses jeux via menu déroulant |
| `/jeux rang` | Choisir son rang dans un jeu |
| `/panel` | Poster le panel de sélection (Admin) |

**Jeux supportés :** Rocket League, CS2, Valorant, League of Legends, Fortnite, Minecraft

### 🎟️ Tickets
| Commande | Description |
|----------|-------------|
| `/ticket panel` | Poster le panel de tickets (Admin) |
| `/ticket fermer` | Fermer un ticket |
| `/ticket ajouter` | Ajouter un membre au ticket |
| `/ticket supprimer` | Retirer un membre du ticket |

### 👤 Profil Gaming
| Commande | Description |
|----------|-------------|
| `/profil voir` | Voir son profil ou celui d'un membre |
| `/profil bio` | Modifier sa bio |
| `/profil pseudo` | Ajouter son pseudo dans un jeu |
| `/profil banniere` | Changer la couleur de son profil |

### 📅 Anniversaires
| Commande | Description |
|----------|-------------|
| `/anniversaire définir` | Enregistrer son anniversaire |
| `/anniversaire voir` | Voir l'anniversaire d'un membre |
| `/anniversaire prochain` | Voir les prochains anniversaires |

### 🎮 Mini-jeux
| Commande | Description |
|----------|-------------|
| `/coinflip` | Pile ou face |
| `/rps` | Pierre Feuille Ciseaux |
| `/dice` | Lancer des dés |
| `/trivia` | Quiz interactif |
| `/8ball` | Boule magique |

### 📊 Statistiques Serveur
| Commande | Description |
|----------|-------------|
| `/stats créer` | Créer les salons de statistiques auto |
| `/stats supprimer` | Supprimer les salons de statistiques |

### 🔔 Systèmes Automatiques
| Système | Description |
|---------|-------------|
| 📺 Twitch | Alertes live automatiques |
| 🆓 Jeux Gratuits | Posts auto (Epic, Steam, Humble, FreeToGame) |
| 📸 Instagram | Auto-post nouvelles publications |
| 🎂 Anniversaires | Souhaits automatiques à 9h |
| 🎉 Giveaways | Fin et tirage automatiques |

### 🌍 Utilitaires
| Commande | Description |
|----------|-------------|
| `/meteo` | Météo en temps réel |
| `/serverinfo` | Informations sur le serveur |
| `/userinfo` | Informations sur un membre |
| `/reglement` | Poster le règlement |
| `/twitch` | Vérifier si un streamer est en live |
| `/freegames` | Voir les jeux gratuits du moment |

---

## 🚀 Installation

### Prérequis
- Node.js v18+
- FFmpeg
- yt-dlp
- VPS recommandé (OVH, DigitalOcean)

### Installation

```bash
git clone https://github.com/DealerDeKebab/GamingBot.git
cd GamingBot
npm install
```

### Configuration

```bash
cp .env.example .env
nano .env
```

### Démarrage

```bash
node deploy-commands.js
npm start

# En production
pm2 start index.js --name "GamingBot"
pm2 save && pm2 startup
```

---

## 📁 Structure du projet

```
GamingBot/
├── commands/
│   ├── economy/      # Économie complète
│   ├── games/        # Mini-jeux
│   ├── giveaway/     # Giveaways
│   ├── leveling/     # XP et niveaux
│   ├── moderation/   # Modération
│   ├── music/        # Musique YouTube
│   ├── roles/        # Rôles de jeux
│   ├── security/     # Sécurité
│   ├── social/       # Twitch, jeux gratuits
│   └── utility/      # Utilitaires
├── database/
│   └── database.js
├── events/
├── handlers/
├── utils/
├── index.js
├── deploy-commands.js
└── .env
```

---

## 🛠️ Technologies

- **Discord.js** v14
- **Better-SQLite3**
- **yt-dlp** — Streaming YouTube
- **@discordjs/voice**
- **node-cron**
- **axios** + **rss-parser**

---

*Bot développé par DealerDeKebab*

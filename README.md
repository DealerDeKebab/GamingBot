# 🎮 Bot Discord Gaming Communautaire — V2

Bot Discord complet orienté communauté gaming. Slash commands, SQLite, anti-raid robuste, musique stable, jeux gratuits multi-sources, Instagram auto-post, et bien plus.

---

## 🚀 Installation rapide

### 1. Prérequis
- **Node.js v18+** → https://nodejs.org
- **FFmpeg** → https://ffmpeg.org/download.html *(requis pour la musique)*

### 2. Créer le bot Discord
1. https://discord.com/developers/applications → **New Application**
2. Onglet **Bot** → **Add Bot** → copie le **Token**
3. Onglet **OAuth2 > URL Generator** :
   - Scopes : `bot` + `applications.commands`
   - Permissions : `Administrator` (ou permissions détaillées)
4. Utilise l'URL générée pour inviter le bot

### 3. Configurer le .env
```bash
cp .env.example .env
# Ouvre .env et remplis toutes les variables
```

### 4. Installer et lancer
```bash
npm install
npm run deploy    # Déploie les slash commands (à faire 1 seule fois)
npm start         # Lance le bot
```

---

## ⚙️ Variables .env importantes

| Variable | Description | Requis |
|----------|-------------|--------|
| `DISCORD_TOKEN` | Token du bot | ✅ |
| `CLIENT_ID` | ID de l'application | ✅ |
| `GUILD_ID` | ID de ton serveur | ✅ |
| `WELCOME_CHANNEL_ID` | Salon de bienvenue | ✅ |
| `LOG_CHANNEL_ID` | Logs de modération | ✅ |
| `MEMBER_ROLE_ID` | Rôle donné après vérification | ✅ |
| `WEATHER_API_KEY` | OpenWeatherMap (gratuit) | Pour `/meteo` |
| `TWITCH_CLIENT_ID` + `SECRET` | Dev Twitch (gratuit) | Pour Twitch |
| `TWITCH_USERNAME` | Streamer à surveiller | Pour Twitch |
| `INSTAGRAM_USERNAME` | Compte Instagram | Pour Instagram |
| `ANTIRAID_THRESHOLD` | Joins/30s avant alerte (défaut: 7) | 🔒 |
| `ANTIRAID_ACTION` | `alert` / `kick` / `ban` (défaut: alert) | 🔒 |

---

## 📋 Toutes les commandes

### 🛡️ Modération
| Commande | Description |
|----------|-------------|
| `/ban` | Bannir (avec DM + log) |
| `/kick` | Expulser |
| `/mute` | Timeout temporaire (10m, 1h, 2d...) |
| `/unmute` | Retirer le mute |
| `/unban` | Débannir par ID |
| `/warn ajouter` | Ajouter un warn (auto-mute à 3, auto-kick à 5) |
| `/warn liste` | Voir les warns |
| `/warn supprimer` | Supprimer un warn |
| `/warn effacer` | Effacer tous les warns |
| `/purge` | Supprimer 1-100 messages (filtrable par membre) |
| `/slowmode` | Mode lent (0 = désactiver) |
| `/lockdown` | Verrouiller/Déverrouiller un salon |

### 📊 XP / Niveaux
| Commande | Description |
|----------|-------------|
| `/rank` | Voir son niveau, XP, rang et barre de progression |
| `/leaderboard` | Classement du serveur |
| `/setxp` | Définir XP/niveau d'un membre (Admin) |

XP gagné : 15-25 par message, cooldown 1 minute. Level-up annoncé dans le salon.

### 🎵 Musique (YouTube)
| Commande | Description |
|----------|-------------|
| `/play` | Jouer depuis YouTube (titre ou lien) |
| `/skip` | Passer la piste |
| `/stop` | Arrêter et vider la file |
| `/queue` | Voir la file d'attente |
| `/pause` | Pause / Reprendre |
| `/volume` | Régler le volume (0-150%) |

### 🎉 Giveaway
| Commande | Description |
|----------|-------------|
| `/giveaway créer` | Créer un giveaway avec bouton de participation |
| `/giveaway terminer` | Terminer manuellement |
| `/giveaway reroll` | Re-tirer un gagnant |

### 🎮 Mini-jeux
| Commande | Description |
|----------|-------------|
| `/coinflip` | Pile ou face |
| `/rps` | Pierre Feuille Ciseaux |
| `/dice` | Lancer des dés (1-10 dés, 2-1000 faces) |
| `/trivia` | QCM : Gaming, Général, Science, Sports |
| `/8ball` | La boule magique |

### 🎭 Rôles de jeux
| Commande | Description |
|----------|-------------|
| `/jeux choisir` | Menu pour choisir ses jeux (RL, CS2, Valorant, LoL, Fortnite, Minecraft) |
| `/jeux rang` | Sélectionner son rang dans un jeu |

Jeux configurés : Rocket League, CS2, Valorant, League of Legends, Fortnite, Minecraft.

### 🌐 Social & Utilitaire
| Commande | Description |
|----------|-------------|
| `/meteo` | Météo complète d'une ville |
| `/twitch` | Vérifier si un streamer est en live |
| `/freegames` | Jeux gratuits du moment (Epic + Free-to-Play) |
| `/anniversaire définir` | Enregistrer son anniversaire |
| `/anniversaire voir` | Voir l'anniversaire d'un membre |
| `/anniversaire prochain` | Les 5 prochains anniversaires |
| `/reglement` | Poster le message de règlement (Admin) |
| `/serverinfo` | Infos complètes du serveur |
| `/userinfo` | Infos sur un membre |

---

## 🔒 Sécurité automatique

### Captcha
- Envoyé en DM à chaque nouveau membre
- Code de 6 caractères, 3 tentatives, expiration 10 min
- Kick automatique si échec ou expiration

### Anti-spam
- Détection : 5+ messages en 5 secondes
- Action : mute automatique 5 minutes + log

### Anti-raid
- Détection : `ANTIRAID_THRESHOLD` joins en 30 secondes (défaut: 7)
- Actions configurables : `alert` / `kick` / `ban`
- Mode raid désactivé automatiquement après 2 minutes
- Log dans le salon de logs avec alerte @here

---

## 🎂 Anniversaires automatiques
Vérification chaque matin à **9h00**. Message avec mention dans le salon configuré.

## 🆓 Jeux gratuits automatiques
Vérification toutes les **heures**. Sources : Epic Games Store, FreeToGame, Steam RSS, Humble RSS.
Chaque jeu n'est posté qu'une seule fois (base de données).

## 📸 Instagram automatique
Vérification toutes les **15 minutes** via RSS (RSSHub).
Poste automatiquement chaque nouvelle publication du compte configuré.

## 📺 Alertes Twitch automatiques
Vérification toutes les **5 minutes**.
Notification @here quand le streamer passe en live.

---

## 📁 Structure du projet

```
discord-bot-v2/
├── index.js                    Point d'entrée + tâches cron
├── deploy-commands.js          Déploiement des slash commands
├── .env.example                Modèle de configuration
├── commands/
│   ├── moderation/             ban, kick, mute, unmute, unban, warn, purge, slowmode, lockdown
│   ├── leveling/               rank, leaderboard, setxp
│   ├── music/                  play, skip, stop, pause, queue, volume
│   ├── giveaway/               giveaway (créer, terminer, reroll)
│   ├── games/                  coinflip, rps, dice, trivia, 8ball
│   ├── roles/                  jeux (sélection + rangs)
│   ├── social/                 freegames, twitch
│   ├── security/               slowmode, lockdown
│   └── utility/                reglement, anniversaire, meteo, serverinfo, userinfo
├── events/
│   ├── interactionCreate.js    Slash commands + boutons + menus
│   ├── guildMemberAdd.js       Anti-raid + captcha DM
│   └── messageCreate.js        Anti-spam + XP + captcha réponse
├── handlers/
│   ├── commandHandler.js       Chargement auto des commandes
│   └── eventHandler.js         Chargement auto des événements
├── database/
│   └── database.js             SQLite — toutes les tables et fonctions
└── utils/
    ├── buttonHandler.js        Règlement, giveaway, RPS, trivia
    ├── selectMenuHandler.js    Sélection jeux et rangs
    ├── birthdayChecker.js      Annonces anniversaires (cron 9h)
    ├── giveawayChecker.js      Fin des giveaways (cron 30s)
    ├── twitchChecker.js        Alertes live (cron 5min)
    ├── freeGamesChecker.js     Jeux gratuits multi-sources (cron 1h)
    └── instagramChecker.js     Auto-post Instagram (cron 15min)
```

---

## 💡 APIs gratuites

| Service | URL | Limite |
|---------|-----|--------|
| OpenWeatherMap | https://openweathermap.org/api | 60 appels/min |
| Twitch Dev | https://dev.twitch.tv/console | Gratuit |

---

## 🐛 Résolution de problèmes

**"Cannot find module '@discordjs/opus'"**
→ `npm install @discordjs/opus` ou `npm install opusscript`

**Musique ne fonctionne pas**
→ Installe FFmpeg et ajoute-le au PATH système

**Commandes slash n'apparaissent pas**
→ Lance `npm run deploy` et attends 1-2 minutes

**Instagram ne poste pas**
→ Vérifie que RSSHub est accessible ou configure `INSTAGRAM_RSS_URL` avec une autre source RSS

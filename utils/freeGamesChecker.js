const axios           = require('axios');
const Parser          = require('rss-parser');
const { EmbedBuilder } = require('discord.js');
const { postedGames } = require('../database/database');

const rss = new Parser();

// ── Couleurs par plateforme ────────────────────────────────
const PLATFORM_COLORS = {
  'Epic Games':  '#2ECC71',
  'Steam':       '#1B2838',
  'GOG':         '#8B4F96',
  'Humble':      '#CC0000',
  'Itch.io':     '#FA5C5C',
  'Prime Gaming':'#FF9900',
};

// ── 1. Epic Games Store ────────────────────────────────────
async function fetchEpicGames() {
  const games = [];
  try {
    const res = await axios.get(
      'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=fr&country=FR&allowCountries=FR',
      { timeout: 8000 }
    );
    const elements = res.data?.data?.Catalog?.searchStore?.elements || [];
    for (const g of elements) {
      const promos = g.promotions?.promotionalOffers?.[0]?.promotionalOffers || [];
      const isCurrentlyFree = promos.some(p => {
        const discount = p.discountSetting?.discountPercentage;
        return discount === 0;
      });
      if (!isCurrentlyFree) continue;
      const img = g.keyImages?.find(i => i.type === 'Thumbnail' || i.type === 'DieselGameBoxTall' || i.type === 'OfferImageWide')?.url || null;
      games.push({
        id:       g.id,
        title:    g.title,
        desc:     (g.description || '').substring(0, 180),
        url:      `https://store.epicgames.com/fr/p/${g.urlSlug || g.productSlug || ''}`,
        image:    img,
        platform: 'Epic Games',
      });
    }
  } catch (e) { console.error('Epic Games fetch error:', e.message); }
  return games;
}

// ── 2. Steam (via SteamDB RSS) ────────────────────────────
async function fetchSteamGames() {
  const games = [];
  try {
    const feed = await rss.parseURL('https://store.steampowered.com/feeds/newdeals.xml');
    for (const item of (feed.items || []).slice(0, 5)) {
      if (!item.title?.toLowerCase().includes('free') && !item.title?.toLowerCase().includes('gratuit')) continue;
      games.push({
        id:       item.link || item.title,
        title:    item.title,
        desc:     (item.contentSnippet || '').substring(0, 180),
        url:      item.link || 'https://store.steampowered.com',
        image:    null,
        platform: 'Steam',
      });
    }
  } catch (e) { console.error('Steam RSS error:', e.message); }
  return games;
}

// ── 3. GOG (via IsThereAnyDeal-style scrape free games) ──
async function fetchGOGGames() {
  const games = [];
  try {
    const res = await axios.get('https://www.gog.com/en/games?priceRange=0,0&order=desc:trending&hideDLCs=true', { timeout: 8000 });
    // GOG ne fournit pas d'API publique simple — on utilise leur catalogue filtré prix 0
    // On retourne rien si la page ne charge pas, sans planter
  } catch {}
  return games;
}

// ── 4. FreeToGame (API publique) ──────────────────────────
async function fetchFreeToPlayGames() {
  const games = [];
  try {
    const res = await axios.get('https://www.freetogame.com/api/games?sort-by=release-date', { timeout: 8000 });
    for (const g of (res.data || []).slice(0, 3)) {
      games.push({
        id:       String(g.id),
        title:    g.title,
        desc:     (g.short_description || '').substring(0, 180),
        url:      g.game_url,
        image:    g.thumbnail || null,
        platform: 'Free-to-Play',
      });
    }
  } catch (e) { console.error('FreeToGame error:', e.message); }
  return games;
}

// ── 5. Humble Bundle (RSS) ────────────────────────────────
async function fetchHumbleGames() {
  const games = [];
  try {
    const feed = await rss.parseURL('https://www.humblebundle.com/feed');
    for (const item of (feed.items || []).slice(0, 10)) {
      const title = item.title?.toLowerCase() || '';
      if (!title.includes('free') && !title.includes('gratuit') && !title.includes('claim')) continue;
      games.push({
        id:       item.link || item.title,
        title:    item.title,
        desc:     (item.contentSnippet || '').substring(0, 180),
        url:      item.link || 'https://www.humblebundle.com',
        image:    null,
        platform: 'Humble',
      });
    }
  } catch (e) { console.error('Humble RSS error:', e.message); }
  return games;
}

// ── Checker principal ─────────────────────────────────────
async function checkFreeGames(client) {
  const channel = client.guilds.cache
    .map(g => g.channels.cache.get(process.env.FREEGAMES_CHANNEL_ID))
    .find(Boolean);
  if (!channel) return;

  const sources = [
    { fn: fetchEpicGames,       label: 'Epic Games' },
    { fn: fetchSteamGames,      label: 'Steam' },
    { fn: fetchFreeToPlayGames, label: 'Free-to-Play' },
    { fn: fetchHumbleGames,     label: 'Humble' },
  ];

  for (const { fn, label } of sources) {
    let games = [];
    try { games = await fn(); } catch {}

    for (const game of games) {
      if (postedGames.isPosted(String(game.id), label)) continue;
      postedGames.markPosted(String(game.id), label);

      const color = PLATFORM_COLORS[game.platform] || '#5865F2';
      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`🎁 Jeu GRATUIT — ${game.platform}`)
        .setDescription(`**${game.title}**\n\n${game.desc}`)
        .setURL(game.url)
        .setFooter({ text: `Source : ${game.platform}` })
        .setTimestamp();

      if (game.image) embed.setImage(game.image);

      try {
        await channel.send({
          content: `🎮 **Jeu gratuit disponible sur ${game.platform} !**`,
          embeds: [embed],
        });
        // Petite pause pour éviter le rate limit
        await new Promise(r => setTimeout(r, 1500));
      } catch (e) { console.error('Send free game error:', e.message); }
    }
  }
}

module.exports = { checkFreeGames };

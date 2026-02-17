/**
 * Instagram Auto-Post Checker
 * 
 * Instagram ne fournit pas d'API publique gratuite pour les posts.
 * Ce module utilise deux approches :
 *   1. RSS via rss.app ou rsshub (services tiers qui agrègent Instagram)
 *   2. Picuki RSS (si disponible)
 * 
 * CONFIGURATION dans .env :
 *   INSTAGRAM_USERNAME = nom_du_compte_instagram
 *   INSTAGRAM_RSS_URL  = (optionnel) URL RSS personnalisée si tu en as une
 * 
 * NOTE : Pour une solution 100% fiable, tu peux utiliser le Graph API
 *        Facebook (nécessite un compte Business vérifié) ou un service
 *        comme Zapier/Make.com. Ce checker utilise des flux RSS tiers
 *        comme solution gratuite.
 */

const Parser          = require('rss-parser');
const axios           = require('axios');
const { EmbedBuilder } = require('discord.js');
const { postedInstagram } = require('../database/database');

const rss = new Parser({
  customFields: { item: ['media:content', 'media:thumbnail', 'enclosure'] },
});

async function fetchInstagramPosts(username) {
  const posts = [];

  // ── Méthode 1 : RSS via RSSHub (auto-hébergeable ou instance publique) ──
  const rssHubUrls = [
    `https://rsshub.app/instagram/user/${username}`,
    `https://rsshub.rssforever.com/instagram/user/${username}`,
  ];

  for (const url of rssHubUrls) {
    try {
      const feed = await rss.parseURL(url);
      for (const item of (feed.items || []).slice(0, 5)) {
        const imgMatch = (item['content:encoded'] || item.content || '').match(/<img[^>]+src="([^"]+)"/);
        const imgUrl   = imgMatch?.[1] || item.enclosure?.url || null;
        posts.push({
          id:      item.link || item.guid || item.title,
          title:   item.title || 'Nouveau post Instagram',
          desc:    (item.contentSnippet || '').substring(0, 300),
          url:     item.link || `https://www.instagram.com/${username}/`,
          image:   imgUrl,
          date:    item.pubDate ? new Date(item.pubDate) : new Date(),
        });
      }
      if (posts.length > 0) break; // On a ce qu'on veut
    } catch (e) {
      // Cette instance RSSHub n'est pas disponible, on essaie la suivante
    }
  }

  // ── Méthode 2 : URL RSS personnalisée configurée dans .env ──
  if (posts.length === 0 && process.env.INSTAGRAM_RSS_URL) {
    try {
      const feed = await rss.parseURL(process.env.INSTAGRAM_RSS_URL);
      for (const item of (feed.items || []).slice(0, 5)) {
        const imgMatch = (item['content:encoded'] || '').match(/<img[^>]+src="([^"]+)"/);
        posts.push({
          id:    item.link || item.guid || item.title,
          title: item.title || 'Nouveau post Instagram',
          desc:  (item.contentSnippet || '').substring(0, 300),
          url:   item.link || `https://www.instagram.com/${username}/`,
          image: imgMatch?.[1] || null,
          date:  item.pubDate ? new Date(item.pubDate) : new Date(),
        });
      }
    } catch (e) {
      console.error('Instagram RSS personnalisé error:', e.message);
    }
  }

  return posts;
}

async function checkInstagram(client) {
  const username = process.env.INSTAGRAM_USERNAME;
  if (!username) return;

  const channel = client.guilds.cache
    .map(g => g.channels.cache.get(process.env.INSTAGRAM_CHANNEL_ID))
    .find(Boolean);
  if (!channel) return;

  let posts = [];
  try {
    posts = await fetchInstagramPosts(username);
  } catch (e) {
    console.error('Instagram checker error:', e.message);
    return;
  }

  for (const post of posts) {
    const postId = String(post.id);
    if (postedInstagram.isPosted(postId)) continue;
    postedInstagram.markPosted(postId);

    const embed = new EmbedBuilder()
      .setColor('#E1306C')
      .setTitle(`📸 Nouveau post — @${username}`)
      .setDescription(post.desc || 'Voir le post sur Instagram')
      .setURL(post.url)
      .setFooter({ text: `Instagram • @${username}`, iconURL: 'https://www.instagram.com/favicon.ico' })
      .setTimestamp(post.date);

    if (post.image) embed.setImage(post.image);

    try {
      await channel.send({
        content: `📱 **@${username}** vient de poster sur Instagram !`,
        embeds: [embed],
      });
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      console.error('Send Instagram post error:', e.message);
    }
  }
}

module.exports = { checkInstagram };

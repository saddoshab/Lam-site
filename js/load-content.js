// js/load-content.js
async function loadPosts(collection, containerClass, isHomePage = false) {
  const container = document.querySelector(`.${containerClass}`);
  if (!container) return;

  try {
    const files = await getFileList(collection);
    
    let posts = [];
    for (const file of files) {
      const postRes = await fetch(`/content/${collection}/${file}`);
      const text = await postRes.text();
      
      const [frontmatter, ...bodyParts] = text.split('---').slice(1);
      const data = parseFrontmatter(frontmatter);
      data.body = bodyParts.join('---');
      data.slug = file.replace('.md', '');
      posts.push(data);
    }

    // Sort newest first. Show only 3 on homepage
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (isHomePage) posts = posts.slice(0, 3);

    // 1. NEWS - Short updates WITH link
    if (collection === 'news') {
      container.innerHTML = posts.map(post => `
        <div class="news-card">
          <img src="${post.image || 'img/default.jpg'}" alt="${post.title}">
          <div class="news-content">
            <p class="news-date">${formatDate(post.date)}</p>
            <h3>${post.title}</h3>
            <p>${post.summary || marked.parse(post.body).substring(0,120) + '...'}</p>
            <a href="news/${post.slug}.html">Read More →</a>
          </div>
        </div>
      `).join('');
    }

    // 2. ARTICLES - Long stories WITH link
    if (collection === 'articles') {
      container.innerHTML = posts.map(post => `
        <div class="news-card">
          <img src="${post.image || 'img/default.jpg'}" alt="${post.title}">
          <div class="news-content">
            <p class="news-date">${formatDate(post.date)}</p>
            <h3>${post.title}</h3>
            <p>${post.summary || marked.parse(post.body).substring(0,120) + '...'}</p>
            <a href="article/${post.slug}.html">Read Full Story →</a>
          </div>
        </div>
      `).join('');
    }

    // 3. STORIES - Success stories
    if (collection === 'stories') {
      container.innerHTML = posts.map(post => `
        <div class="story-card">
          <img src="${post.image || 'images/default.jpg'}" alt="${post.title}">
          <div class="story-text">
            <h4>"${post.title}"</h4>
            <p>"${post.summary || marked.parse(post.body).substring(0,200) + '...'}"</p>
            <span>- ${post.location || 'LAM Beneficiary'}</span>
          </div>
        </div>
      `).join('');
    }

  } catch (err) {
    container.innerHTML = `<p>No ${collection} published yet. Go to /admin to add one.</p>`;
    console.error(err);
  }
}

function parseFrontmatter(fm) {
  const data = {};
  fm.split('\n').forEach(line => {
    const [key, ...rest] = line.split(':');
    if (key) data[key.trim()] = rest.join(':').trim().replace(/^"|"$/g, '');
  });
  return data;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

async function getFileList(collection) {
  const res = await fetch(`/content/${collection}/index.json`).catch(() => null);
  if (res) return await res.json();
  return [];
}
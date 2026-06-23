/* 新林中学论坛 — 静态前端逻辑 (localStorage) */

const STORAGE = {
  users: 'xinlin_users',
  session: 'xinlin_session',
  posts: 'xinlin_posts',
  counter: 'xinlin_visitor_count',
};

const SEED_EXAM_POST_ID = 'seed-exam-blessing-2000';

// 管理员名单（硬编码，站内无申请/升级入口）
const ADMIN_USERS = ['xinlin_mod'];

function isAdmin(username) {
  return ADMIN_USERS.includes(username);
}

const PROFILE_PAGES = {
  cy1203_: '../user/cy1203_.html',
};

function userLinkHtml(username, className = 'user-link') {
  const name = escapeHtml(username);
  const stop = 'onclick="event.stopPropagation()"';
  if (PROFILE_PAGES[username]) {
    return `<a href="${PROFILE_PAGES[username]}" class="${className}" ${stop}>${name}</a>`;
  }
  return `<a href="#" class="${className}" onclick="profileDataLost(event)">${name}</a>`;
}

function profileDataLost(e) {
  e.preventDefault();
  e.stopPropagation();
  showToast('数据丢失', 'error');
}

// ── 工具函数 ──

function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE.users) || '[]');
}

function saveUsers(users) {
  localStorage.setItem(STORAGE.users, JSON.stringify(users));
}

function getSession() {
  return JSON.parse(localStorage.getItem(STORAGE.session) || 'null');
}

function setSession(user) {
  if (user) {
    localStorage.setItem(STORAGE.session, JSON.stringify({ username: user.username }));
  } else {
    localStorage.removeItem(STORAGE.session);
  }
}

function getPosts() {
  return JSON.parse(localStorage.getItem(STORAGE.posts) || '[]');
}

function savePosts(posts) {
  localStorage.setItem(STORAGE.posts, JSON.stringify(posts));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatTime(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function navPending(e, name) {
  e.preventDefault();
  showToast(`${name}页面建设中，敬请期待～`, 'error');
}

function showToast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ── 访客计数器 ──

function initCounter() {
  let count = parseInt(localStorage.getItem(STORAGE.counter) || '1024', 10);
  count++;
  localStorage.setItem(STORAGE.counter, String(count));
  document.getElementById('visitorCounter').textContent = String(count).padStart(6, '0');
}

// ── 视图切换 ──

function switchView(viewId) {
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  document.getElementById(viewId).classList.add('active');
}

function showHome() {
  switchView('viewHome');
  renderFeaturedList();
  renderPostList();
  updateUserBar();
}

function showAuth() {
  switchView('viewAuth');
}

function showPost(postId) {
  switchView('viewPost');
  renderPostDetail(postId);
}

// ── 用户栏 ──

function updateUserBar() {
  const session = getSession();
  const statusEl = document.getElementById('userStatus');
  const actionsEl = document.getElementById('userActions');
  const newPostPanel = document.getElementById('newPostPanel');

  if (session) {
    statusEl.innerHTML = `欢迎回来，<strong>${userLinkHtml(session.username)}</strong>！`;
    actionsEl.innerHTML = `
      <button class="btn btn-danger" onclick="handleLogout()">退出登录</button>
    `;
    newPostPanel.classList.remove('hidden');
  } else {
    statusEl.innerHTML = '当前状态：<strong>游客</strong> — 请登录后发帖';
    actionsEl.innerHTML = `
      <button class="btn btn-primary" onclick="showAuth()">登录 / 注册</button>
    `;
    newPostPanel.classList.add('hidden');
  }
}

// ── 注册 ──

function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('regUsername').value.trim();
  const password = document.getElementById('regPassword').value;
  const password2 = document.getElementById('regPassword2').value;

  if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]{3,16}$/.test(username)) {
    showToast('用户名需 3-16 位，仅限字母、数字、下划线和中文', 'error');
    return;
  }
  if (password !== password2) {
    showToast('两次密码不一致！', 'error');
    return;
  }

  if (ADMIN_USERS.includes(username)) {
    showToast('该用户名不可注册', 'error');
    return;
  }

  const users = getUsers();
  if (users.some((u) => u.username === username)) {
    showToast('该用户名已被注册', 'error');
    return;
  }

  users.push({ username, password });
  saveUsers(users);
  setSession({ username });
  showToast(`注册成功，欢迎 ${username}！`);
  e.target.reset();
  showHome();
}

// ── 登录 ──

function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;

  const users = getUsers();
  const user = users.find((u) => u.username === username && u.password === password);

  if (!user) {
    showToast('用户名或密码错误', 'error');
    return;
  }

  setSession(user);
  showToast(`登录成功，${username}！`);
  e.target.reset();
  showHome();
}

// ── 退出 ──

function handleLogout() {
  setSession(null);
  showToast('已退出登录');
  showHome();
}

// ── 发帖 ──

function handleNewPost(e) {
  e.preventDefault();
  const session = getSession();
  if (!session) {
    showToast('请先登录', 'error');
    return;
  }

  const title = document.getElementById('postTitle').value.trim();
  const content = document.getElementById('postContent').value.trim();

  if (!title || !content) {
    showToast('标题和内容不能为空', 'error');
    return;
  }

  const posts = getPosts();
  posts.unshift({
    id: generateId(),
    title,
    content,
    author: session.username,
    createdAt: Date.now(),
    comments: [],
    featured: false,
    featuredAt: null,
  });
  savePosts(posts);
  showToast('帖子发布成功！🎉');
  e.target.reset();
  renderPostList();
}

// ── 帖子渲染 ──

function renderPostItem(p, featured = false) {
  const icon = featured ? '⭐' : (p.featured ? '⭐' : '📌');
  const cls = featured ? 'post-item post-item-featured' : (p.featured ? 'post-item post-item-featured-lite' : 'post-item');
  return `
    <li class="${cls}" onclick="showPost('${p.id}')">
      <div class="post-title">${icon} ${escapeHtml(p.title)}</div>
      <div class="post-meta">
        作者：${userLinkHtml(p.author)} | 💬 ${p.comments.length} 条评论
        ${p.featured ? ' | <span class="featured-tag">精选</span>' : ''}
      </div>
      <div class="post-preview">${escapeHtml(p.content)}</div>
    </li>
  `;
}

function renderFeaturedList() {
  const featured = getPosts()
    .filter((p) => p.featured && p.id !== 'seed-post-car-inquiry' && p.id !== 'seed-post-him')
    .sort((a, b) => (b.featuredAt || 0) - (a.featuredAt || 0));

  const panelEl = document.getElementById('featuredPanel');
  const listEl = document.getElementById('featuredList');
  const emptyEl = document.getElementById('emptyFeatured');

  if (featured.length === 0) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  listEl.innerHTML = featured.map((p) => renderPostItem(p, true)).join('');
}

let searchKeyword = '';

function postMatchesSearch(post, keyword) {
  const k = keyword.toLowerCase();
  const text = [
    post.title,
    post.content,
    post.author,
    ...(post.comments || []).flatMap((c) => [c.content, c.author]),
  ].join(' ').toLowerCase();
  return text.includes(k);
}

function handleSearch(e) {
  if (e) e.preventDefault();
  searchKeyword = document.getElementById('searchInput').value.trim();
  // 特殊搜索密码，转到恐怖页面
  if (searchKeyword === '@:20/17/0/6/11/2/0') {
    location.href = 'error.html';
    return;
  }
  // 数据损坏提示
  if (searchKeyword === '@:HSJHDXJ') {
    showToast('搜索的帖子数据损坏 [.../police/6rty1k.html]', 'error');
    return;
  }
  renderPostList();
}

function clearSearch() {
  searchKeyword = '';
  document.getElementById('searchInput').value = '';
  renderPostList();
}

function renderPostList() {
  const allPosts = getPosts();
  let posts = searchKeyword
    ? allPosts.filter((p) => postMatchesSearch(p, searchKeyword))
    : allPosts;
  // 如果没有搜索关键词，隐藏特殊帖子
  if (!searchKeyword) {
    posts = posts.filter((p) => p.id !== 'seed-post-him');
    posts = posts.filter((p) => p.id !== 'seed-post-car-inquiry');
  }
  const listEl = document.getElementById('postList');
  const emptyEl = document.getElementById('emptyPosts');
  const emptyTextEl = document.getElementById('emptyPostsText');
  const hintEl = document.getElementById('searchHint');

  if (searchKeyword) {
    hintEl.classList.remove('hidden');
    hintEl.textContent = posts.length
      ? `关键词「${searchKeyword}」共找到 ${posts.length} 条帖子`
      : `关键词「${searchKeyword}」未找到相关帖子`;
  } else {
    hintEl.classList.add('hidden');
    hintEl.textContent = '';
  }

  if (posts.length === 0) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    emptyTextEl.textContent = searchKeyword
      ? '没有匹配的帖子，换个关键词试试？'
      : '还没有帖子哦，快来发第一个吧！';
    return;
  }

  emptyEl.classList.add('hidden');
  listEl.innerHTML = posts.map((p) => renderPostItem(p)).join('');
}

// ── 精选切换 ──

function toggleFeatured(postId) {
  const session = getSession();
  if (!session) {
    showToast('请先登录', 'error');
    return;
  }
  if (!isAdmin(session.username)) {
    showToast('仅管理员可设置精选帖子', 'error');
    return;
  }

  const posts = getPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) return;

  post.featured = !post.featured;
  post.featuredAt = post.featured ? Date.now() : null;
  savePosts(posts);
  showToast(post.featured ? '已设为精选帖子 ⭐' : '已取消精选');
  renderPostDetail(postId);
}

// ── 帖子详情 ──

function renderPostDetail(postId) {
  const posts = getPosts();
  const post = posts.find((p) => p.id === postId);
  const detailEl = document.getElementById('postDetail');

  if (!post) {
    detailEl.innerHTML = '<div class="empty-state"><span class="emoji">(╯°□°)╯</span>帖子不存在或已被删除</div>';
    return;
  }

  const session = getSession();
  const commentsHtml = post.comments.length
    ? post.comments.map((c) => `
        <div class="comment">
          <span class="comment-author ${c.author === '他不配被铭记' ? 'red-text' : ''}">${userLinkHtml(c.author)}</span>
          <div class="comment-body">${escapeHtml(c.content)}</div>
        </div>
      `).join('')
    : '<div class="empty-state" style="padding:16px"><span class="emoji">(´･ω･`)</span>暂无评论，来抢沙发吧！</div>';

  const commentFormHtml = session
    ? `
      <form class="comment-form" onsubmit="handleComment(event, '${post.id}')">
        <div class="form-group">
          <label>发表评论</label>
          <textarea id="commentContent" placeholder="写下你的评论..." maxlength="2000" required></textarea>
        </div>
        <button type="submit" class="btn btn-secondary">💬 发表评论</button>
      </form>
    `
    : '<p style="color:#999;margin-top:12px">登录后才能评论哦 ~ <a style="color:#ff66ff;cursor:pointer" onclick="showAuth()">去登录</a></p>';

  const featuredBtnHtml = session && isAdmin(session.username)
    ? `<button class="btn ${post.featured ? 'btn-danger' : 'btn-primary'}" onclick="toggleFeatured('${post.id}')">${post.featured ? '取消精选' : '⭐ 设为精选'}</button>`
    : '';

  detailEl.innerHTML = `
    <div class="post-header">
      <h2>${post.featured ? '⭐ ' : ''}${escapeHtml(post.title)}</h2>
      <div class="post-meta" style="margin-top:8px">
        作者：${userLinkHtml(post.author)}
        ${post.featured ? ' | <span class="featured-tag">精选帖子</span>' : ''}
      </div>
      ${featuredBtnHtml ? `<div class="btn-group" style="margin-top:10px">${featuredBtnHtml}</div>` : ''}
    </div>
    <div class="post-body">${post.id === 'seed-post-car-inquiry' ? post.content : escapeHtml(post.content)}</div>
    <div class="comments-section">
      <div class="panel-title">💬 评论区 (${post.comments.length})</div>
      ${commentsHtml}
      ${commentFormHtml}
    </div>
  `;
}

// ── 评论 ──

function handleComment(e, postId) {
  e.preventDefault();
  const session = getSession();
  if (!session) {
    showToast('请先登录', 'error');
    return;
  }

  const content = document.getElementById('commentContent').value.trim();
  if (!content) {
    showToast('评论内容不能为空', 'error');
    return;
  }

  const posts = getPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) return;

  // 如果在感谢金辰帖子中评论"金辰"，跳转到新闻页面
  if (post.id === 'seed-post-thanks-jinchen' && content.includes('金辰')) {
    window.location.href = '../../jime/news-jinchen.html';
    return;
  }

  // 如果在校长千金帖子中评论"王安"，跳转到新闻页面
  if (post.id === 'seed-post-principal-daughter' && content.includes('王安')) {
    window.location.href = '../../jime/news-wangan.html';
    return;
  }

  // 如果在车牌帖子中评论"田树"，跳转到新闻页面
  if (post.id === 'seed-post-car-inquiry' && content.includes('田树')) {
    window.location.href = '../../jime/news-tianshu.html';
    return;
  }

  post.comments.push({
    id: generateId(),
    author: session.username,
    content,
    createdAt: Date.now(),
  });
  savePosts(posts);
  showToast('评论发表成功！');
  renderPostDetail(postId);
}

// ── ARG 预设帖子（官方内容，非玩家操作）──

function buildExamSeedPost() {
  return {
    id: SEED_EXAM_POST_ID,
    title: '【置顶】致全体初三同学：全市统考加油！',
    content: `亲爱的初三同学们：

再过三天，本学期全市统一测验就要开始了。这是市教育局组织的常规学业检测，用来摸底各校正轨教学情况，不是什么高考，也和毕业升学没有关系，大家别自己吓自己。

年级组全体老师想对大家说：认真对待、正常发挥就好。把它当成一次普通的期中测验，查漏补缺，不必过度紧张。

考试期间请注意：
· 带好准考证和文具，提前到达考场
· 保证睡眠，考前一天不要熬夜复习
· 遇到难题先跳过，把会做的题拿到分最重要

考完了照常上课，暑假还远着呢。加油！

新林中学初三年级组 敬上
2000年9月10日`,
    author: '初三年级组',
    createdAt: new Date('2000-09-10T08:30:00').getTime(),
    featured: true,
    featuredAt: new Date('2000-09-10T09:00:00').getTime(),
    comments: [
      {
        id: 'seed-c1',
        author: '初三②班_林晓',
        content: '收到！这几天我会早点睡的，谢谢老师们的叮嘱～大家一起加油！！',
        createdAt: new Date('2000-09-10T10:15:00').getTime(),
      },
           {
        id: 'seed-c2',
        author: 'cy1203_',
        content: '祝学长学姐统考顺利！三年后，我们考场见。',
        createdAt: new Date('2000-09-10T11:42:00').getTime(),
      },
      {
        id: 'seed-c3',
        author: '小飞侠_',
        content: '初二学弟学妹在此给师兄师姐打气！等你们好消息！！٩(◕‿◕)۶',
        createdAt: new Date('2000-09-10T14:08:00').getTime(),
      },
      {
        id: 'seed-c4',
        author: '星星眼',
        content: '操场边上的布告栏已经贴好加油标语了，统考那天我们会去校门口接你们的！',
        createdAt: new Date('2000-09-10T16:30:00').getTime(),
      },
      {
        id: 'seed-c5',
        author: '不说再见',
        content: '平常心就好，就是普通测验，相信自己。',
        createdAt: new Date('2000-09-10T19:55:00').getTime(),
      },
      {
        id: 'seed-c6',
        author: '跳跳糖',
        content: '我妈昨晚特意给我炖了鸡汤！说补脑子用的哈哈哈',
        createdAt: new Date('2000-09-10T20:30:00').getTime(),
      },
      {
        id: 'seed-c7',
        author: '梧桐叶落',
        content: '准考证打印好了，大家记得检查姓名和照片有没有印错。',
        createdAt: new Date('2000-09-10T21:10:00').getTime(),
      },
      {
        id: 'seed-c8',
        author: '新林小灵通',
        content: '考场在本校初中部教学楼！别跑错地方了！！',
        createdAt: new Date('2001-09-11T07:25:00').getTime(),
      },
    ],
  };
}

function buildStudentSeedPosts() {
  return [
    {
      id: 'seed-post-radio',
      title: '【招新】校园广播站欢迎学弟学妹加入～',
      content: `大家好，我是广播站现任站长星星眼。

新学年广播站招新啦！我们需要：
· 播音员 2 名（声音清楚就行，不要怕生）
· 文稿编辑 1 名（会写稿，文笔好加分）
· 放歌专员 1 名（负责选歌，品味要好！）

每周二、四中午十二点半全校播音，能在广播里听到自己的声音超酷的！

有意向的到团委办公室填表，或者在这个帖子里留言报名～`,
      author: '星星眼',
      createdAt: new Date('2000-09-01T12:00:00').getTime(),
      featured: true,
      featuredAt: new Date('2000-09-01T12:30:00').getTime(),
      comments: [
        {
          id: 'seed-post-radio-c1',
          author: '跳跳糖',
          content: '我想报名放歌专员！！我可以带磁带过来！！',
          createdAt: new Date('2000-09-01T15:22:00').getTime(),
        },
        {
          id: 'seed-post-radio-c2',
          author: '小飞侠_',
          content: '我声音可以吗？同学们说我朗读课文挺大声的……',
          createdAt: new Date('2000-09-01T16:40:00').getTime(),
        },
        {
          id: 'seed-post-radio-c3',
          author: '梧桐叶落',
          content: '上学期期末广播站放过《同桌的你》，全校都哭了。期待这学期的新歌单！',
          createdAt: new Date('2000-09-01T18:05:00').getTime(),
        },
        {
          id: 'seed-post-radio-c4',
          author: '新林小灵通',
          content: '报名截止什么时候？周末能去填表吗？',
          createdAt: new Date('2001-09-02T09:30:00').getTime(),
        },
      ],
    },
    {
      id: 'seed-post-canteen',
      title: '食堂二楼水饺是不是涨价了？？',
      content: `今天中午去吃饭，感觉水饺份量变少了……

以前五块钱一碗挺实惠的，现在还是五块但只给八个了！！八个啊朋友们！！

有没有人去问过阿姨？是我错觉还是真的缩水了(눈_눈)

顺便问一句：有人知道三楼小卖部新进的辣条好不好吃吗`,
      author: '跳跳糖',
      createdAt: new Date('2000-09-12T13:48:00').getTime(),
      featured: false,
      featuredAt: null,
      comments: [
        {
          id: 'seed-post-canteen-c1',
          author: '小飞侠_',
          content: '辣条别买绿色的那个！辣到怀疑人生！！！',
          createdAt: new Date('2000-09-12T14:10:00').getTime(),
        },
        {
          id: 'seed-post-canteen-c2',
          author: '小飞侠_',
          content: '初一新生报到那天食堂人超多！建议十一点四十就去排队……血泪教训',
          createdAt: new Date('2000-09-12T17:55:00').getTime(),
        },
        {
          id: 'seed-post-canteen-c3',
          author: '星星眼',
          content: '一楼窗口的紫菜蛋花汤还是免费的！搭配水饺刚刚好。',
          createdAt: new Date('2000-09-12T18:20:00').getTime(),
        },
        {
          id: 'seed-post-canteen-c4',
          author: '梧桐叶落',
          content: '涨价的事我问过阿姨了，她说面粉贵了……唉。',
          createdAt: new Date('2001-09-13T11:05:00').getTime(),
        },
      ],
    },
    {
      id: 'seed-post-study',
      title: '开学考倒计时一周了，大家怎么复习的？[2]',
      content: `还有七天就开学考了，有点慌。

我每天晚上做完作业还要再做一套模拟卷，感觉时间完全不够用。数学最后那道大题每次都是硬伤……

想问问同届的同学们：
1. 晚上几点睡比较合适？
2. 语文作文有没有万能素材推荐？
3. 考试当天早餐吃什么不容易犯困？

就是普通测验而已，大家最后冲刺！！`,
      author: '初三②班_林晓',
      createdAt: new Date('2001-09-03T21:30:00').getTime(),
      featured: false,
      featuredAt: null,
      comments: [
        {
          id: 'seed-post-study-c1',
          author: '不说再见',
          content: '别熬太晚，十一点前必须睡。上次模拟考熬夜复习，第二天考英语时差点睡着……',
          createdAt: new Date('2001-09-03T22:15:00').getTime(),
        },
        {
          id: 'seed-post-study-c2',
          author: '星星眼',
          content: '作文素材看看《读者》就行，别背太多模板，改卷老师一眼能看出来。',
          createdAt: new Date('2001-09-04T07:40:00').getTime(),
        },
        {
          id: 'seed-post-study-c3',
          author: '跳跳糖',
          content: '早餐吃包子加豆浆！别吃太油腻的，上次吃油条考数学时好困……',
          createdAt: new Date('2001-09-04T12:10:00').getTime(),
        },
        {
          id: 'seed-post-study-c4',
          author: '梧桐叶落',
          content: '数学大题实在不行就写公式！老师说过步骤分也要拿的！',
          createdAt: new Date('2001-09-04T20:45:00').getTime(),
        },
        {
          id: 'seed-post-study-c5',
          author: '新林小灵通',
          content: '我这有去年样卷复印件，需要的私聊我（论坛留言就行）',
          createdAt: new Date('2001-09-05T08:00:00').getTime(),
        },
        {
          id: 'seed-post-study-c6',
          author: 'cy1203_',
          content: '考试的时候注意时间分配。最后一题如果太难就先跳过，把会做的题做完再说。[7]',
          createdAt: new Date('2001-09-05T22:00:00').getTime(),
        },
      ],
    },
    {
      id: 'seed-post-court',
      title: '放学后篮球场还有位置吗',
      content: `最近复习压力大，想打场球放松一下。

问一下每天下午五点半以后操场篮球场人多不多？我们班几个男生想组一队打半场。

另外学校允许自己带篮球吗？还是只能用体育室借的那种？`,
      author: '梧桐叶落',
      createdAt: new Date('2000-09-06T16:05:00').getTime(),
      featured: false,
      featuredAt: null,
      comments: [
        {
          id: 'seed-post-court-c1',
          author: '小飞侠_',
          content: '五点半去刚好！！再晚就被高中生占满了！！',
          createdAt: new Date('2000-09-06T16:48:00').getTime(),
        },
        {
          id: 'seed-post-court-c2',
          author: '星星眼',
          content: '可以自带球！体育室借的要登记，有时候还没气。',
          createdAt: new Date('2000-09-06T17:30:00').getTime(),
        },
        {
          id: 'seed-post-court-c3',
          author: '不说再见',
          content: '打球注意安全，考前别崴了脚，我们班有人上次因此耽误复习了。',
          createdAt: new Date('2000-09-06T19:15:00').getTime(),
        },
      ],
    },
    {
      id: 'seed-post-oicq',
      title: '谁有好看的QQ头像网址？？分享一下子[16]',
      content: `刚申请了个 OICQ，号码是七位数！超开心的！

但是系统自带头像太丑了，有没有同学收藏了什么头像网站？

最好是免费的那种，我零花钱不多……

另外QQ聊天室怎么进啊？听同学说里面可以跟全国各地的人聊天，好神奇`,
      author: '新林小灵通',
      createdAt: new Date('2001-09-08T19:45:00').getTime(),
      featured: false,
      featuredAt: null,
      comments: [
        {
          id: 'seed-post-oicq-c1',
          author: '跳跳糖',
          content: '你去搜"头像大全"！好多闪啊闪啊的那种！！',
          createdAt: new Date('2001-09-08T20:12:00').getTime(),
        },
        {
          id: 'seed-post-oicq-c2',
          author: '小飞侠_',
          content: '聊天室要排队进！开学第一周我等了好久才进去，里面人超多！',
          createdAt: new Date('2001-09-08T21:00:00').getTime(),
        },
        {
          id: 'seed-post-oicq-c3',
          author: '星星眼',
          content: '头像别用太大的 gif，加载慢会把电脑卡死……',
          createdAt: new Date('2001-09-09T08:40:00').getTime(),
        },
        {
          id: 'seed-post-oicq-c4',
          author: '梧桐叶落',
          content: '我号码是六位数！比你还早申请！羡慕七位数吗哈哈',
          createdAt: new Date('2001-09-09T19:20:00').getTime(),
        },
        {
          id: 'seed-post-oicq-c5',
          author: 'cy1203_',
          content: '头像不要用真人照片当头像……我试过，会有奇怪的人来加你。[15]',
          createdAt: new Date('2000-09-10T13:25:00').getTime(),
        },
      ],
    },
    {
      id: 'seed-post-car-inquiry',
      title: '有人知道清A88888是谁的车吗？',
      content: `今天放学的时候在校门口看到一辆黑色的轿车，车牌号是清A88888。

<img src="image/hidden.png" alt="车" style="max-width: 100%; margin: 10px 0;">

看起来好高端啊！！黑色锃亮的那种，比我家那辆桑塔纳高级多了不知道多少个档次……

问了一下门卫大叔，大叔只是笑笑不说话。

有没有人知道这车是谁的啊？感觉不像是学生家长的车，难道是哪个领导的？`,
      author: '新林小灵通',
      createdAt: new Date('2000-10-08T18:30:00').getTime(),
      featured: false,
      featuredAt: null,
      comments: [
        {
          id: 'seed-post-car-c1',
          author: '跳跳糖',
          content: '清A88888？？这车牌也太牛了吧！连号就算了还是豹子号！',
          createdAt: new Date('2000-10-08T19:00:00').getTime(),
        },
        {
          id: 'seed-post-car-c2',
          author: '星星眼',
          content: '我也看到了！当时在等公交车，就看见一辆黑色轿车开进去了。据说是来找校长的？',
          createdAt: new Date('2000-10-08T19:15:00').getTime(),
        },
        {
          id: 'seed-post-car-c3',
          author: '梧桐叶落',
          content: '我爸说这种连号车牌不是一般人能拿到的，得有关系才行……',
          createdAt: new Date('2000-10-08T19:45:00').getTime(),
        },
        {
          id: 'seed-post-car-c4',
          author: '不说再见',
          content: '听说学校最近有什么重要的事情，具体我也不太清楚。反正那车肯定不是学生家长的。',
          createdAt: new Date('2000-10-08T20:30:00').getTime(),
        },
        {
          id: 'seed-post-car-c5',
          author: 'cy1203_',
          content: '不要问。',
          createdAt: new Date('2000-10-08T23:59:00').getTime(),
        },
        {
          id: 'seed-post-car-c6',
          author: '他不配被铭记',
          content: '我爸的车牌 12万',
          createdAt: new Date('2000-10-09T00:00:00').getTime(),
        },
      ],
    },
    {
      id: 'seed-post-principal-daughter',
      title: '【简介】校长千金——王安同学',
      content: `各位老师、同学们：

为了让大家更好地了解我校优秀学生，现向大家介绍校长千金——王安同学。

王安，女，现就读于本校初三①班，是我校校长的女儿。

王安同学学习成绩优异，每次考试都名列年级前茅。她性格开朗，乐于助人，经常主动帮助学习有困难的同学。此外，她还积极参与学校各项活动，是老师们都称赞的好学生。

让我们以王安同学为榜样，共同进步！

新林中学教务处`,
      author: '教务处',
      createdAt: new Date('2000-09-15T10:00:00').getTime(),
      featured: true,
      featuredAt: new Date('2000-09-15T10:30:00').getTime(),
      comments: [
        {
          id: 'seed-post-principal-c1',
          author: '跳跳糖',
          content: '王安学姐好厉害！每次考试都是第一名！',
          createdAt: new Date('2000-09-15T11:00:00').getTime(),
        },
        {
          id: 'seed-post-principal-c2',
          author: '星星眼',
          content: '难怪学习成绩这么好，原来是校长的女儿啊~',
          createdAt: new Date('2000-09-15T12:30:00').getTime(),
        },
        {
          id: 'seed-post-principal-c3',
          author: '梧桐叶落',
          content: '王安同学确实很优秀，是我们学习的榜样！',
          createdAt: new Date('2000-09-15T14:00:00').getTime(),
        },
      ],
    },
    {
      id: 'seed-post-thanks-jinchen',
      title: '【感谢信】致金辰同学家长——市教育局领导',
      content: `尊敬的金辰同学家长：

您好！

首先，请允许我代表新林中学全体师生，向您致以最诚挚的谢意！

您作为清江市教育局的领导，一直以来对我校的发展给予了极大的关心与支持。在您的协调推动下，我校获得了宝贵的教育资源和完善的教学设施更新，为同学们创造了更好的学习环境。

特别是在近期，您为我学申请到了更多的经费支持，用于改善教室设备和丰富课外活动资源。这些举措极大地提升了我校的教学质量和校园文化建设。

对此，我们深表感激！

此致
敬礼

新林中学全体师生
2000年9月20日`,
      author: '新林中学',
      createdAt: new Date('2000-09-20T09:00:00').getTime(),
      featured: true,
      featuredAt: new Date('2000-09-20T09:30:00').getTime(),
      comments: [
        {
          id: 'seed-post-thanks-c1',
          author: '不说再见',
          content: '原来金辰同学的家长是教育局的领导啊！难怪学校最近变化这么大！',
          createdAt: new Date('2000-09-20T10:00:00').getTime(),
        },
        {
          id: 'seed-post-thanks-c2',
          author: '新林小灵通',
          content: '难怪金辰同学平时这么低调，原来是领导家的孩子！',
          createdAt: new Date('2000-09-20T11:30:00').getTime(),
        },
        {
          id: 'seed-post-thanks-c3',
          author: 'cy1203_',
          content: '背景雄厚。',
          createdAt: new Date('2000-09-20T23:59:00').getTime(),
        },
      ],
    },
  ];
}

function buildLaterSeedPosts() {
  return [
    {
      id: 'seed-post-midterm',
      title: '期中考成绩出了……我整个人都不好了[11]',
      content: `成绩单发下来了，数学考砸了。

上次开学考还行，这次期中考反而退步了。明明复习了很久，最后一道大题还是没写完。

回到家不知道该怎么给爸妈看。他们对我期望挺高的……

有没有人跟我一样考砸了？你们打算怎么跟家里交代？`,
      author: '不说再见',
      createdAt: new Date('2001-10-15T19:30:00').getTime(),
      featured: false,
      featuredAt: null,
      comments: [
        {
          id: 'seed-post-midterm-c1',
          author: '跳跳糖',
          content: '抱抱！期中考又不是期末考，下次还有机会的！我这次也考砸了(；′⌒`)',
          createdAt: new Date('2001-10-15T20:15:00').getTime(),
        },
        {
          id: 'seed-post-midterm-c2',
          author: 'cy1203_',
          content: '我认识一个人，连续三次考试作文都是满分，但他从来不跟别人说技巧。你知道为什么吗？[3]',
          createdAt: new Date('2001-10-15T21:45:00').getTime(),
        },
        {
          id: 'seed-post-midterm-c3',
          author: '梧桐叶落',
          content: '家长的期望是家长的，你尽力就好。成绩不是衡量一个人的唯一标准。',
          createdAt: new Date('2001-10-16T08:20:00').getTime(),
        },
      ],
    },
    {
      id: 'seed-post-halloween',
      title: '下周三就是万圣节了！学校有什么活动吗？[6]',
      content: `下周三就是万圣节了！

我在想学校会不会办什么活动？之前听说团委老师想搞个化装舞会，不知道批下来没有。

大家打算怎么过节啊？我想买点糖果分给同学，但又怕被老师说……

对了，听说晚上的时候校电视台会放恐怖片？是真的吗？`,
      author: '跳跳糖',
      createdAt: new Date('2001-10-28T16:40:00').getTime(),
      featured: false,
      featuredAt: null,
      comments: [
        {
          id: 'seed-post-halloween-c1',
          author: '星星眼',
          content: '广播站会放点应景的歌曲！《Thriller》什么的～万圣节当天中午播！',
          createdAt: new Date('2001-10-28T17:30:00').getTime(),
        },
        {
          id: 'seed-post-halloween-c2',
          author: '小飞侠_',
          content: '我想打扮成吸血鬼！牙套已经准备好了嘿嘿嘿',
          createdAt: new Date('2001-10-29T09:00:00').getTime(),
        },
        {
          id: 'seed-post-halloween-c3',
          author: 'cy1203_',
          content: '不要在万圣节晚上去机房。不要一个人。不要回头看。[18]',
          createdAt: new Date('2001-10-29T23:59:00').getTime(),
        },
        {
          id: 'seed-post-halloween-c4',
          author: '新林小灵通',
          content: '三楼阅览室那边据说有鬼屋体验……但要报名才能进，我也不敢去',
          createdAt: new Date('2001-10-30T12:00:00').getTime(),
        },
      ],
    },
    {
      id: 'seed-post-november',
      title: '最近论坛回复好慢，是不是服务器出问题了？[13]',
      content: `不知道是不是我网络的问题，最近发完帖子要等好久才能刷新出来。

有时候发了帖子，刷新一下就消失了……但过一会儿又在别的帖子下面出现了。

版主能看到我这个帖子吗？能帮忙看看是怎么回事吗？`,
      author: '小飞侠_',
      createdAt: new Date('2001-11-08T14:22:00').getTime(),
      featured: false,
      featuredAt: null,
      comments: [
        {
          id: 'seed-post-november-c1',
          author: '新林小灵通',
          content: '不是只有你一个人！我也觉得最近怪怪的，发帖有时候要刷新好几次才显示',
          createdAt: new Date('2001-11-08T15:10:00').getTime(),
        },
        {
          id: 'seed-post-november-c2',
          author: '星星眼',
          content: '微机室老师说要维护服务器，可能会有点慢，过两天就好了吧',
          createdAt: new Date('2001-11-08T16:45:00').getTime(),
        },
        {
          id: 'seed-post-november-c3',
          author: 'cy1203_',
          content: '有时候缓存会出错。刷新之前先按Ctrl+F5强制刷新试试。[9]',
          createdAt: new Date('2001-11-09T09:30:00').getTime(),
        },
      ],
    },
    {
      id: 'seed-post-basketball',
      title: '篮球赛决赛我们班输了，但气氛还是挺好的[0]',
      content: `今天篮球赛决赛，我们班输了。

其实大家已经尽力了，对手确实比我们强。但回教室的时候，好多女生都在走廊等着，说"辛苦了"。

突然觉得输赢好像也不是那么重要了。初中最后一年，能和大家一起打球真的很开心。

明年就初三了，估计也没时间再打球了。珍惜这段时光吧。`,
      author: '梧桐叶落',
      createdAt: new Date('2001-11-20T17:55:00').getTime(),
      featured: false,
      featuredAt: null,
      comments: [
        {
          id: 'seed-post-basketball-c1',
          author: '不说再见',
          content: '输赢不重要，参与过才重要。这才是最难得的班级回忆。',
          createdAt: new Date('2001-11-20T18:30:00').getTime(),
        },
        {
          id: 'seed-post-basketball-c2',
          author: '跳跳糖',
          content: '虽然输了但你们班好团结啊！我们班决赛的时候女生都在看书没人加油……',
          createdAt: new Date('2001-11-20T19:15:00').getTime(),
        },
        {
          id: 'seed-post-basketball-c3',
          author: 'cy1203_',
          content: '有时候人会消失，比分也会消失。但一起打过球的记忆不会。[20]',
          createdAt: new Date('2001-11-21T10:00:00').getTime(),
        },
      ],
    },
    {
      id: 'seed-post-december',
      title: '十二月了，大家年初的目标完成得怎么样了？[17]',
      content: `时间过得好快，一转眼就十二月了。

还记得年初的时候给自己定了一些目标：期中考进步五名、看完整本《三国演义》、学会骑自行车……

结果呢？书翻了两页就放下了，车也没学成。唯一的进步大概是打字速度确实快了……因为经常泡论坛打字练习。

大家年初的目标都完成了吗？还是跟我一样半途而废了？`,
      author: '新林小灵通',
      createdAt: new Date('2001-12-05T20:30:00').getTime(),
      featured: false,
      featuredAt: null,
      comments: [
        {
          id: 'seed-post-december-c1',
          author: '跳跳糖',
          content: '我的目标是减肥……结果反而胖了五斤。都是零食吃太多惹的祸(；′⌒`)',
          createdAt: new Date('2001-12-05T21:15:00').getTime(),
        },
        {
          id: 'seed-post-december-c2',
          author: '小飞侠_',
          content: '我年初说要把微机室所有软件都学会，结果现在只学会了打牌和看图',
          createdAt: new Date('2001-12-06T08:45:00').getTime(),
        },
        {
          id: 'seed-post-december-c3',
          author: '星星眼',
          content: '目标这种事，完成了当然好，没完成也别太苛责自己。重要的是一直在努力',
          createdAt: new Date('2001-12-06T12:20:00').getTime(),
        },
        {
          id: 'seed-post-december-c4',
          author: 'cy1203_',
          content: '我认识一个人，他每年都说要完成某个目标。但每年同样的日子，你总能在同一个地方找到他。[1]',
          createdAt: new Date('2001-12-07T00:30:00').getTime(),
        },
      ],
    },
    {
      id: 'seed-post-newyear',
      title: '2001年的第一天，祝福大家新年快乐！[10]',
      content: `新年快乐！！！

新千年第一个元旦！虽然日历上只是普通的一天，但总觉得2001年听起来特别不一样。

大家元旦都在干嘛啊？我在家里看卫视跨年晚会，主持人的假睫毛掉了一段笑死我了。

新的一年希望大家都能开开心心的！也希望论坛能越办越好～

对了，有人说2001年是世界末日，是真的吗？虽然我不信，但还是有点怕怕的……`,
      author: '跳跳糖',
      createdAt: new Date('2001-01-01T00:30:00').getTime(),
      featured: false,
      featuredAt: null,
      comments: [
        {
          id: 'seed-post-newyear-c1',
          author: '星星眼',
          content: '新年快乐！新的一年广播站会继续努力给大家带来好节目的！',
          createdAt: new Date('2001-01-01T09:00:00').getTime(),
        },
        {
          id: 'seed-post-newyear-c2',
          author: '梧桐叶落',
          content: '2001年不是世界末日啦，放心！不过是玛雅历法什么的……总之别担心！',
          createdAt: new Date('2001-01-01T10:30:00').getTime(),
        },
        {
          id: 'seed-post-newyear-c3',
          author: 'cy1203_',
          content: '世界末日这种东西……只有等到那天才知道是不是真的。但在那之前，论坛会一直陪着你的。一直。[14]',
          createdAt: new Date('2001-01-01T12:00:00').getTime(),
        },
      ],
    },
    {
      id: 'seed-post-recover',
      title: '期末复习期间，有人一起去机房吗？[20]',
      content: `期末复习好累啊……每天作业写到十点多。

有没有人约一起去机房复习？不是说去玩游戏，是真的去查资料或者打字练习什么的。家里电脑被我爸设了密码，碰不得。

机房有暖气，而且能上网查学习资料。比在家里干坐着强。

有意向的留言啊！最好是周末白天的时候。`,
      author: '小飞侠_',
      createdAt: new Date('2001-01-15T16:20:00').getTime(),
      featured: false,
      featuredAt: null,
      comments: [
        {
          id: 'seed-post-recover-c1',
          author: '新林小灵通',
          content: '我可以周末上午去！但机房周末只开半天，要抓紧时间',
          createdAt: new Date('2001-01-15T17:00:00').getTime(),
        },
        {
          id: 'seed-post-recover-c2',
          author: 'cy1203_',
          content: '机房的电脑……有些已经坏了很久了。但你如果去的话，注意别碰最里面那台。屏幕有时候会自己亮起来。[5]',
          createdAt: new Date('2001-01-15T23:45:00').getTime(),
        },
      ],
    },
    {
      id: 'seed-post-him',
      title: '他',
      content: `他又来了

他的声音一直在我的脑海中游荡

我不知道他是谁

为什么

这就是成功的代价？

为了避免我的精神死亡 在这里将我每一篇帖子的解锁密码给你们：

bnVtOkA6MjAvMTcvMC82LzExLzIvMAp4PTAgeT00

我还活着`,
      author: 'cy1203_',
      createdAt: new Date('2001-03-01T01:00:00').getTime(),
      featured: false,
      featuredAt: null,
      comments: [],
    },
  ];
}

function mergeSeedPost(existing, seed) {
  const officialIds = new Set((seed.comments || []).map((c) => c.id));
  const extraComments = (existing.comments || [])
    .filter((c) => !officialIds.has(c.id));
  return {
    ...seed,
    comments: [...(seed.comments || []), ...extraComments],
  };
}

function initSeedPosts() {
  let posts = getPosts().filter((p) => p.id !== 'seed-exam-blessing-2005' && p.id !== 'seed-post-farewell');
  const seeds = [buildExamSeedPost(), ...buildStudentSeedPosts(), ...buildLaterSeedPosts()];

  seeds.forEach((seed) => {
    const idx = posts.findIndex((p) => p.id === seed.id);
    if (idx >= 0) {
      posts[idx] = mergeSeedPost(posts[idx], seed);
    } else {
      posts.push(seed);
    }
  });

  posts.sort((a, b) => b.createdAt - a.createdAt);
  savePosts(posts);
}

// ── 初始化 ──

function checkCy1203Tag() {
  return localStorage.getItem('xinlin_cy1203_tag') === '1';
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('viewHome')) return;
  initSeedPosts();
  initCounter();
  updateUserBar();
  renderFeaturedList();
  renderPostList();
});

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

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function getTagHtml(notice) {
  if (notice.pinned) return '<span class="notice-tag notice-tag-pinned">置顶</span>';
  if (notice.category === '荣誉通报') return '<span class="notice-tag notice-tag-honor">荣誉通报</span>';
  return '<span class="notice-tag notice-tag-system">系统公告</span>';
}

function renderNoticeList() {
  const listEl = document.getElementById('noticeList');
  const emptyEl = document.getElementById('emptyNotices');
  const sorted = [...NOTICES].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.date) - new Date(a.date);
  });

  if (sorted.length === 0) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  listEl.innerHTML = sorted.map((n) => `
    <li class="notice-item ${n.pinned ? 'notice-item-pinned' : ''}" onclick="location.href='detail.html?id=${n.id}'">
      ${getTagHtml(n)}
      <div class="notice-title">${escapeHtml(n.title)}</div>
      <div class="notice-summary">${escapeHtml(n.summary)}</div>
      <div class="notice-meta">${escapeHtml(n.author)} · ${n.date}</div>
    </li>
  `).join('');
}

function renderNoticeDetail() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const notice = NOTICES.find((n) => n.id === id);
  const detailEl = document.getElementById('noticeDetail');

  if (!notice) {
    detailEl.innerHTML = '<div class="empty-state"><span class="emoji">(╯°□°)╯</span>通知不存在或已被删除</div>';
    return;
  }

  if (notice.horror) {
    document.body.classList.add('horror-theme');
    document.title = '【系统公告】新林中学论坛';
    const warning = document.getElementById('horrorWarning');
    if (warning) warning.classList.remove('hidden');
    const marquee = document.getElementById('marqueeText');
    if (marquee) marquee.textContent = '对不起 对不起 对不起';
  }

  const body = notice.horror && notice.horrorContent
    ? notice.horrorContent
    : notice.content;

  const commentsHtml = notice.comments && notice.comments.length
    ? notice.comments.map((c) => `
        <div class="notice-comment">
          <span class="notice-comment-author">${escapeHtml(c.author)}</span>
          <div class="notice-comment-body">${escapeHtml(c.content)}</div>
        </div>
      `).join('')
    : '';

  detailEl.innerHTML = `
    <div class="notice-detail">
      <div class="notice-detail-header">
        ${getTagHtml(notice)}
        <h2 class="notice-detail-title">${escapeHtml(notice.title)}</h2>
        <div class="notice-detail-meta">${escapeHtml(notice.author)} · 发布于 ${notice.date}</div>
      </div>
      <div class="notice-detail-body">${escapeHtml(body)}</div>
      ${commentsHtml ? `<div class="notice-comments" id="horrorComments"><div class="notice-comments-title">评论区 (${notice.comments.length})</div>${commentsHtml}</div>` : ''}
    </div>
  `;

  if (notice.horror && notice.comments && notice.comments.length > 0) {
    const commentsSection = document.getElementById('horrorComments');
    if (commentsSection) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 设置标签：当用户看过评论区后，主页显示"他"帖子
            localStorage.setItem('xinlin_cy1203_tag', '1');
            const text = '金辰王安田树去死吧'.repeat(500);
            document.body.innerHTML = `<div style="color:red;font-size:1rem;line-height:1.5;white-space:pre-wrap;word-break:break-all;">${text}</div>`;
            setTimeout(() => {
              sessionStorage.setItem('from_notice', '1');
              window.location.href = '../../index.html';
            }, 3000);
            observer.disconnect();
          }
        });
      }, { threshold: 0.1 });
      observer.observe(commentsSection);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('noticeList')) renderNoticeList();
  if (document.getElementById('noticeDetail')) renderNoticeDetail();
});

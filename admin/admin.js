// This UI is served exclusively by the loopback content manager.
const csrf = document.querySelector('meta[name="admin-token"]').content
const adminBase = new URL('.', import.meta.url).pathname.replace(/\/$/, '')
const content = document.querySelector('#content')
const notice = document.querySelector('#notice')
const names = { public: '公开', draft: '草稿', hidden: '隐藏' }
const phases = { idle: '尚未发布', building: '本地构建中', committing: '正在创建提交', pushing: '正在推送', deploying: '等待线上部署', complete: '线上部署成功', failed: '操作失败', unknown: '已推送，部署待确认' }
const localPhases = { idle: '尚未发布', building: '本地构建中', complete: '本地博客已更新', failed: '本地发布失败' }
let page = 'posts'
let posts = []
let albums = []
let item
let kind
let dirty = false
let busy = false
let snapshot
let jobTimer
let dragged
let resources = []
let mediaLimit = 36
let photoPage = 0
const pickedMedia = new Set()
const selected = new Set()
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' })[char])
const date = value => value ? String(value).slice(0, 10) : ''
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const badge = status => `<span class="status ${escape(status)}">${names[status] || '内容错误'}</span>`
const media = src => escape(src)
const input = (name, label, value = '', type = 'text', extra = '') => `<label>${label}<input name="${name}" type="${type}" value="${escape(value)}" ${extra}></label>`
const option = (value, label, active) => `<option value="${value}" ${value === active ? 'selected' : ''}>${label}</option>`
const statusSelect = status => `<label>内容状态<select name="status">${Object.entries(names).map(([value, label]) => option(value, label, status)).join('')}</select></label>`
const langSelect = lang => `<label>语言<select name="lang">${option('', '所有语言', lang)}${option('zh', '中文', lang)}${option('en', 'English', lang)}</select></label>`
function message(text, error = false) {
  notice.hidden = !text
  notice.textContent = text
  notice.classList.toggle('error', error)
}
async function api(path, data) {
  const response = await fetch(`${adminBase}${path}`, { method: data === undefined ? 'GET' : 'POST', headers: { 'x-csrf-token': csrf, ...(data === undefined ? {} : { 'Content-Type': 'application/json' }) }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) })
  const result = await response.json()
  if (!response.ok)
    throw new Error(result.error || '操作失败')
  return result
}
function heading(title, sub, action = '') {
  return `<div class="page-heading"><div><p class="eyebrow">LOCAL CONTENT STUDIO</p><h1>${title}</h1><p class="subtitle">${sub}</p></div>${action}</div>`
}
function setDirty(value) {
  dirty = value
  const state = document.querySelector('#save-state')
  if (state)
    state.textContent = value ? '有未保存的修改' : '已保存在本地 · 博客需另行发布'
}
let answerConfirmation
function ask(text) {
  const dialog = document.querySelector('#confirm-dialog')
  document.querySelector('#confirm-text').textContent = text
  dialog.showModal()
  return new Promise((resolve) => {
    answerConfirmation = resolve
  })
}
document.querySelector('#confirm-dialog').addEventListener('click', (event) => {
  const button = event.target.closest('[data-confirm]')
  if (!button)
    return
  document.querySelector('#confirm-dialog').close()
  answerConfirmation?.(button.dataset.confirm === 'yes')
})
document.querySelector('#confirm-dialog').addEventListener('cancel', () => answerConfirmation?.(false))
async function canLeave() {
  return !dirty || await ask('有未保存的修改。确定离开并放弃这些修改吗？')
}
async function navigate(next) {
  if (!await canLeave())
    return
  page = next
  item = undefined
  kind = undefined
  dirty = false
  selected.clear()
  clearTimeout(jobTimer)
  document.querySelectorAll('[data-nav]').forEach(button => button.classList.toggle('active', button.dataset.nav === page))
  document.querySelector('#breadcrumb').textContent = `内容 / ${{ posts: '文章', albums: '相册', media: '媒体库', publish: '发布中心', history: '本地备份' }[page]}`
  message('')
  content.innerHTML = '<p class="loading">正在读取本地内容…</p>'
  if (page === 'posts') {
    posts = await api('/api/posts')
    document.querySelector('#posts-count').textContent = posts.length
    renderPosts()
  }
  else if (page === 'albums') {
    albums = await api('/api/albums')
    document.querySelector('#albums-count').textContent = albums.length
    renderAlbums()
  }
  else if (page === 'publish') {
    await renderPublish()
  }
  else if (page === 'media') {
    resources = await api('/api/media')
    mediaLimit = 36
    renderMediaLibrary()
  }
  else {
    await renderHistory()
  }
}
function renderPosts() {
  const search = document.querySelector('#search')?.value || ''
  const filter = document.querySelector('#filter')?.value || ''
  content.innerHTML = `${heading('文章', '写下想法，留住思考。保存修改后，在发布中心同步到博客。', '<button class="primary" data-action="new-post">＋ 新建文章</button>')}
    <div class="toolbar"><input id="search" type="search" placeholder="搜索标题、标签或文件路径" value="${escape(search)}" aria-label="搜索文章"><select id="filter" aria-label="筛选内容状态">${option('', '全部状态', filter)}${Object.entries(names).map(([v, l]) => option(v, l, filter)).join('')}</select><button class="secondary" data-action="refresh">刷新</button></div><div id="batch"></div><div id="post-table"></div>`
  updatePostTable()
}
function updatePostTable() {
  const query = document.querySelector('#search').value.toLowerCase()
  const filter = document.querySelector('#filter').value
  const visible = posts.filter(post => (!filter || post.status === filter) && `${post.id} ${post.data?.title} ${(post.data?.tags || []).join(' ')}`.toLowerCase().includes(query))
    .sort((a, b) => String(b.data?.published || '').localeCompare(String(a.data?.published || '')))
  document.querySelector('#batch').innerHTML = selected.size ? `<div class="batch">已选 ${selected.size} 篇<button class="secondary" data-action="batch-public">设为公开</button><button class="secondary" data-action="batch-draft">设为草稿</button><button class="secondary" data-action="batch-hidden">隐藏</button></div>` : ''
  document.querySelector('#post-table').innerHTML = visible.length ? `<div class="table-wrap"><table><thead><tr><th><input type="checkbox" data-select-all aria-label="选择全部当前文章" ${visible.every(post => selected.has(post.id)) ? 'checked' : ''}></th><th>文章</th><th>状态</th><th>日期</th><th>操作</th></tr></thead><tbody>${visible.map(post => `<tr><td><input type="checkbox" data-select="${escape(post.id)}" aria-label="选择 ${escape(post.data?.title || post.id)}" ${selected.has(post.id) ? 'checked' : ''} ${post.error ? 'disabled' : ''}></td><td><button class="post-title" data-action="edit-post" data-id="${escape(post.id)}">${escape(post.data?.title || post.id)}</button><div class="file-path">${escape(post.error || post.id)}</div></td><td>${badge(post.status)}</td><td class="date">${date(post.data?.published)}</td><td><div class="row-actions"><button data-action="edit-post" data-id="${escape(post.id)}">编辑</button><button data-action="preview-post" data-id="${escape(post.id)}">预览</button>${!post.error ? `<button data-action="status-post" data-id="${escape(post.id)}" data-status="${post.status === 'public' ? 'hidden' : 'public'}">${post.status === 'public' ? '隐藏' : '公开'}</button>` : ''}</div></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">没有符合条件的文章。</div>'
}
async function openPost(id) {
  if (!await canLeave())
    return
  kind = 'post'
  item = id ? await api(`/api/post?id=${encodeURIComponent(id)}`) : { id: '', version: '', body: '', status: 'draft', data: { title: '', published: today(), updated: '', tags: [], description: '', pin: 0, lang: 'zh', toc: true, draft: true, hidden: false, abbrlink: '' } }
  renderPostEditor()
  setDirty(!id)
}
function renderPostEditor() {
  const d = item.data
  document.querySelector('#breadcrumb').textContent = `内容 / 文章 / ${item.id ? '编辑' : '新建'}`
  content.innerHTML = `${heading(item.id ? '编辑文章' : '新建文章', '正文使用 Markdown / MDX。预览前会先保存到本地。', `<div class="actions"><button class="secondary" data-action="back">返回列表</button><button class="secondary" data-action="preview-editor">保存并预览 ↗</button><button class="primary" data-action="save">保存文章</button></div>`)}
    <form id="editor-form"><fieldset><div class="editor-grid"><div><div class="panel">${input('title', '标题', d.title, 'text', 'class="edit-title" required')}${input('id', '文件路径（相对于 src/content/posts）', item.id, 'text', `${item.id ? 'readonly' : ''} placeholder="生活/我的第一篇文章.md" required`)}<div class="drop-zone"><label for="post-image-files">上传正文图片（PicGo → 腾讯云 COS）</label><p>仅将图片链接插入正文。照片每张最多 15 MB；同名照片 + MOV/MP4 自动配对 Live（视频最大 40 MB、30 秒）。</p><input id="post-image-files" type="file" accept="image/*,.heic,.heif,.tiff,.mov,.mp4" multiple></div><div class="actions media-tools"><button type="button" class="secondary" data-action="media-picker">从媒体库插入</button><button type="button" class="secondary" data-action="photo-row">将选中照片排为一组</button></div><label>正文<textarea class="body-editor" name="body" spellcheck="false">${escape(item.body)}</textarea></label></div></div><div><div class="panel">${statusSelect(item.status)}${input('published', '发布日期', date(d.published), 'date', 'required')}${input('updated', '更新日期', date(d.updated), 'date')}${langSelect(d.lang)}${input('pin', '置顶优先级（0 为不置顶）', d.pin || 0, 'number', 'min="0" max="99"')}<label class="checkbox-label"><input type="checkbox" name="toc" ${d.toc ? 'checked' : ''}>显示目录</label></div><div class="panel"><label>摘要<textarea name="description" rows="4">${escape(d.description)}</textarea></label>${input('tags', '标签（逗号分隔，保留原有顺序）', d.tags.join(', '))}${input('abbrlink', '短链接', d.abbrlink, 'text', 'placeholder="my-first-post"')}<p class="helper">草稿和隐藏内容只在私有预览中显示。调整已有短链接会改变访问地址。</p></div><p id="save-state" class="save-state"></p></div></div></fieldset></form>`
}
function collectPost() {
  const f = new FormData(document.querySelector('#editor-form'))
  const status = String(f.get('status'))
  return { id: String(f.get('id')).trim(), version: item.version, body: String(f.get('body')), data: { title: String(f.get('title')), published: String(f.get('published')), updated: String(f.get('updated')), description: String(f.get('description')), tags: String(f.get('tags')).split(/[,，]/).map(tag => tag.trim()).filter(Boolean), pin: Number(f.get('pin')), lang: String(f.get('lang')), abbrlink: String(f.get('abbrlink')).trim(), toc: f.has('toc'), draft: status === 'draft', hidden: status === 'hidden' } }
}
function renderAlbums() {
  content.innerHTML = `${heading('相册', '把生活的片刻，收进相册。', '<button class="primary" data-action="new-album">＋ 新建相册</button>')}${albums.length
    ? `<div class="album-list">${albums.map((album) => {
      const cover = album.data.photos.find(photo => photo.id === album.data.cover && !photo.hidden) || album.data.photos.find(photo => !photo.hidden)
      return `<article class="album-card"><div class="album-cover">${cover ? `<img src="${media(cover.src)}" alt="${escape(album.data.title)}" loading="lazy">` : '▧'}</div><div class="album-card-info">${badge(album.status)}<h2>${escape(album.data.title)}</h2><p class="subtitle">${escape(album.data.description.slice(0, 80))}</p><div class="album-card-footer"><span class="date">${date(album.data.published)} · ${album.data.photos.length} 张</span><div class="row-actions"><button data-action="edit-album" data-id="${album.id}">管理</button><button data-action="preview-album" data-id="${album.id}">预览</button></div></div></div></article>`
    }).join('')}</div>`
    : '<div class="panel empty"><div class="empty-symbol">▧</div><h2>让照片有一个归处</h2><p>新建相册，导入照片，排列你想保留的片刻。</p><button class="primary" data-action="new-album">创建第一个相册</button></div>'}`
}
async function openAlbum(id) {
  if (!await canLeave())
    return
  kind = 'album'
  photoPage = 0
  item = id ? await api(`/api/album?id=${encodeURIComponent(id)}`) : { id: '', version: '', status: 'draft', data: { slug: `album-${today().replaceAll('-', '')}-${crypto.randomUUID().slice(0, 8)}`, title: '', description: '', published: today(), lang: '', tags: [], order: 0, cover: '', photos: [], draft: true, hidden: false } }
  renderAlbumEditor()
  setDirty(!id)
}
function renderAlbumEditor() {
  const d = item.data
  document.querySelector('#breadcrumb').textContent = `内容 / 相册 / ${item.id ? d.title : '新建'}`
  content.innerHTML = `${heading(item.id ? '管理相册' : '新建相册', '拖拽调整顺序，或使用照片旁的上下按钮。', '<div class="actions"><button class="secondary" data-action="back">返回列表</button><button class="secondary" data-action="preview-editor">保存并预览 ↗</button><button class="primary" data-action="save">保存相册</button></div>')}
    <form id="editor-form"><fieldset><div class="editor-grid"><div><div class="panel"><div class="form-grid">${input('title', '相册标题', d.title, 'text', 'required')}${input('slug', '相册标识', d.slug, 'text', `${item.id ? 'readonly' : ''} placeholder="spring-walk" pattern="[a-z0-9]+(-[a-z0-9]+)*" required`)}</div><p class="helper">相册标识用于访问地址，已自动生成；仅支持小写英文字母、数字和连字符。</p><label>相册简介<textarea name="description" rows="3">${escape(d.description)}</textarea></label></div><div class="panel"><h2>照片</h2><div class="drop-zone"><label for="photo-files">选择照片并上传到腾讯云 COS</label><p>通过本机 PicGo 上传。照片最大 15 MB；读取摄影参数后校正方向、压缩、移除原文件 EXIF，博客只保存链接和参数。选择同名照片 + MOV/MP4 可自动配对 Live，视频最大 40 MB、30 秒。</p><input id="photo-files" type="file" accept="image/*,.heic,.heif,.tiff,.mov,.mp4" multiple><p>填写相册标题即可选择照片，系统会先自动保存相册。</p><button type="button" class="secondary" data-action="check-picgo">检查 PicGo 服务</button><p id="picgo-state">请保持 PicGo 开启，默认图床设为腾讯云 COS。</p></div><div class="panel"><h3>已有图片链接</h3>${input('photo-url', 'COS / 图床图片链接', '', 'url', 'placeholder="https://…/photo.webp"')}${input('photo-link-title', '照片标题（可选）')}<button type="button" class="secondary" data-action="add-photo-link">添加图片链接</button></div><div class="actions media-tools"><button type="button" class="secondary" data-action="media-picker">从媒体库添加</button></div><div id="photo-list" class="photo-list"></div></div></div><div><div class="panel">${statusSelect(item.status)}${input('published', '相册日期', date(d.published), 'date', 'required')}${langSelect(d.lang)}${input('order', '排序优先级（越大越靠前）', d.order, 'number')}${input('tags', '标签（逗号分隔）', d.tags.join(', '))}<p class="helper">隐藏封面照片后，公开页面会使用第一张可见照片。没有可见照片的相册不会出现在公开列表。</p></div><p id="save-state" class="save-state"></p></div></div></fieldset></form>`
  renderPhotos()
}
function renderPhotos() {
  photoPage = Math.max(0, Math.min(photoPage, Math.ceil(item.data.photos.length / 12) - 1))
  const pages = Math.max(1, Math.ceil(item.data.photos.length / 12))
  const pager = item.data.photos.length > 12 ? `<div class="actions"><button type="button" class="secondary" data-action="photos-prev" ${photoPage === 0 ? 'disabled' : ''}>上一页</button><label>第 <input id="photo-page" aria-label="照片页码" type="number" min="1" max="${pages}" value="${photoPage + 1}" style="width:75px"> / ${pages} 页 · ${item.data.photos.length} 张</label><button type="button" class="secondary" data-action="photos-next" ${photoPage === pages - 1 ? 'disabled' : ''}>下一页</button></div>` : ''
  const cards = item.data.photos.slice(photoPage * 12, photoPage * 12 + 12).map((photo, offset) => [photo, photoPage * 12 + offset]).map(([photo, index]) => `<article class="photo-editor ${photo.hidden ? 'hidden-photo' : ''}" draggable="true" data-photo-index="${index}"><img src="${media(photo.src)}" alt="${escape(photo.alt || photo.title)}" loading="lazy" draggable="false"><div class="photo-editor-body"><div class="photo-editor-header"><span>⠿ 照片 ${index + 1}</span><span>${photo.hidden ? '已隐藏' : '可见'}</span></div>${['src', 'title', 'alt', 'description', 'taken', 'live'].map(field => `<label>${({ src: '图片链接', title: '标题', alt: '替代文本', description: '说明', taken: '拍摄日期', live: 'Live 视频链接（可选，HTTPS）' })[field]}<input data-photo-field="${field}" data-index="${index}" type="${field === 'taken' ? 'date' : ['src', 'live'].includes(field) ? 'url' : 'text'}" value="${escape(photo[field])}"></label>`).join('')}${photoParameterEditor(photo, index)}<label class="live-upload">制作 / 替换 Live（可截取）<input type="file" data-live-index="${index}" accept=".mov,.mp4,video/mp4,video/quicktime"></label><div class="photo-actions"><label class="checkbox-label"><input type="radio" name="cover" value="${photo.id}" ${item.data.cover === photo.id ? 'checked' : ''}>封面</label><label class="checkbox-label"><input type="checkbox" data-photo-field="hidden" data-index="${index}" ${photo.hidden ? 'checked' : ''}>隐藏</label><div class="photo-order"><button type="button" data-action="photo-up" data-index="${index}" aria-label="照片 ${index + 1} 上移" ${index === 0 ? 'disabled' : ''}>↑</button><button type="button" data-action="photo-down" data-index="${index}" aria-label="照片 ${index + 1} 下移" ${index === item.data.photos.length - 1 ? 'disabled' : ''}>↓</button></div></div></div></article>`).join('') || '<p class="helper">还没有照片，导入后会在这里显示。</p>'
  document.querySelector('#photo-list').innerHTML = (pager ? `<div class="photo-pagination">${pager}</div>` : '') + cards
}
function collectAlbum() {
  const f = new FormData(document.querySelector('#editor-form'))
  const status = String(f.get('status'))
  return { id: item.id || String(f.get('slug')).trim(), version: item.version, data: { ...item.data, slug: String(f.get('slug')).trim(), title: String(f.get('title')), description: String(f.get('description')), published: String(f.get('published')), order: Number(f.get('order')), tags: String(f.get('tags')).split(/[,，]/).map(tag => tag.trim()).filter(Boolean), lang: String(f.get('lang')), cover: String(f.get('cover') || item.data.cover), draft: status === 'draft', hidden: status === 'hidden' } }
}
async function saveEditor() {
  const form = document.querySelector('#editor-form')
  if (!form.reportValidity())
    throw new Error('请补全必填字段')
  const payload = kind === 'post' ? collectPost() : collectAlbum()
  const fieldset = form.querySelector('fieldset')
  fieldset.disabled = true
  try {
    item = await api(`/api/${kind}`, payload)
  }
  finally {
    fieldset.disabled = false
  }
  kind === 'post' ? renderPostEditor() : renderAlbumEditor()
  setDirty(false)
  message('已保存在本地。需要上线时，请到发布中心发布。')
  return item
}
async function preview(type, id) {
  // Open immediately during the click to avoid pop-up blocking during Astro startup.
  const windowRef = window.open('about:blank', '_blank')
  if (windowRef)
    windowRef.opener = null
  message('正在准备私有预览，首次启动可能需要几秒…')
  try {
    const result = await api('/api/preview', { kind: type, id })
    if (windowRef)
      windowRef.location.replace(result.url)
    else
      message('预览已准备好，请允许此页面打开新窗口后重试。')
    if (windowRef)
      message('已打开私有预览。草稿和隐藏内容只在本机可见。')
  }
  catch (error) {
    windowRef?.close()
    throw error
  }
}
const photographicFields = { camera: '相机', lens: '镜头', focalLength: '焦距', aperture: '光圈', shutter: '快门', iso: 'ISO', exposure: '曝光补偿', location: '地点（手动填写）' }
function photoParameterEditor(photo, index) {
  return `<details class="photo-metadata"><summary>摄影参数 · ${photo.metadata?.camera ? escape(photo.metadata.camera) : '可自动读取 / 手动补充'}</summary><div class="form-grid">${Object.entries(photographicFields).map(([field, label]) => `<label>${label}<input data-photo-meta="${field}" data-index="${index}" value="${escape(photo.metadata?.[field] || '')}" maxlength="${['camera', 'lens', 'location'].includes(field) ? 200 : 60}"></label>`).join('')}</div></details>`
}
const isVideo = file => /\.(?:mov|mp4)$/i.test(file.name)
const fileStem = file => file.name.replace(/\.[^.]+$/, '').normalize('NFC').toLowerCase()
function encodeImage(file, video = false) {
  const limit = video ? 40 : 15
  if (!file.size || file.size > limit * 1024 * 1024)
    throw new Error(`${video ? '视频' : '图片'}不能为空，且最大 ${limit} MB`)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}
async function importFiles(files) {
  if (!files.length)
    return
  const picgo = await api('/api/picgo')
  if (!picgo.available)
    throw new Error('无法连接 PicGo，请开启本机 PicGo 服务（36677），并将默认图床设为腾讯云 COS。')
  await saveEditor()
  document.querySelector('#editor-form fieldset').disabled = true
  const failed = []
  const photos = files.filter(file => !isVideo(file))
  const videos = files.filter(isVideo)
  let imported = 0
  for (let index = 0; index < photos.length; index++) {
    const file = photos[index]
    message(`正在通过 PicGo 上传 ${index + 1} / ${photos.length}：${file.name}`)
    try {
      item = await api('/api/import', { id: item.id, version: item.version, name: file.name, image: await encodeImage(file) })
      imported++
      const video = videos.find(video => fileStem(video) === fileStem(file))
      if (video) {
        message(`照片已上传，正在处理 Live 视频：${video.name}`)
        try {
          item = await api('/api/import-live', { id: item.id, version: item.version, photoId: item.data.photos.at(-1).id, video: await encodeImage(video, true) })
        }
        catch (error) { failed.push(`${video.name}（照片已保留）：${error.message}`) }
      }
    }
    catch (error) { failed.push(`${file.name}：${error.message}`) }
  }
  videos.filter(video => !photos.some(photo => fileStem(photo) === fileStem(video))).forEach(video => failed.push(`${video.name}：未找到同名照片，请从对应照片的「上传 Live 视频」添加。`))
  renderAlbumEditor()
  setDirty(false)
  message(`已导入 ${imported} 张照片。${failed.length ? `\n${failed.join('\n')}` : '摄影参数已读取，可展开参数修改。'}`, failed.length > 0)
}
async function importSingleLive(index, file) {
  if (!file)
    return
  const clip = await chooseLiveClip(file)
  if (!clip)
    return
  const photoId = item.data.photos[index].id
  await saveEditor()
  document.querySelector('#editor-form fieldset').disabled = true
  try {
    message(`正在转码并上传 Live：${file.name}`)
    item = await api('/api/import-live', { id: item.id, version: item.version, photoId, video: await encodeImage(file, true), ...clip })
    renderAlbumEditor()
    setDirty(false)
    message('Live 视频已保存。可在私有预览中播放。')
  }
  finally { document.querySelector('#editor-form fieldset').disabled = false }
}
function photoDirective(image, live = '') {
  const fields = { src: image.src, title: image.title, description: image.description, width: image.width, height: image.height, taken: image.taken, ...image.metadata, ...((live || image.live) ? { live: live || image.live } : {}) }
  const quote = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('\n', '&#10;')
  return `::photo{${Object.entries(fields).filter(([, value]) => value !== undefined && value !== '').map(([key, value]) => `${key}="${quote(value)}"`).join(' ')}}`
}
async function importPostImages(files) {
  if (!files.length)
    return
  const textarea = document.querySelector('textarea[name="body"]')
  const fieldset = document.querySelector('#editor-form fieldset')
  fieldset.disabled = true
  const failed = []
  const photos = files.filter(file => !isVideo(file))
  const videos = files.filter(isVideo)
  let imported = 0
  try {
    for (let index = 0; index < photos.length; index++) {
      const file = photos[index]
      message(`正在通过 PicGo 上传正文照片 ${index + 1} / ${photos.length}：${file.name}`)
      try {
        const image = await api('/api/upload-image', { name: file.name, image: await encodeImage(file) })
        let live = ''
        const video = videos.find(video => fileStem(video) === fileStem(file))
        if (video) {
          try {
            live = (await api('/api/upload-video', { video: await encodeImage(video, true) })).src
          }
          catch (error) { failed.push(`${video.name}：${error.message}`) }
        }
        textarea.setRangeText(`\n${photoDirective(image, live)}\n`, textarea.selectionStart, textarea.selectionEnd, 'end')
        imported++
        setDirty(true)
      }
      catch (error) { failed.push(`${file.name}：${error.message}`) }
    }
    videos.filter(video => !photos.some(photo => fileStem(photo) === fileStem(video))).forEach(video => failed.push(`${video.name}：未找到同名照片。`))
  }
  finally {
    fieldset.disabled = false
    document.querySelector('#post-image-files').value = ''
  }
  message(`已插入 ${imported} 张照片的链接和参数，请保存文章。${failed.length ? `\n${failed.join('\n')}` : ''}`, failed.length > 0)
}
function renderMediaLibrary() {
  content.innerHTML = `${heading('媒体库', `${resources.length} 张照片 · 使用已有链接，无需重复上传。`, '<button class="secondary" data-action="refresh">刷新</button>')}<div class="toolbar"><input id="media-search" type="search" placeholder="搜索照片、相册或文章" aria-label="搜索媒体库"><label class="checkbox-label"><input id="media-live" type="checkbox">仅 Live</label></div><div id="media-grid" class="media-grid"></div>`
  renderMediaCards(false)
}
function renderMediaCards(picker) {
  const prefix = picker ? 'picker' : 'media'
  const search = document.querySelector(`#${prefix}-search`).value.toLowerCase()
  const live = document.querySelector(`#${prefix}-live`).checked
  const visible = resources.filter(photo => (!live || photo.live) && `${photo.title} ${photo.metadata?.camera || ''} ${photo.uses.map(use => use.title).join(' ')}`.toLowerCase().includes(search))
  const label = photo => photo.title || '未命名照片'
  document.querySelector(`#${prefix}-grid`).innerHTML = visible.slice(0, mediaLimit).map(photo => `<article class="media-card ${pickedMedia.has(photo.key) ? 'picked' : ''}">${picker ? `<label class="media-pick"><input type="checkbox" data-media-key="${photo.key}" aria-label="选择 ${escape(label(photo))}" ${pickedMedia.has(photo.key) ? 'checked' : ''}>` : ''}<img src="${media(photo.src)}" alt="${escape(label(photo))}" loading="lazy">${picker ? '</label>' : ''}<div class="media-card-info"><h3 title="${escape(label(photo))}">${escape(label(photo))}</h3><p>${photo.width && photo.height ? `${photo.width} × ${photo.height}` : '远程图片'}${photo.live ? ' · LIVE' : ''}</p><p>${photo.uses.map(use => `${escape(use.title)} · ${names[use.status] || use.status}`).join('<br>')}</p>${!picker ? `<button type="button" class="text-button" data-action="media-copy" data-key="${photo.key}">复制图片链接</button>` : ''}</div></article>`).join('') || '<p class="helper">没有匹配的照片。</p>'
  if (visible.length > mediaLimit)
    document.querySelector(`#${prefix}-grid`).insertAdjacentHTML('beforeend', `<button type="button" class="secondary media-more" data-action="media-more" data-picker="${picker}">加载更多（${visible.length - mediaLimit}）</button>`)
  if (picker)
    document.querySelector('#picker-count').textContent = `已选 ${pickedMedia.size} 张`
}
async function openMediaPicker() {
  resources = await api('/api/media')
  mediaLimit = 36
  pickedMedia.clear()
  document.querySelector('#picker-search').value = ''
  document.querySelector('#picker-live').checked = false
  renderMediaCards(true)
  document.querySelector('#media-dialog').showModal()
}
function insertMedia() {
  const photos = resources.filter(photo => pickedMedia.has(photo.key))
  if (!photos.length)
    throw new Error('请先选择照片')
  if (kind === 'post') {
    const textarea = document.querySelector('textarea[name="body"]')
    const markup = photos.map(photo => photoDirective(photo)).join('\n\n')
    textarea.setRangeText(`\n${photos.length > 1 ? `:::photos\n${markup}\n:::` : markup}\n`, textarea.selectionStart, textarea.selectionEnd, 'end')
  }
  else {
    if (item.data.photos.length + photos.length > 5000)
      throw new Error('单个相册最多 5000 张照片')
    for (const photo of photos) {
      const { key: _key, uses: _uses, ...data } = photo
      item.data.photos.push({ ...data, id: `photo-${crypto.randomUUID()}`, hidden: false })
    }
    item.data.cover ||= item.data.photos[0].id
    renderPhotos()
  }
  document.querySelector('#media-dialog').close()
  setDirty(true)
  message(`已插入 ${photos.length} 张照片，参数与 Live 链接已保留，请保存。`)
}
function chooseLiveClip(file) {
  if (!file.size || file.size > 40 * 1024 * 1024)
    throw new Error('视频不能为空，且最大 40 MB')
  const dialog = document.querySelector('#live-dialog')
  const video = document.querySelector('#clip-video')
  const start = document.querySelector('#clip-start')
  const end = document.querySelector('#clip-end')
  const state = document.querySelector('#clip-state')
  const signal = new AbortController()
  const url = URL.createObjectURL(file)
  start.value = '0'
  end.value = '3'
  state.textContent = file.name
  video.src = url
  video.muted = true
  let previewing = false
  return new Promise((resolve) => {
    const finish = (value) => {
      signal.abort()
      video.pause()
      video.removeAttribute('src')
      video.load()
      URL.revokeObjectURL(url)
      dialog.close()
      resolve(value)
    }
    const range = () => {
      const clip = { start: Number(start.value), end: Number(end.value) }
      if (!start.value || !end.value || !start.checkValidity() || !end.checkValidity() || clip.end <= clip.start || clip.end - clip.start > 30 || (Number.isFinite(video.duration) && clip.end > video.duration + 0.05)) {
        state.textContent = '请选择视频内有效的起止时间，片段最长 30 秒。'
        return
      }
      return clip
    }
    video.addEventListener('loadedmetadata', () => {
      const duration = video.duration
      if (Number.isFinite(duration)) {
        end.value = String(Math.min(3, duration))
        state.textContent = `${file.name} · ${duration.toFixed(2)} 秒`
      }
    }, { signal: signal.signal })
    video.addEventListener('error', () => {
      state.textContent = '此浏览器无法预览该格式，可手动填写起止时间。服务器会转为 MP4。'
    }, { signal: signal.signal })
    video.addEventListener('timeupdate', () => {
      if (previewing && video.currentTime >= Number(end.value)) {
        video.pause()
        previewing = false
      }
    }, { signal: signal.signal })
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault()
      finish(null)
    }, { signal: signal.signal })
    dialog.addEventListener('click', async (event) => {
      const action = event.target.closest('[data-clip]')?.dataset.clip
      if (action === 'cancel')
        return finish(null)
      if (action === 'confirm' || action === 'preview') {
        const clip = range()
        if (!clip)
          return
        if (action === 'confirm')
          return finish(clip)
        video.currentTime = clip.start
        previewing = true
        try {
          await video.play()
        }
        catch { state.textContent = '视频无法在此浏览器播放，仍可截取并上传。' }
      }
    }, { signal: signal.signal })
    dialog.showModal()
  })
}
async function renderPublish() {
  const [next, state, local] = await Promise.all([api('/api/changes'), api('/api/publish'), api('/api/site')])
  snapshot = next
  const managed = snapshot.files.filter(file => file.managed)
  const others = snapshot.files.filter(file => !file.managed)
  content.innerHTML = `${heading('发布中心', '保存修改后，可构建本地博客；GitHub Pages 发布会另外提交并推送。', '<button class="secondary" data-action="refresh">刷新状态</button>')}
    ${local.enabled ? `<div class="panel"><h2>本地博客</h2><p class="helper">将当前公开内容构建并更新到本机博客。草稿、隐藏文章与隐藏照片不会公开；无需 Git 提交或远端认证。</p><div class="actions"><button class="primary" data-action="local-publish" ${local.building || state.publishing ? 'disabled' : ''}>${local.building ? '正在构建本地博客…' : '发布到本地'}</button><a class="deployment-link" href="${escape(local.url)}" target="_blank" rel="noopener noreferrer">打开博客 ↗</a></div><p>${localPhases[local.phase] || local.phase}${local.publishedAt ? ` · ${escape(new Date(local.publishedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }))}` : ''}</p>${local.error ? `<p class="status error">${escape(local.error)}</p>` : ''}<details><summary>本地构建日志</summary><pre>${escape(local.logs || '构建日志会显示在这里。')}</pre></details></div>` : ''}
    <div class="stats"><div class="stat"><span>待发布文件</span><strong>${managed.length}</strong></div><div class="stat"><span>当前分支</span><strong>${escape(snapshot.branch || '游离 HEAD')}</strong></div><div class="stat"><span>发布状态</span><p>${phases[state.phase] || state.phase}</p></div></div>
    <div class="panel"><h2>GitHub Pages</h2><p class="helper">提交全部待发布内容，推送到远端 main，并跟踪 GitHub Pages 部署结果。</p>${managed.length ? `<ul class="change-list">${managed.map(file => `<li><span class="change-type">${escape(file.status)}</span>${escape(file.path)}</li>`).join('')}</ul>` : '<p class="helper">没有待发布的内容修改。</p>'}${state.remoteAuthenticationRequired ? '<p class="status error">当前服务没有读取到 GitHub 凭据，请使用 pnpm local 重新启动。</p>' : ''}<div class="actions"><button class="primary" data-action="review-publish" ${!managed.length || state.publishing || local.building || state.remoteAuthenticationRequired ? 'disabled' : ''}>推送并部署 ${managed.length ? `(${managed.length})` : ''}</button>${state.canRetryPush ? '<button class="secondary" data-action="retry-push">重试推送已有提交</button>' : ''}</div><p class="helper">本地领先 ${snapshot.ahead} 个提交，落后 ${snapshot.behind} 个提交。发布前将重新检查远端。</p></div>
    ${others.length ? `<details class="panel"><summary>其他工作区修改 (${others.length})</summary><p class="helper">这些文件不会由管理台提交。若涉及功能代码，需要先提交并推送，才能发布内容。</p><ul class="change-list">${others.map(file => `<li class="excluded"><span>${escape(file.status)}</span>${escape(file.path)}</li>`).join('')}</ul></details>` : ''}
    <div class="panel"><h2>最近一次发布</h2><p>${phases[state.phase] || state.phase}</p>${state.commit ? `<p class="file-path">提交 ${escape(state.commit)}</p>` : ''}${state.error ? `<p class="status error">${escape(state.error)}</p>` : ''}${state.deploymentURL ? `<p><a class="deployment-link" href="${escape(state.deploymentURL)}" target="_blank" rel="noopener noreferrer">查看 GitHub Actions ↗</a></p>` : ''}<pre>${escape(state.logs || '发布日志会显示在这里。')}</pre></div>`
  clearTimeout(jobTimer)
  if (local.building || state.publishing || ['deploying', 'unknown'].includes(state.phase)) {
    jobTimer = setTimeout(() => {
      if (page === 'publish')
        renderPublish().catch(error => message(error.message, true))
    }, local.building ? 2000 : 10000)
  }
}
async function renderHistory() {
  const backups = await api('/api/backups')
  content.innerHTML = `${heading('本地备份', '每次覆盖保存前保留旧版本。恢复后需要重新发布才能影响线上。', '<button class="secondary" data-action="refresh">刷新</button>')}${backups.length ? `<div class="table-wrap"><table><thead><tr><th>文件</th><th>备份时间</th><th>操作</th></tr></thead><tbody>${backups.map(backup => `<tr><td class="file-path">${escape(backup.path)}</td><td class="date">${escape(new Date(backup.at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }))}</td><td><button class="text-button" data-action="restore" data-id="${backup.id}" data-path="${escape(backup.path)}">恢复此版本</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="panel empty">暂时没有备份。编辑并保存已有内容后，会自动保留旧版本。</div>'}`
}
async function act(button) {
  const action = button.dataset.action
  const id = button.dataset.id
  if (action === 'media-picker')
    return openMediaPicker()
  if (action === 'media-cancel')
    return document.querySelector('#media-dialog').close()
  if (action === 'media-use')
    return insertMedia()
  if (action === 'media-more') {
    mediaLimit += 36
    return renderMediaCards(button.dataset.picker === 'true')
  }
  if (action === 'media-copy') {
    await navigator.clipboard.writeText(resources.find(photo => photo.key === button.dataset.key).src)
    return message('图片链接已复制。')
  }
  if (action === 'photo-row') {
    const textarea = document.querySelector('textarea[name="body"]')
    const selection = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)
    if (!selection.trim())
      throw new Error('请先在正文中选中要排列的图片或 photo 指令。')
    textarea.setRangeText(`\n:::photos\n${selection.trim()}\n:::\n`, textarea.selectionStart, textarea.selectionEnd, 'end')
    return setDirty(true)
  }
  if (action === 'check-picgo') {
    const state = await api('/api/picgo')
    document.querySelector('#picgo-state').textContent = state.available ? 'PicGo 服务可用。请确认默认图床为腾讯云 COS。' : '连接失败。请开启 PicGo 服务，确认端口为 36677。'
    return
  }
  if (action === 'add-photo-link') {
    const src = document.querySelector('[name="photo-url"]').value.trim()
    const title = document.querySelector('[name="photo-link-title"]').value.trim()
    if (!/^https:\/\//i.test(src))
      throw new Error('请填写完整的 HTTPS 图片链接')
    await saveEditor()
    item = await api('/api/photo-link', { id: item.id, version: item.version, src, title })
    renderAlbumEditor()
    setDirty(false)
    return message('图片链接已保存。发布到本地后即可在博客查看。')
  }
  if (action === 'new-post')
    return openPost()
  if (action === 'new-album')
    return openAlbum()
  if (action === 'edit-post')
    return openPost(id)
  if (action === 'edit-album')
    return openAlbum(id)
  if (action === 'back' || action === 'refresh')
    return navigate(page)
  if (action === 'save')
    return saveEditor()
  if (action === 'preview-post' || action === 'preview-album')
    return preview(action === 'preview-post' ? 'post' : 'album', id)
  if (action === 'home-preview')
    return preview('home', '')
  if (action === 'preview-editor') {
    const popup = window.open('about:blank', '_blank')
    try {
      await saveEditor()
      message('正在准备私有预览…')
      const result = await api('/api/preview', { kind, id: item.id })
      if (popup)
        popup.location.replace(result.url)
      else
        throw new Error('请允许管理台打开新窗口后重试')
      message('已打开私有预览。')
    }
    catch (error) {
      popup?.close()
      throw error
    }
    return
  }
  if (action === 'status-post') {
    const post = posts.find(post => post.id === id)
    await api('/api/status', { kind: 'post', id, version: post.version, status: button.dataset.status })
    await navigate('posts')
    return message('内容状态已保存，博客需在发布中心发布后生效。')
  }
  if (action.startsWith('batch-')) {
    const targets = posts.filter(post => selected.has(post.id))
    let saved = 0
    try {
      for (const post of targets) {
        await api('/api/status', { kind: 'post', id: post.id, version: post.version, status: action.slice(6) })
        saved++
      }
    }
    finally {
      await navigate('posts')
      message(`已更新 ${saved} 篇文章。博客需另行发布。`)
    }
    return
  }
  if (action === 'photos-prev' || action === 'photos-next') {
    photoPage += action === 'photos-prev' ? -1 : 1
    renderPhotos()
    return
  }
  if (action === 'photo-up' || action === 'photo-down') {
    const index = Number(button.dataset.index)
    const next = index + (action === 'photo-up' ? -1 : 1)
    if (next < 0 || next >= item.data.photos.length)
      return
    const [photo] = item.data.photos.splice(index, 1)
    item.data.photos.splice(next, 0, photo)
    photoPage = Math.floor(next / 12)
    renderPhotos()
    return setDirty(true)
  }
  if (action === 'review-publish') {
    document.querySelector('#publish-review').innerHTML = `<ul class="change-list">${snapshot.files.filter(file => file.managed).map(file => `<li>${escape(file.path)}</li>`).join('')}</ul>`
    document.querySelector('#publish-dialog').showModal()
    return
  }
  if (action === 'local-publish') {
    await api('/api/local-publish', {})
    await renderPublish()
    return message('正在构建本地博客。成功后会自动切换到新版本。')
  }
  if (action === 'cancel-publish')
    return document.querySelector('#publish-dialog').close()
  if (action === 'confirm-publish') {
    document.querySelector('#publish-dialog').close()
    await api('/api/publish', { paths: snapshot.files.filter(file => file.managed).map(file => file.path), revision: snapshot.revision, message: document.querySelector('#commit-message').value })
    await renderPublish()
    return message('发布任务已开始。可以在下方查看构建、推送及部署状态。')
  }
  if (action === 'retry-push') {
    await api('/api/retry-push', {})
    return renderPublish()
  }
  if (action === 'restore') {
    const path = button.dataset.path
    if (!await ask(`将恢复「${path}」到此备份版本。当前版本会另存备份。确定恢复吗？`))
      return
    const isPost = path.startsWith('src/content/posts/')
    const contentId = isPost ? path.slice('src/content/posts/'.length) : path.slice('src/content/albums/'.length).replace(/\.json$/, '')
    let current
    try {
      current = await api(`/api/${isPost ? 'post' : 'album'}?id=${encodeURIComponent(contentId)}`)
    }
    catch {
      throw new Error('当前文件无法读取，请先检查文件再恢复')
    }
    await api('/api/restore', { id, version: current.version })
    await renderHistory()
    message('已恢复本地版本，博客需另行发布。')
  }
}
document.addEventListener('click', async (event) => {
  const button = event.target.closest('button')
  if (!button || busy)
    return
  const nav = button.dataset.nav
  if (!nav && !button.dataset.action)
    return
  busy = true
  button.disabled = true
  try {
    nav ? await navigate(nav) : await act(button)
  }
  catch (error) {
    message(error.message, true)
  }
  finally {
    busy = false
    if (button.isConnected)
      button.disabled = false
  }
})
document.addEventListener('input', (event) => {
  if (event.target.id === 'photo-page')
    return
  if (['media-search', 'picker-search'].includes(event.target.id)) {
    mediaLimit = 36
    return renderMediaCards(event.target.id.startsWith('picker'))
  }
  if (event.target.id === 'search')
    return updatePostTable()
  // Choosing a file only opens a preview; imports mark content after success.
  if (event.target.type === 'file')
    return
  if (event.target.closest('#editor-form')) {
    const field = event.target.dataset.photoField
    const metadataField = event.target.dataset.photoMeta
    if (metadataField) {
      const photo = item.data.photos[Number(event.target.dataset.index)]
      photo.metadata ||= {}
      photo.metadata[metadataField] = event.target.value
    }
    if (field)
      item.data.photos[Number(event.target.dataset.index)][field] = field === 'hidden' ? event.target.checked : event.target.value
    setDirty(true)
  }
})
document.addEventListener('keydown', (event) => {
  if (event.target.id === 'photo-page' && event.key === 'Enter') {
    event.preventDefault()
    photoPage = Math.max(0, Number(event.target.value || 1) - 1)
    renderPhotos()
  }
})
document.addEventListener('change', async (event) => {
  if (event.target.id === 'photo-page') {
    photoPage = Math.max(0, Number(event.target.value || 1) - 1)
    renderPhotos()
    return
  }
  if (['media-live', 'picker-live'].includes(event.target.id)) {
    mediaLimit = 36
    return renderMediaCards(event.target.id.startsWith('picker'))
  }
  if (event.target.dataset.mediaKey) {
    const key = event.target.dataset.mediaKey
    event.target.checked ? pickedMedia.add(key) : pickedMedia.delete(key)
    event.target.closest('.media-card').classList.toggle('picked', event.target.checked)
    document.querySelector('#picker-count').textContent = `已选 ${pickedMedia.size} 张`
    return
  }
  if (event.target.id === 'filter')
    return updatePostTable()
  if (event.target.dataset.select) {
    event.target.checked ? selected.add(event.target.dataset.select) : selected.delete(event.target.dataset.select)
    return updatePostTable()
  }
  if (event.target.hasAttribute('data-select-all')) {
    document.querySelectorAll('[data-select]:not(:disabled)').forEach((box) => {
      event.target.checked ? selected.add(box.dataset.select) : selected.delete(box.dataset.select)
    })
    return updatePostTable()
  }
  if (event.target.name === 'cover' && item)
    item.data.cover = event.target.value
  if (event.target.dataset.photoField === 'hidden') {
    item.data.photos[Number(event.target.dataset.index)].hidden = event.target.checked
    renderPhotos()
  }
  if (['photo-files', 'post-image-files'].includes(event.target.id) || event.target.hasAttribute('data-live-index')) {
    if (busy)
      return
    busy = true
    try {
      const files = [...event.target.files]
      if (event.target.hasAttribute('data-live-index'))
        await importSingleLive(Number(event.target.dataset.liveIndex), files[0])
      else if (event.target.id === 'post-image-files')
        await importPostImages(files)
      else
        await importFiles(files)
    }
    catch (error) {
      message(error.message, true)
      const fieldset = document.querySelector('fieldset')
      if (fieldset)
        fieldset.disabled = false
      if (event.target.isConnected)
        event.target.value = ''
    }
    finally {
      busy = false
      if (event.target.isConnected)
        event.target.value = ''
    }
  }
})
document.addEventListener('dragstart', (event) => {
  const card = event.target.closest('[data-photo-index]')
  if (!card || busy || event.target.closest('input,textarea')) {
    event.preventDefault()
    return
  }
  dragged = Number(card.dataset.photoIndex)
  event.dataTransfer.setData('text/plain', String(dragged))
  card.classList.add('dragging')
})
document.addEventListener('dragover', (event) => {
  if (event.target.closest('[data-photo-index]') && dragged !== undefined)
    event.preventDefault()
})
document.addEventListener('drop', (event) => {
  const card = event.target.closest('[data-photo-index]')
  if (!card || dragged === undefined || busy)
    return
  event.preventDefault()
  const target = Number(card.dataset.photoIndex)
  const [photo] = item.data.photos.splice(dragged, 1)
  item.data.photos.splice(target, 0, photo)
  dragged = undefined
  renderPhotos()
  setDirty(true)
})
document.addEventListener('dragend', () => {
  dragged = undefined
  document.querySelectorAll('.dragging').forEach(card => card.classList.remove('dragging'))
})
document.addEventListener('submit', event => event.preventDefault())
window.addEventListener('beforeunload', (event) => {
  if (dirty) {
    event.preventDefault()
    event.returnValue = ''
  }
})
async function start() {
  const album = new URL(window.location.href).searchParams.get('preview-album')
  if (album) {
    await navigate('albums')
    message('正在打开本地相册预览…')
    const result = await api('/api/preview', { kind: 'album', id: album })
    window.location.replace(result.url)
    return
  }
  await navigate('posts')
}
start().catch(error => message(error.message, true))

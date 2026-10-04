import { statuses, transitions, today } from './domain.mjs';
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let data, adminData, authenticated = false, currentTab = 'bookings', slotRequest = 0, editSlotRequest = 0;
const names = { artists:'Artist', styles:'Phong cách', services:'Dịch vụ', portfolio:'Tác phẩm', blog:'Bài viết' };
const days = ['Chủ nhật','Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy'];
const title = x => x.name || x.title;
const opt = (v, label, selected = false) => `<option value="${esc(v)}" ${selected ? 'selected' : ''}>${esc(label)}</option>`;
const opts = (list, selected) => list.map(x => opt(x.id, title(x), x.id === selected)).join('');
const btn = (label, attrs = '', primary = false) => `<button type="button" class="button ${primary ? 'primary' : 'ghost'} small" ${attrs}>${label}</button>`;
const empty = text => `<p class="empty-state">${text}</p>`;
const values = form => Object.fromEntries(new FormData(form));
const field = (name, label, v = '', type = 'text', required = false, extra = '') => `<label>${label}<input name="${name}" type="${type}" value="${esc(v)}" ${required ? 'required' : ''} ${extra}></label>`;
const area = (name, label, v = '', required = false) => `<label class="wide">${label}<textarea name="${name}" ${required ? 'required' : ''}>${esc(v)}</textarea></label>`;
const select = (name, label, list, selected) => `<label>${label}<select name="${name}" required>${opts(list, selected)}</select></label>`;
const checks = (name, label, list, selected) => `<fieldset class="wide"><legend>${label}</legend><div class="checks">${list.map(x => `<label><input type="checkbox" name="${name}" value="${esc(x.id)}" ${selected.includes(x.id) ? 'checked' : ''}>${esc(x.name)}</label>`).join('')}</div></fieldset>`;
const dayOptions = days.map((name, id) => ({name, id}));
function imageField(name, label, value = '') {
  return `<div class="wide image-field">${field(name, label + ' — đường dẫn URL', value.startsWith('data:') ? '' : value, 'url')}<label>Hoặc tải ảnh PNG, JPG, WebP (tối đa 1 MB)<input type="file" accept="image/png,image/jpeg,image/webp" data-image-input="${name}"></label>${value ? `<img class="image-preview" src="${esc(value)}" alt="Ảnh hiện tại">` : ''}<input type="hidden" data-image-value="${name}" value="${esc(value)}">${btn('Gỡ ảnh', `data-clear-image="${name}"`)}</div>`;
}
function notify(message) { $('#toast').textContent = message; $('#toast').classList.add('show'); clearTimeout(notify.timer); notify.timer = setTimeout(() => $('#toast').classList.remove('show'), 5000); }
async function api(route, method = 'GET', body) {
  const res = await fetch('/api/' + route, {method, headers: method === 'GET' ? {} : {'Content-Type':'application/json'}, ...(body === undefined ? {} : {body:JSON.stringify(body)})});
  const result = await res.json();
  if (!res.ok) {
    if (res.status === 401 && authenticated) { authenticated = false; adminData = null; $('#detailDialog').close(); $('#dialogContent').replaceChildren(); renderAdmin(); }
    throw new Error(result.error || 'Không hoàn tất được yêu cầu.');
  }
  return result;
}
async function imagesFrom(form, result) {
  for (const input of form.querySelectorAll('[data-image-input]')) {
    const key = input.dataset.imageInput, file = input.files[0];
    if (!file) { result[key] = result[key] || form.querySelector(`[data-image-value="${key}"]`).value; continue; }
    if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 1024 * 1024) throw new Error('Chọn ảnh PNG, JPG hoặc WebP không quá 1 MB.');
    result[key] = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('Không đọc được ảnh.')); reader.readAsDataURL(file); });
  }
}
function dialog(html) { $('#dialogContent').innerHTML = html; if (!$('#detailDialog').open) $('#detailDialog').showModal(); }
const heading = (kicker, text, tail = '') => `<div class="section-heading"><div><p class="eyebrow">${kicker}</p><h2>${text}</h2></div>${tail}</div>`;
const photo = (item, cls = '') => item.image ? `<img class="${cls}" src="${esc(item.image)}" alt="${esc(title(item))}" loading="lazy">` : `<div class="art-placeholder ${cls}"><span>${esc(title(item))}</span><small>Chưa có ảnh tác phẩm</small></div>`;
function mount() {
  $('#main').innerHTML = `
    <section class="hero" id="home"><img class="hero-image" src="assets/tattoo-studio-hero.png" alt="Không gian tattoo studio"><div class="hero-overlay"></div><div class="hero-content"><p class="eyebrow">Tattoo · Art · Individuality</p><h1 id="heroTitle"></h1><p id="heroText"></p><div class="hero-actions"><a class="button primary" href="#booking">Đặt lịch tư vấn ↗</a><a class="button ghost" href="#portfolio">Khám phá tác phẩm</a></div></div><div class="hero-stats"><span><strong id="statArtists"></strong>Nghệ sĩ</span><span><strong id="statPortfolio"></strong>Tác phẩm</span><span><strong>01</strong>Studio · dấu ấn riêng</span></div></section>
    <section class="section intro" id="about"><div><p class="eyebrow">Câu chuyện studio</p><h2>Nghệ thuật bắt đầu từ bạn.</h2></div><p id="aboutText"></p></section>
    <section class="section" id="artists">${heading('Đội ngũ nghệ sĩ','Tìm người kể câu chuyện của bạn.')}<div class="artist-grid" id="artistGrid"></div></section>
    <section class="section tonal" id="styles">${heading('Tattoo styles','Chọn một phong cách.')}<div class="style-list" id="styleList"></div></section>
    <section class="section" id="portfolio">${heading('Selected work','Dấu ấn trên làn da.','<div class="filter-row"><select id="portfolioArtist" aria-label="Lọc theo artist"></select><select id="portfolioStyle" aria-label="Lọc theo phong cách"></select></div>')}<div class="portfolio-grid" id="portfolioGrid"></div></section>
    <section class="section split" id="services"><div><p class="eyebrow">Dịch vụ</p><h2>Từ ý tưởng đến hình xăm.</h2><p>Giá tham khảo tùy kích thước, vị trí và độ chi tiết. Studio sẽ trao đổi và báo giá trước khi thực hiện.</p></div><div class="service-list" id="serviceList"></div></section>
    <section class="section booking-section" id="booking"><div class="booking-copy"><p class="eyebrow">Bắt đầu câu chuyện</p><h2>Hẹn gặp bạn tại studio.</h2><p>Chọn artist, dịch vụ và khung giờ còn trống. Studio sẽ liên hệ để xác nhận ý tưởng và lịch hẹn.</p><div class="flow"><span>01 · Chọn nghệ sĩ</span><span>02 · Chọn giờ trống</span><span>03 · Nhận xác nhận</span></div><p class="booking-hint">Giờ hẹn theo múi giờ Việt Nam (UTC+7).</p><p id="bookingPolicy"></p></div>
    <form class="booking-form" id="bookingForm"><div class="form-grid">${field('customerName','Họ và tên *','','text',true,'maxlength="100" autocomplete="name"')}${field('phone','Số điện thoại *','','tel',true,'autocomplete="tel" placeholder="0901234567"')}${field('email','Email','','email',false,'autocomplete="email"')}<label id="artistField">Artist *<select name="artistId" id="bookingArtist" required></select></label><label>Dịch vụ *<select name="serviceId" id="bookingService" required></select></label>${field('date','Ngày hẹn *','','date',true,`min="${today()}"`)}<label>Khung giờ trống *<select name="time" id="bookingTime" required disabled>${opt('','Chọn ngày để xem giờ trống')}</select></label>${field('placement','Vị trí xăm *','','text',true,'placeholder="Cổ tay, vai, lưng…"')}${field('size','Kích thước dự kiến','','text',false,'placeholder="5 cm, nửa cánh tay…"')}${imageField('reference','Hình tham khảo')}${area('notes','Mô tả ý tưởng *','',true)}</div><p id="availabilityHint" role="status"></p><button class="button primary full" type="submit">Gửi yêu cầu đặt lịch</button><p class="form-message" id="bookingMessage" role="status"></p></form></section>
    <section class="section" id="blog">${heading('Journal','Cảm hứng & câu chuyện.')}<div class="blog-grid" id="blogGrid"></div></section>
    <section class="section contact" id="contact"><div id="contactDetails"></div><div class="policy"><strong>Chính sách đặt lịch</strong><p id="policyText"></p></div></section>
    <section class="section admin-section" id="admin">${heading('Studio workspace','Quản trị studio.')}<div id="adminRoot"></div></section><footer><span id="footerName"></span><a href="#home">Về đầu trang ↑</a></footer>`;
}
function keepOptions(el, html) { const v = el.value; el.innerHTML = html; if ([...el.options].some(o => o.value === v)) el.value = v; }
function renderPublic() {
  const s = data.studio;
  document.title = `${s.name} | Tattoo & Booking`; $('.brand strong').textContent = s.name;
  $('.brand-mark').innerHTML = s.logo ? `<img src="${esc(s.logo)}" alt="Logo studio">` : esc(s.name[0]);
  for (const [id, value] of Object.entries({heroTitle:s.heroTitle,heroText:s.heroText,aboutText:s.about,footerName:s.name,statArtists:data.artists.length,statPortfolio:data.portfolio.length,bookingPolicy:s.policy,policyText:s.policy})) $('#' + id).textContent = value;
  $('#contactDetails').innerHTML = `<p class="eyebrow">Ghé thăm chúng tôi</p><h2>${esc(s.name)}</h2><p>${esc(s.address)}</p><p><a href="tel:${esc(s.phone.replace(/[^+\d]/g,''))}">${esc(s.phone)}</a> · <a href="mailto:${esc(s.email)}">${esc(s.email)}</a></p><p>${esc(s.openTime)} – ${esc(s.closeTime)} · ${s.openDays.map(d => days[d]).join(', ')}</p>${s.hours ? `<p>${esc(s.hours)}</p>` : ''}${s.social ? `<a class="text-link" href="${esc(s.social)}" target="_blank" rel="noopener noreferrer">Theo dõi studio ↗</a>` : ''}`;
  $('#artistGrid').innerHTML = data.artists.map(a => `<article class="card">${a.image ? `<img class="artist-photo" src="${esc(a.image)}" alt="${esc(a.name)}" loading="lazy">` : `<div class="artist-avatar">${esc(a.name.split(' ').map(p => p[0]).slice(0,2).join(''))}</div>`}<h3>${esc(a.name)}</h3><p>${esc(a.specialty)} · ${a.years} năm kinh nghiệm</p><div class="tag-row">${a.styleIds.map(id => `<span class="tag">${esc(data.styles.find(s => s.id === id)?.name)}</span>`).join('')}</div>${btn('Xem hồ sơ ↗',`data-artist="${a.id}"`)}</article>`).join('') || empty('Studio đang cập nhật đội ngũ nghệ sĩ.');
  $('#styleList').innerHTML = data.styles.map(s => `<article class="style-pill"><strong>${esc(s.name)}</strong><span>${esc(s.description)}</span>${btn('Xem tác phẩm',`data-style="${s.id}"`)}</article>`).join('') || empty('Chưa có phong cách.');
  keepOptions($('#portfolioArtist'),opt('','Tất cả artist') + opts(data.artists)); keepOptions($('#portfolioStyle'),opt('','Tất cả phong cách') + opts(data.styles)); renderPortfolio();
  $('#serviceList').innerHTML = data.services.map(s => `<article class="service-item"><div><h3>${esc(s.name)}</h3><p>${esc(s.description)}</p><span class="tag">${s.duration} phút</span></div><div><p class="price">${esc(s.price)}</p>${btn('Đặt lịch',`data-service="${s.id}"`)}</div></article>`).join('') || empty('Chưa có dịch vụ nhận lịch.');
  $('#artistField').classList.toggle('hidden',data.artists.length === 1); keepOptions($('#bookingArtist'),opts(data.artists)); keepOptions($('#bookingService'),opts(data.services));
  $('#bookingForm button[type="submit"]').disabled = !data.artists.length || !data.services.length;
  $('#blogGrid').innerHTML = data.blog.map(p => `<article class="blog-card"><span class="tag">${esc(p.tag)}</span><h3>${esc(p.title)}</h3><p>${esc(p.excerpt)}</p>${btn('Đọc bài viết ↗',`data-post="${p.id}"`)}</article>`).join('') || empty('Bài viết đang được cập nhật.');
  updateSlots();
}
function renderPortfolio() {
  const items = data.portfolio.filter(p => (!$('#portfolioArtist').value || p.artistId === $('#portfolioArtist').value) && (!$('#portfolioStyle').value || p.styleId === $('#portfolioStyle').value));
  $('#portfolioGrid').innerHTML = items.map(p => `<article class="portfolio-card">${photo(p,'portfolio-photo')}<div class="content"><span class="tag">${esc(data.styles.find(s => s.id === p.styleId)?.name)}</span><h3>${esc(p.title)}</h3><p>${esc(data.artists.find(a => a.id === p.artistId)?.name)} · ${esc(p.placement)}</p>${btn('Xem tác phẩm',`data-work="${p.id}"`)}</div></article>`).join('') || empty('Không có tác phẩm phù hợp bộ lọc.');
}
async function updateSlots() {
  const request = ++slotRequest, f = $('#bookingForm'), t = $('#bookingTime'), previous = t.value;
  t.disabled = true; t.innerHTML = opt('','Đang tải giờ trống…');
  if (!data.artists.length || !data.services.length) { t.innerHTML = opt('','Tạm ngừng nhận lịch'); $('#availabilityHint').textContent = 'Studio chưa có artist hoặc dịch vụ nhận lịch. Vui lòng liên hệ trực tiếp.'; return; }
  if (!f.elements.date.value) { t.innerHTML = opt('','Chọn ngày để xem giờ trống'); $('#availabilityHint').textContent = ''; return; }
  try {
    const result = await api('availability?' + new URLSearchParams({artistId:f.elements.artistId.value,serviceId:f.elements.serviceId.value,date:f.elements.date.value}));
    if (request !== slotRequest) return;
    t.innerHTML = opt('',result.times.length ? 'Chọn giờ hẹn' : 'Không còn giờ trống') + result.times.map(x => opt(x,x,x === previous)).join(''); t.disabled = !result.times.length;
    $('#availabilityHint').textContent = result.times.length ? `Dịch vụ dự kiến ${data.services.find(s => s.id === f.elements.serviceId.value)?.duration} phút. Giờ trống đã tính thời gian thực hiện.` : 'Ngày này đã kín lịch hoặc là ngày nghỉ. Hãy chọn ngày hoặc artist khác.';
  } catch (e) { if (request === slotRequest) { t.innerHTML = opt('','Chưa tải được giờ trống'); $('#availabilityHint').textContent = e.message; } }
}
async function refresh() { data = await api('public'); if (authenticated) adminData = await api('admin'); renderPublic(); renderAdmin(); }
function renderAdmin() {
  if (!authenticated) { $('#adminRoot').innerHTML = `<form class="login-panel" id="loginForm"><p>Đăng nhập bằng tài khoản quản trị được tạo khi khởi động máy chủ.</p>${field('username','Tài khoản','admin','text',true,'autocomplete="username"')}${field('password','Mật khẩu','','password',true,'autocomplete="current-password"')}<button class="button primary" type="submit">Đăng nhập</button><p class="form-message" role="status"></p></form>`; return; }
  $('#adminRoot').innerHTML = `<div class="admin-panel"><div class="admin-toolbar">${Object.entries(statuses).map(([k,v]) => `<div class="metric"><strong>${adminData.bookings.filter(b => b.status === k).length}</strong><span>${v}</span></div>`).join('')}${btn('Đăng xuất','data-logout')}</div><div class="tabs" aria-label="Mục quản trị">${Object.entries({bookings:'Lịch hẹn',...names,settings:'Cấu hình'}).map(([k,v]) => btn(v,`data-tab="${k}" aria-pressed="${currentTab === k}"`,currentTab === k)).join('')}</div><div id="adminContent"></div></div>`;
  renderTab();
}
function renderTab() {
  if (currentTab === 'settings') { renderSettings(); return; }
  if (currentTab === 'bookings') {
    $('#adminContent').innerHTML = `<div class="filter-row admin-filters"><label>Tìm khách / điện thoại / mã lịch<input id="bookingSearch" type="search" placeholder="Nhập để tìm…"></label><label>Trạng thái<select id="bookingStatusFilter">${opt('','Tất cả trạng thái')}${Object.entries(statuses).map(([k,v]) => opt(k,v)).join('')}</select></label><label>Artist<select id="bookingArtistFilter">${opt('','Tất cả artist')}${opts(adminData.artists)}</select></label><label>Ngày hẹn<input id="bookingDateFilter" type="date"></label>${btn('Xóa bộ lọc','data-clear-filters')}</div><div class="table-wrap"><table><thead><tr><th>Khách hàng</th><th>Artist / dịch vụ</th><th>Ngày hẹn</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody id="bookingRows"></tbody></table></div>`; renderBookings(); return;
  }
  $('#adminContent').innerHTML = `<div class="admin-list-heading"><h3>${names[currentTab]} · ${adminData[currentTab].length}</h3>${btn('+ Thêm mới',`data-edit="${currentTab}"`,true)}</div><div class="admin-list">${adminData[currentTab].map(x => `<article class="admin-item"><div><strong>${esc(title(x))}</strong><p>${esc(x.specialty || x.price || x.tag || x.description || '')}</p>${'visible' in x ? `<span class="tag">${x.visible ? 'Đang hiển thị' : 'Đang ẩn'}</span>` : ''}</div><div class="row-actions">${btn('Sửa',`data-edit="${currentTab}" data-id="${x.id}"`)}${'visible' in x ? btn(x.visible ? 'Ẩn' : 'Hiện',`data-toggle="${currentTab}" data-id="${x.id}"`) : ''}${btn('Xóa',`data-delete="${currentTab}" data-id="${x.id}"`)}</div></article>`).join('') || empty('Chưa có nội dung. Thêm mục đầu tiên để bắt đầu.')}</div>`;
}
function renderBookings() {
  const q = $('#bookingSearch').value.trim().toLowerCase();
  const list = adminData.bookings.filter(b => (!q || [b.customerName,b.phone,b.id].some(v => v.toLowerCase().includes(q))) && (!$('#bookingStatusFilter').value || b.status === $('#bookingStatusFilter').value) && (!$('#bookingArtistFilter').value || b.artistId === $('#bookingArtistFilter').value) && (!$('#bookingDateFilter').value || b.date === $('#bookingDateFilter').value));
  $('#bookingRows').innerHTML = list.map(b => `<tr><td><strong>${esc(b.customerName)}</strong><br><a href="tel:${esc(b.phone.replace(/[^+\d]/g,''))}">${esc(b.phone)}</a><small class="booking-code">${esc(b.id.slice(0,8))}</small></td><td>${esc(adminData.artists.find(a => a.id === b.artistId)?.name)}<br><small>${esc(adminData.services.find(s => s.id === b.serviceId)?.name)} · ${b.duration} phút</small></td><td>${esc(b.date.split('-').reverse().join('/'))}<br><strong>${esc(b.time)}</strong></td><td><span class="status ${b.status}">${statuses[b.status]}</span></td><td>${btn('Chi tiết / xử lý',`data-booking="${b.id}"`)}</td></tr>`).join('') || '<tr><td colspan="5">Không có lịch hẹn phù hợp.</td></tr>';
}
function editor(kind, id) {
  const x = adminData[kind].find(x => x.id === id) || {}; let fields = '';
  if (kind === 'artists') fields = field('name','Tên artist *',x.name,'text',true) + field('specialty','Chuyên môn *',x.specialty,'text',true) + field('years','Số năm kinh nghiệm',x.years || 0,'number',true,'min="0" max="80"') + area('bio','Giới thiệu',x.bio) + imageField('image','Ảnh artist',x.image) + checks('styleIds','Phong cách chuyên môn',adminData.styles,x.styleIds || []) + checks('workDays','Ngày làm việc',dayOptions,x.workDays || [0,1,2,3,4,5,6]) + area('daysOff','Ngày nghỉ riêng (YYYY-MM-DD, cách nhau bằng dấu phẩy)',(x.daysOff || []).join(', '));
  if (kind === 'styles') fields = field('name','Tên phong cách *',x.name,'text',true) + area('description','Mô tả',x.description);
  if (kind === 'services') fields = field('name','Tên dịch vụ *',x.name,'text',true) + field('price','Giá tham khảo *',x.price,'text',true) + field('duration','Thời lượng (phút) *',x.duration || 60,'number',true,'min="15" max="600"') + area('description','Mô tả',x.description);
  if (kind === 'portfolio') fields = field('title','Tên tác phẩm *',x.title,'text',true) + select('artistId','Artist *',adminData.artists,x.artistId) + select('styleId','Phong cách *',adminData.styles,x.styleId) + field('placement','Vị trí xăm *',x.placement,'text',true) + imageField('image','Ảnh tác phẩm',x.image) + area('description','Câu chuyện tác phẩm',x.description);
  if (kind === 'blog') fields = field('title','Tiêu đề *',x.title,'text',true) + field('tag','Chủ đề *',x.tag,'text',true) + area('excerpt','Tóm tắt *',x.excerpt,true) + area('content','Nội dung bài viết *',x.content,true);
  if (kind !== 'styles') fields += `<label class="check-label wide"><input type="checkbox" name="visible" ${x.visible !== false ? 'checked' : ''}>Hiển thị trên website</label>`;
  dialog(`<h2 id="dialogTitle">${x.id ? 'Sửa' : 'Thêm'} ${names[kind].toLowerCase()}</h2><form id="editorForm" data-kind="${kind}" data-id="${id || ''}"><div class="form-grid">${fields}</div><p class="form-message" role="status"></p><div class="row-actions"><button class="button primary" type="submit">Lưu nội dung</button>${btn('Hủy','data-close')}</div></form>`);
}
function renderSettings() {
  const s = adminData.studio;
  $('#adminContent').innerHTML = `<form id="settingsForm" class="settings-form">${field('name','Tên studio *',s.name,'text',true)}${field('address','Địa chỉ *',s.address,'text',true)}${field('phone','Điện thoại *',s.phone,'tel',true)}${field('email','Email *',s.email,'email',true)}${field('social','Liên kết mạng xã hội',s.social,'url')}${imageField('logo','Logo',s.logo)}${field('heroTitle','Tiêu đề trang chủ *',s.heroTitle,'text',true)}${area('heroText','Mô tả trang chủ',s.heroText)}${area('about','Giới thiệu studio',s.about)}${field('openTime','Giờ mở cửa *',s.openTime,'time',true)}${field('closeTime','Giờ đóng cửa *',s.closeTime,'time',true)}${field('slotStep','Khoảng cách giữa các giờ bắt đầu (phút)',s.slotStep,'number',true,'min="15" max="120"')}${checks('openDays','Ngày studio mở cửa',dayOptions,s.openDays)}${field('hours','Ghi chú giờ làm việc',s.hours)}${area('policy','Chính sách đặt lịch *',s.policy,true)}<p class="wide muted">Thay đổi lịch làm việc áp dụng cho yêu cầu mới. Kiểm tra và sắp xếp lại các lịch hẹn đã có nếu cần.</p><button class="button primary" type="submit">Lưu cấu hình</button><p class="form-message" role="status"></p></form>`;
}
function bookingDetail(id) {
  const b = adminData.bookings.find(x => x.id === id);
  dialog(`<h2 id="dialogTitle">Chi tiết lịch hẹn</h2><p class="booking-code">${esc(b.id)}</p><span class="status ${b.status}">${statuses[b.status]}</span><h3>${esc(b.customerName)}</h3><p>${esc(b.phone)} · ${esc(b.email || 'Không có email')}</p><p>${esc(adminData.artists.find(a => a.id === b.artistId)?.name)} · ${esc(adminData.services.find(s => s.id === b.serviceId)?.name)}</p><p>${esc(b.date)} · ${esc(b.time)} · ${b.duration} phút</p><p>${esc(b.placement)} · ${esc(b.size || 'Chưa xác định kích thước')}</p><p class="pre-wrap">${esc(b.notes)}</p>${b.reference ? b.reference.startsWith('data:') ? `<img class="reference-image" src="${esc(b.reference)}" alt="Hình tham khảo của khách">` : `<a class="text-link" href="${esc(b.reference)}" target="_blank" rel="noopener noreferrer">Mở hình tham khảo ↗</a>` : ''}<div class="row-actions">${transitions[b.status].map(s => btn(statuses[s],`data-status="${s}" data-id="${b.id}"`,s !== 'Cancelled')).join('')}${['Pending','Confirmed'].includes(b.status) ? btn('Đổi lịch / artist',`data-reschedule="${b.id}"`) : ''}</div><details><summary>Lịch sử xử lý</summary>${b.history.map(h => `<p>${esc(new Date(h.at).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}))} · ${esc(h.action === 'reschedule' ? `Đổi từ ${h.from} sang ${h.to}` : statuses[h.status])}</p>`).join('')}</details>`);
}
async function reschedule(id) {
  const b = adminData.bookings.find(x => x.id === id);
  dialog(`<h2 id="dialogTitle">Đổi lịch hẹn</h2><form id="rescheduleForm" data-id="${b.id}"><div class="form-grid">${select('artistId','Artist',adminData.artists.filter(a => a.visible),b.artistId)}${select('serviceId','Dịch vụ',adminData.services.filter(s => s.visible),b.serviceId)}${field('date','Ngày hẹn',b.date,'date',true,`min="${today()}"`)}<label>Giờ hẹn<select name="time" required></select></label></div><p class="form-message" role="status"></p><button class="button primary" type="submit">Lưu lịch mới</button></form>`); await editSlots(b.time);
}
async function editSlots(preferred = '') {
  const request = ++editSlotRequest, f = $('#rescheduleForm'); if (!f) return;
  const t = f.elements.time; t.disabled = true; t.innerHTML = opt('','Đang tải…');
  const result = await api('admin-availability?' + new URLSearchParams({...values(f),ignoreId:f.dataset.id}));
  if (request !== editSlotRequest || !f.isConnected) return;
  t.innerHTML = opt('',result.times.length ? 'Chọn giờ' : 'Không có giờ trống') + result.times.map(x => opt(x,x,x === preferred)).join(''); t.disabled = false;
}
async function submit(form) {
  if (form.id === 'loginForm') { await api('login','POST',values(form)); authenticated = true; await refresh(); notify('Đã đăng nhập.'); }
  if (form.id === 'bookingForm') {
    const v = values(form); if (!v.time) throw new Error('Vui lòng chọn khung giờ còn trống.');
    await imagesFrom(form,v); const result = await api('bookings','POST',v);
    form.reset(); form.querySelector('[data-image-value]').value = ''; await updateSlots();
    $('#bookingMessage').textContent = `Đã nhận yêu cầu. Mã lịch hẹn: ${result.id}. Trạng thái: chờ xác nhận. Studio sẽ liên hệ với bạn.`;
    if (authenticated) { adminData = await api('admin'); renderAdmin(); }
  }
  if (form.id === 'editorForm') {
    const v = values(form), kind = form.dataset.kind;
    if (kind !== 'styles') v.visible = form.elements.visible.checked;
    if (kind === 'artists') { v.years = Number(v.years); v.styleIds = new FormData(form).getAll('styleIds'); v.workDays = new FormData(form).getAll('workDays').map(Number); v.daysOff = v.daysOff.split(',').map(d => d.trim()).filter(Boolean); }
    if (kind === 'services') v.duration = Number(v.duration);
    await imagesFrom(form,v); await api(kind + (form.dataset.id ? '/' + form.dataset.id : ''),form.dataset.id ? 'PUT' : 'POST',v);
    $('#detailDialog').close(); await refresh(); notify('Đã lưu nội dung.');
  }
  if (form.id === 'settingsForm') { const v = values(form); v.openDays = new FormData(form).getAll('openDays').map(Number); v.slotStep = Number(v.slotStep); await imagesFrom(form,v); await api('settings','PUT',v); await refresh(); notify('Đã cập nhật cấu hình và trang khách.'); }
  if (form.id === 'rescheduleForm') { const id = form.dataset.id; await api('bookings/' + id,'PATCH',values(form)); await refresh(); bookingDetail(id); notify('Đã đổi lịch hẹn.'); }
}
document.addEventListener('submit',async event => {
  event.preventDefault(); const f = event.target, button = f.querySelector('[type="submit"]'); if (!button || button.disabled) return;
  button.disabled = true; const message = f.querySelector('.form-message'); if (message) message.textContent = '';
  try { await submit(f); } catch (e) { if (message) message.textContent = e.message; else notify(e.message); if (f.id === 'bookingForm') await updateSlots(); }
  finally { button.disabled = false; }
});
document.addEventListener('change',event => {
  if (['portfolioArtist','portfolioStyle'].includes(event.target.id)) renderPortfolio();
  if (event.target.closest('#bookingForm') && ['artistId','serviceId','date'].includes(event.target.name)) updateSlots();
  if (event.target.closest('#rescheduleForm') && event.target.name !== 'time') editSlots().catch(e => notify(e.message));
  if (['bookingStatusFilter','bookingArtistFilter','bookingDateFilter'].includes(event.target.id)) renderBookings();
});
document.addEventListener('input',event => { if (event.target.id === 'bookingSearch') renderBookings(); });
document.addEventListener('click',async event => {
  const el = event.target.closest('button, a'); if (!el) return;
  try {
    if (el.matches('.nav-toggle')) { const open = $('.main-nav').classList.toggle('open'); el.setAttribute('aria-expanded',open); }
    if (el.closest('.main-nav')) { $('.main-nav').classList.remove('open'); $('.nav-toggle').setAttribute('aria-expanded',false); }
    if (el.matches('.dialog-close, [data-close]')) $('#detailDialog').close();
    if (el.dataset.artist) {
      const a = data.artists.find(a => a.id === el.dataset.artist), works = data.portfolio.filter(p => p.artistId === a.id);
      dialog(`<h2 id="dialogTitle">${esc(a.name)}</h2><p>${esc(a.specialty)} · ${a.years} năm kinh nghiệm</p><p class="pre-wrap">${esc(a.bio)}</p><p>Ngày nhận lịch: ${a.workDays.filter(d => data.studio.openDays.includes(d)).map(d => days[d]).join(', ')}</p>${btn('Đặt lịch với artist này',`data-choose-artist="${a.id}"`,true)}<h3 class="dialog-subtitle">Tác phẩm của artist</h3><div class="artist-works">${works.map(p => `<article>${photo(p,'portfolio-photo')}<h3>${esc(p.title)}</h3></article>`).join('') || empty('Artist đang cập nhật tác phẩm.')}</div>`);
    }
    if (el.dataset.chooseArtist) { $('#bookingArtist').value = el.dataset.chooseArtist; $('#detailDialog').close(); location.hash = 'booking'; updateSlots(); }
    if (el.dataset.style) { $('#portfolioStyle').value = el.dataset.style; $('#portfolioArtist').value = ''; renderPortfolio(); location.hash = 'portfolio'; }
    if (el.dataset.service) { $('#bookingService').value = el.dataset.service; updateSlots(); location.hash = 'booking'; }
    if (el.dataset.post) { const p = data.blog.find(x => x.id === el.dataset.post); dialog(`<span class="tag">${esc(p.tag)}</span><h2 id="dialogTitle">${esc(p.title)}</h2><div class="pre-wrap article-body">${esc(p.content)}</div>`); }
    if (el.dataset.work) { const p = data.portfolio.find(x => x.id === el.dataset.work); dialog(`<h2 id="dialogTitle">${esc(p.title)}</h2>${photo(p,'reference-image')}<p class="pre-wrap">${esc(p.description)}</p><p>${esc(p.placement)} · ${esc(data.styles.find(s => s.id === p.styleId)?.name)}</p>${btn('Đặt lịch với artist này',`data-choose-artist="${p.artistId}"`,true)}`); }
    if (el.hasAttribute('data-logout')) { await api('logout','POST',{}); authenticated = false; adminData = null; $('#detailDialog').close(); $('#dialogContent').replaceChildren(); renderAdmin(); }
    if (el.dataset.tab) { currentTab = el.dataset.tab; renderAdmin(); }
    if (el.dataset.edit) editor(el.dataset.edit,el.dataset.id);
    if (el.dataset.toggle) { const x = adminData[el.dataset.toggle].find(x => x.id === el.dataset.id); await api(`${el.dataset.toggle}/${x.id}`,'PUT',{...x,visible:!x.visible}); await refresh(); notify('Đã cập nhật hiển thị.'); }
    if (el.dataset.delete && confirm('Xóa nội dung này? Thao tác không thể hoàn tác.')) { await api(`${el.dataset.delete}/${el.dataset.id}`,'DELETE'); await refresh(); notify('Đã xóa nội dung.'); }
    if (el.dataset.booking) bookingDetail(el.dataset.booking);
    if (el.dataset.reschedule) await reschedule(el.dataset.reschedule);
    if (el.dataset.status && (el.dataset.status !== 'Cancelled' || confirm('Hủy lịch hẹn này và trả lại khung giờ?'))) { await api('bookings/' + el.dataset.id,'PATCH',{status:el.dataset.status}); await refresh(); bookingDetail(el.dataset.id); notify('Đã cập nhật trạng thái.'); }
    if (el.hasAttribute('data-clear-filters')) { ['bookingSearch','bookingStatusFilter','bookingArtistFilter','bookingDateFilter'].forEach(id => $('#' + id).value = ''); renderBookings(); }
    if (el.dataset.clearImage) { const wrap = el.closest('.image-field'); wrap.querySelector('[data-image-value]').value = ''; wrap.querySelector('[type="url"]').value = ''; wrap.querySelector('[type="file"]').value = ''; wrap.querySelector('img')?.remove(); }
  } catch (e) {
    if ($('#detailDialog').open) {
      let error = $('#dialogError');
      if (!error) { error = document.createElement('p'); error.id = 'dialogError'; error.className = 'form-message'; error.setAttribute('role','alert'); $('#dialogContent').append(error); }
      error.textContent = e.message;
    } else notify(e.message);
  }
});
$('#detailDialog').addEventListener('click',event => { if (event.target === $('#detailDialog')) { const r = event.target.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) event.target.close(); } });
async function start() {
  $('#main').innerHTML = empty('Đang tải studio…');
  try { const [publicData,session] = await Promise.all([api('public'),api('session')]); data = publicData; authenticated = session.authenticated; if (authenticated) adminData = await api('admin'); mount(); renderPublic(); renderAdmin(); if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView(); }
  catch { $('#main').innerHTML = `<section class="section"><h1>Chưa kết nối được studio.</h1><p>Hãy chạy máy chủ bằng <code>npm start</code> rồi mở <a href="http://localhost:5173">http://localhost:5173</a>.</p>${btn('Thử lại','id="retry"')}</section>`; $('#retry').addEventListener('click',start); }
}
start();

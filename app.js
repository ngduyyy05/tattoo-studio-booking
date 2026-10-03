const storageKey = "inklineStudioData";
const adminKey = "inklineAdminLoggedIn";

const seedData = {
  studio: {
    name: "Inkline Studio",
    address: "42 Nguyen Hue, Quan 1, TP.HCM",
    phone: "0901 222 333",
    hours: "10:00 - 20:00, Thu 3 - Chu nhat"
  },
  styles: [
    { id: "fine-line", name: "Fine Line", description: "Duong net mong, tinh te, phu hop hinh nho." },
    { id: "minimal", name: "Minimal", description: "Bo cuc gon, it chi tiet, de cham soc." },
    { id: "blackwork", name: "Blackwork", description: "Mang den manh, tuong phan cao, ca tinh." },
    { id: "japanese", name: "Japanese", description: "Bo cuc lon, nhieu lop y nghia, mau sac sau." }
  ],
  artists: [
    {
      id: "artist-minh",
      name: "Minh Tran",
      specialty: "Fine Line / Minimal",
      years: 6,
      visible: true,
      bio: "Manh ve thiet ke nho, do tuong phan mem va cac hinh co tinh ky niem.",
      styleIds: ["fine-line", "minimal"]
    },
    {
      id: "artist-linh",
      name: "Linh Pham",
      specialty: "Blackwork / Ornamental",
      years: 8,
      visible: true,
      bio: "Tap trung vao cau truc, pattern va nhung tac pham co do phu mau cao.",
      styleIds: ["blackwork", "minimal"]
    },
    {
      id: "artist-kai",
      name: "Kai Nguyen",
      specialty: "Japanese / Neo Traditional",
      years: 10,
      visible: true,
      bio: "Chuyen cac bo cuc lon, sleeve, back piece va hinh co nhieu tang y nghia.",
      styleIds: ["japanese", "blackwork"]
    }
  ],
  services: [
    { id: "consult", name: "Tu van y tuong", price: "Mien phi", description: "Trao doi concept, vi tri, kich thuoc va artist phu hop." },
    { id: "small", name: "Small Tattoo", price: "Tu 700K", description: "Hinh nho, thoi gian thuc hien ngan, phu hop lan dau." },
    { id: "custom", name: "Custom Design", price: "Tu 2.5M", description: "Thiet ke rieng theo cau chuyen, phong cach va vi tri xam." },
    { id: "cover", name: "Cover-up / Rework", price: "Bao gia rieng", description: "Danh gia hinh cu va dua ra phuong an che/phuc hoi." }
  ],
  portfolio: [
    { id: "p1", title: "Botanical wrist line", artistId: "artist-minh", styleId: "fine-line", placement: "Co tay", gradient: "linear-gradient(135deg, #2b1d1a, #875045 48%, #d7b56d)" },
    { id: "p2", title: "Blackwork shoulder piece", artistId: "artist-linh", styleId: "blackwork", placement: "Vai", gradient: "linear-gradient(135deg, #050505, #342d2c 48%, #b7312c)" },
    { id: "p3", title: "Koi half sleeve", artistId: "artist-kai", styleId: "japanese", placement: "Canh tay", gradient: "linear-gradient(135deg, #221111, #86403d 45%, #d6a23a)" },
    { id: "p4", title: "Tiny moon minimal", artistId: "artist-minh", styleId: "minimal", placement: "Sau gay", gradient: "linear-gradient(135deg, #161415, #6b625a 48%, #eee1c9)" },
    { id: "p5", title: "Ornamental chest", artistId: "artist-linh", styleId: "blackwork", placement: "Nguc", gradient: "linear-gradient(135deg, #0d0d0d, #4d2b2a 55%, #9e8a65)" },
    { id: "p6", title: "Dragon back concept", artistId: "artist-kai", styleId: "japanese", placement: "Lung", gradient: "linear-gradient(135deg, #111, #4f1614 48%, #bd7e34)" }
  ],
  blog: [
    { id: "b1", title: "Cham soc hinh xam trong 7 ngay dau", tag: "Aftercare", excerpt: "Nhung viec nen lam va can tranh de mau len on dinh." },
    { id: "b2", title: "Chon artist theo phong cach nhu the nao?", tag: "Guide", excerpt: "Doc portfolio, trao doi y tuong va xem kinh nghiem dung chuyen mon." },
    { id: "b3", title: "Fine line co phu hop voi ban khong?", tag: "Style", excerpt: "Uu diem, han che va nhung vi tri nen can nhac truoc khi xam." }
  ],
  bookings: [
    {
      id: "bk-1001",
      customerName: "An Nguyen",
      phone: "0901234567",
      email: "an@example.com",
      artistId: "artist-minh",
      serviceId: "small",
      date: "2026-10-10",
      time: "14:00",
      placement: "Co tay",
      size: "6cm",
      notes: "Hinh hoa nho, net mong.",
      reference: "",
      status: "Pending"
    }
  ]
};

let data = loadData();

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function loadData() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return structuredClone(seedData);
  try {
    return JSON.parse(raw);
  } catch {
    return structuredClone(seedData);
  }
}

function saveData() {
  localStorage.setItem(storageKey, JSON.stringify(data));
}

function getArtist(id) {
  return data.artists.find((artist) => artist.id === id);
}

function getService(id) {
  return data.services.find((service) => service.id === id);
}

function getStyle(id) {
  return data.styles.find((style) => style.id === id);
}

function activeArtists() {
  return data.artists.filter((artist) => artist.visible);
}

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function renderStats() {
  $("#statArtists").textContent = activeArtists().length;
  $("#statPortfolio").textContent = data.portfolio.length;
  $("#statBookings").textContent = data.bookings.length;

  const count = (status) => data.bookings.filter((booking) => booking.status === status).length;
  $("#metricPending").textContent = count("Pending");
  $("#metricConfirmed").textContent = count("Confirmed");
  $("#metricCompleted").textContent = count("Completed");
}

function renderArtists() {
  $("#artistGrid").innerHTML = activeArtists()
    .map((artist) => {
      const tags = artist.styleIds.map((id) => `<span class="tag">${getStyle(id)?.name || id}</span>`).join("");
      return `
        <article class="card">
          <div class="artist-avatar">${initials(artist.name)}</div>
          <h3>${artist.name}</h3>
          <p>${artist.specialty} · ${artist.years || 0} nam kinh nghiem</p>
          <div class="tag-row">${tags}</div>
          <button class="button ghost small" type="button" data-artist-detail="${artist.id}">Xem ho so</button>
        </article>
      `;
    })
    .join("");
}

function renderStyles() {
  $("#styleList").innerHTML = data.styles
    .map((style) => `<article class="style-pill"><strong>${style.name}</strong><span>${style.description}</span></article>`)
    .join("");
}

function renderPortfolioFilters() {
  $("#portfolioArtist").innerHTML = `<option value="">Tat ca artist</option>${activeArtists()
    .map((artist) => `<option value="${artist.id}">${artist.name}</option>`)
    .join("")}`;
  $("#portfolioStyle").innerHTML = `<option value="">Tat ca phong cach</option>${data.styles
    .map((style) => `<option value="${style.id}">${style.name}</option>`)
    .join("")}`;
}

function renderPortfolio() {
  const artistFilter = $("#portfolioArtist").value;
  const styleFilter = $("#portfolioStyle").value;
  const items = data.portfolio.filter((item) => {
    const artist = getArtist(item.artistId);
    return (!artistFilter || item.artistId === artistFilter) && (!styleFilter || item.styleId === styleFilter) && artist?.visible;
  });

  $("#portfolioGrid").innerHTML = items
    .map((item) => `
      <article class="portfolio-card">
        <div class="portfolio-art" style="--art-gradient: ${item.gradient}">
          <strong>${getStyle(item.styleId)?.name || "Style"}</strong>
        </div>
        <div class="content">
          <h3>${item.title}</h3>
          <p>${getArtist(item.artistId)?.name || "Artist"} · ${item.placement}</p>
        </div>
      </article>
    `)
    .join("") || `<p>Chua co tac pham phu hop bo loc.</p>`;
}

function renderServices() {
  $("#serviceList").innerHTML = data.services
    .map((service) => `
      <article class="service-item">
        <div>
          <h3>${service.name}</h3>
          <p>${service.description || "Dich vu cua studio."}</p>
        </div>
        <span class="price">${service.price}</span>
      </article>
    `)
    .join("");
}

function renderBookingOptions() {
  const artists = activeArtists();
  const artistField = $("#artistField");
  const artistSelect = $("#bookingArtist");

  artistField.classList.toggle("hidden", artists.length <= 1);
  artistSelect.innerHTML = artists
    .map((artist) => `<option value="${artist.id}">${artist.name} - ${artist.specialty}</option>`)
    .join("");

  $("#bookingService").innerHTML = data.services
    .map((service) => `<option value="${service.id}">${service.name} (${service.price})</option>`)
    .join("");
}

function renderBlog() {
  $("#blogGrid").innerHTML = data.blog
    .map((post) => `
      <article class="blog-card">
        <span class="tag">${post.tag}</span>
        <h3>${post.title}</h3>
        <p>${post.excerpt || "Noi dung bai viet dang duoc cap nhat."}</p>
      </article>
    `)
    .join("");
}

function renderBookingsAdmin() {
  $("#bookingRows").innerHTML = data.bookings
    .map((booking) => `
      <tr>
        <td>
          <strong>${booking.customerName}</strong><br />
          <span>${booking.phone}</span><br />
          <span>${booking.placement} · ${booking.size || "Chua ro kich thuoc"}</span>
        </td>
        <td>${getArtist(booking.artistId)?.name || "Chua gan"}</td>
        <td>${getService(booking.serviceId)?.name || "Dich vu"}</td>
        <td>${booking.date} ${booking.time}<br /><span>${booking.notes}</span></td>
        <td>
          <select data-booking-status="${booking.id}" aria-label="Cap nhat trang thai booking">
            ${["Pending", "Confirmed", "Completed", "Cancelled"]
              .map((status) => `<option value="${status}" ${booking.status === status ? "selected" : ""}>${status}</option>`)
              .join("")}
          </select>
        </td>
      </tr>
    `)
    .join("");
}

function renderAdminLists() {
  $("#artistAdminList").innerHTML = data.artists
    .map((artist) => `
      <article class="admin-item">
        <div>
          <strong>${artist.name}</strong>
          <span>${artist.specialty} · ${artist.visible ? "Dang hien thi" : "Dang an"}</span>
        </div>
        <button class="button ghost small" type="button" data-toggle-artist="${artist.id}">
          ${artist.visible ? "An artist" : "Hien artist"}
        </button>
      </article>
    `)
    .join("");

  $("#serviceAdminList").innerHTML = data.services
    .map((service) => `
      <article class="admin-item">
        <div>
          <strong>${service.name}</strong>
          <span>${service.price}</span>
        </div>
      </article>
    `)
    .join("");

  $("#blogAdminList").innerHTML = data.blog
    .map((post) => `
      <article class="admin-item">
        <div>
          <strong>${post.title}</strong>
          <span>${post.tag}</span>
        </div>
      </article>
    `)
    .join("");
}

function renderSettingsForm() {
  const form = $("#settingsForm");
  form.elements.name.value = data.studio.name;
  form.elements.address.value = data.studio.address;
  form.elements.phone.value = data.studio.phone;
  form.elements.hours.value = data.studio.hours;
}

function renderAll() {
  renderStats();
  renderArtists();
  renderStyles();
  renderPortfolioFilters();
  renderPortfolio();
  renderServices();
  renderBookingOptions();
  renderBlog();
  renderBookingsAdmin();
  renderAdminLists();
  renderSettingsForm();
}

function setAdminVisible(isVisible) {
  localStorage.setItem(adminKey, isVisible ? "1" : "0");
  $("#loginForm").classList.toggle("hidden", isVisible);
  $("#adminPanel").classList.toggle("hidden", !isVisible);
}

function openArtistDialog(id) {
  const artist = getArtist(id);
  if (!artist) return;
  const workCount = data.portfolio.filter((item) => item.artistId === id).length;
  const tags = artist.styleIds.map((styleId) => `<span class="tag">${getStyle(styleId)?.name || styleId}</span>`).join("");
  $("#artistDialogContent").innerHTML = `
    <div class="artist-avatar">${initials(artist.name)}</div>
    <h2>${artist.name}</h2>
    <p>${artist.bio}</p>
    <div class="tag-row">${tags}</div>
    <p><strong>${artist.years || 0}</strong> nam kinh nghiem · <strong>${workCount}</strong> tac pham trong portfolio</p>
    <a class="button primary" href="#booking" data-dialog-booking>Dat lich voi ${artist.name}</a>
  `;
  $("#artistDialog").showModal();
}

function attachEvents() {
  $(".nav-toggle").addEventListener("click", (event) => {
    const nav = $(".main-nav");
    const open = nav.classList.toggle("open");
    event.currentTarget.setAttribute("aria-expanded", String(open));
  });

  $(".main-nav").addEventListener("click", () => {
    $(".main-nav").classList.remove("open");
    $(".nav-toggle").setAttribute("aria-expanded", "false");
  });

  $("#portfolioArtist").addEventListener("change", renderPortfolio);
  $("#portfolioStyle").addEventListener("change", renderPortfolio);

  document.addEventListener("click", (event) => {
    const artistButton = event.target.closest("[data-artist-detail]");
    if (artistButton) openArtistDialog(artistButton.dataset.artistDetail);

    const toggleArtist = event.target.closest("[data-toggle-artist]");
    if (toggleArtist) {
      const artist = getArtist(toggleArtist.dataset.toggleArtist);
      artist.visible = !artist.visible;
      saveData();
      renderAll();
    }

    const dialogBooking = event.target.closest("[data-dialog-booking]");
    if (dialogBooking) $("#artistDialog").close();
  });

  $(".dialog-close").addEventListener("click", () => $("#artistDialog").close());

  $("#bookingForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const artists = activeArtists();
    if (!artists.length) {
      $("#bookingMessage").textContent = "Hien chua co artist dang hien thi de nhan booking.";
      return;
    }
    const formData = new FormData(form);
    const booking = Object.fromEntries(formData.entries());
    booking.id = uid("bk");
    booking.artistId = artists.length === 1 ? artists[0].id : booking.artistId;
    booking.status = "Pending";
    data.bookings.unshift(booking);
    saveData();
    form.reset();
    renderAll();
    $("#bookingMessage").textContent = "Da gui booking. Admin co the xem yeu cau o dashboard.";
  });

  $("#loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const ok = form.elements.username.value === "admin" && form.elements.password.value === "admin123";
    $("#loginMessage").textContent = ok ? "" : "Sai tai khoan hoac mat khau demo.";
    if (ok) setAdminVisible(true);
  });

  $("#logoutBtn").addEventListener("click", () => setAdminVisible(false));

  $("#resetDemo").addEventListener("click", () => {
    data = structuredClone(seedData);
    saveData();
    setAdminVisible(false);
    renderAll();
  });

  $("#bookingRows").addEventListener("change", (event) => {
    const select = event.target.closest("[data-booking-status]");
    if (!select) return;
    const booking = data.bookings.find((item) => item.id === select.dataset.bookingStatus);
    booking.status = select.value;
    saveData();
    renderAll();
  });

  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".tab").forEach((item) => item.classList.remove("active"));
      $$(".tab-panel").forEach((panel) => panel.classList.remove("active"));
      tab.classList.add("active");
      $(`#${tab.dataset.tab}`).classList.add("active");
    });
  });

  $("#artistForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    data.artists.push({
      id: uid("artist"),
      name: formData.get("name"),
      specialty: formData.get("specialty"),
      years: Number(formData.get("years") || 0),
      visible: true,
      bio: "Artist moi cua studio, thong tin chi tiet se duoc cap nhat sau.",
      styleIds: ["minimal"]
    });
    saveData();
    event.currentTarget.reset();
    renderAll();
  });

  $("#serviceForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    data.services.push({
      id: uid("service"),
      name: formData.get("name"),
      price: formData.get("price"),
      description: "Dich vu moi cua studio."
    });
    saveData();
    event.currentTarget.reset();
    renderAll();
  });

  $("#blogForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    data.blog.unshift({
      id: uid("blog"),
      title: formData.get("title"),
      tag: formData.get("tag"),
      excerpt: "Ban nhap noi dung chi tiet trong giai doan ket noi CMS/API."
    });
    saveData();
    event.currentTarget.reset();
    renderAll();
  });

  $("#settingsForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    data.studio = Object.fromEntries(formData.entries());
    saveData();
    $("#settingsMessage").textContent = "Da luu cau hinh studio demo.";
  });
}

renderAll();
attachEvents();
setAdminVisible(localStorage.getItem(adminKey) === "1");

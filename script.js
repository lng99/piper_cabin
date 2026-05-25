const form = document.querySelector("#contactForm");
const status = document.querySelector("#formStatus");

let siteContent = null;

loadSiteContent()
  .then((content) => {
    if (content) {
      siteContent = content;
      renderSite(content);
    }
  })
  .finally(() => {
    initCarousels();
    initForm();
    initCabinModal();
    initLightbox();
  });

async function loadSiteContent() {
  try {
    const response = await fetch("content/site.json", { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function renderSite(content) {
  setText("title", `${content.brand.name} | Fabricación de cabañas a medida`);
  setAttribute('meta[name="description"]', "content", content.hero.text);

  setText(".brand strong", content.brand.name);
  setText(".brand small", content.brand.subtitle);
  setImage(".brand-mark img", content.brand.logo, content.brand.name);

  setImage(".hero-image", content.hero.image, content.hero.imageAlt);
  setText(".hero .eyebrow", content.hero.eyebrow);
  setText(".hero h1", content.hero.title);
  setText(".hero-content p:not(.eyebrow)", content.hero.text);
  setText(".hero .button.primary", content.hero.primaryButton);
  setText(".hero .button.ghost", content.hero.secondaryButton);

  renderStats(content.stats || []);
  renderAbout(content.about || {});
  renderGallery(content.gallery || {});
  renderServices(content.services || {});
  renderContact(content.contact || {});

  setText(".footer p", content.footer.name);
  setText(".footer span", content.footer.text);
}

function renderStats(stats) {
  const container = document.querySelector(".proof-bar");
  if (!container || !stats.length) return;

  container.innerHTML = stats
    .map((item) => `<article><strong>${escapeHtml(item.value)}</strong><span>${escapeHtml(item.label)}</span></article>`)
    .join("");
}

function renderAbout(about) {
  setImage(".intro-media img", about.image, about.imageAlt);
  setText(".intro-copy .eyebrow", about.eyebrow);
  setText(".intro-copy h2", about.title);
  setText(".intro-copy p:not(.eyebrow)", about.text);

  const list = document.querySelector(".check-list");
  if (!list || !about.bullets) return;
  list.innerHTML = about.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderGallery(gallery) {
  setText(".gallery-section .eyebrow", gallery.eyebrow);
  setText(".gallery-section .section-heading h2", gallery.title);
  setText(".carousel-heading h3", gallery.carouselTitle);

  const track = document.querySelector('[data-carousel="exterior"]');
  if (!track || !gallery.items) return;
  track.innerHTML = gallery.items
    .map(
      (item, index) => `
        <figure class="cabin-card" data-cabin-index="${index}" role="button" tabindex="0" aria-label="Ver detalle de ${escapeAttribute(item.name || item.caption)}">
          <img src="${escapeAttribute(item.image)}" alt="${escapeAttribute(item.alt || item.caption || "Cabaña de madera")}" />
          <figcaption>${escapeHtml(item.caption)}</figcaption>
          <div class="cabin-card-overlay">
            <span class="cabin-card-cta">Ver más <span aria-hidden="true">→</span></span>
          </div>
        </figure>
      `,
    )
    .join("");

  // Bind click events on newly rendered cards
  track.querySelectorAll(".cabin-card").forEach((card) => {
    card.addEventListener("click", () => openCabinModal(parseInt(card.dataset.cabinIndex, 10)));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openCabinModal(parseInt(card.dataset.cabinIndex, 10));
      }
    });
  });
}

function renderServices(services) {
  setText(".services .eyebrow", services.eyebrow);
  setText(".services .section-heading h2", services.title);
  setText(".services .text-link", services.cta);

  const grid = document.querySelector(".service-grid");
  if (!grid || !services.items) return;
  grid.innerHTML = services.items
    .map(
      (item) => `
        <article>
          <span>${escapeHtml(item.number)}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.text)}</p>
        </article>
      `,
    )
    .join("");
}

function renderContact(contact) {
  setText(".contact-panel .eyebrow", contact.eyebrow);
  setText(".contact-panel h2", contact.title);
  setText(".contact-panel > p", contact.text);

  const list = document.querySelector(".contact-list");
  if (list) {
    list.innerHTML = `
      ${contactItem("assets/logos/icono_wpp.png", "contact-icon-large", contact.phone, contact.phoneLabel)}
      ${contactItem("assets/logos/icono_gmail.png", "contact-icon-gmail", contact.email, contact.emailLabel)}
      <li>
        <img class="contact-icon contact-icon-facebook" src="assets/logos/icono_facebook.png" alt="" aria-hidden="true" />
        <div>
          <strong><a href="${escapeAttribute(contact.facebookUrl)}" target="_blank" rel="noreferrer">${escapeHtml(contact.facebookName)}</a></strong>
          <span>${escapeHtml(contact.facebookLabel)}</span>
        </div>
      </li>
      ${contactItem("assets/logos/icono_ubicacion.png", "", contact.address, contact.addressLabel)}
    `;
  }

  const whatsapp = document.querySelector(".contact-panel .button.primary");
  if (whatsapp) {
    whatsapp.textContent = contact.whatsappButton;
    whatsapp.href = whatsappUrl(contact.whatsappNumber, contact.whatsappMessage);
  }
}

function contactItem(icon, extraClass, title, label) {
  return `
    <li>
      <img class="contact-icon ${extraClass}" src="${escapeAttribute(icon)}" alt="" aria-hidden="true" />
      <div>
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(label)}</span>
      </div>
    </li>
  `;
}

// ─── Carrusel ────────────────────────────────────────────────────────────────

function initCarousels() {
  document.querySelectorAll("[data-carousel-next]").forEach((button) => {
    button.addEventListener("click", () => moveCarousel(button.dataset.carouselNext, 1));
  });

  document.querySelectorAll("[data-carousel-prev]").forEach((button) => {
    button.addEventListener("click", () => moveCarousel(button.dataset.carouselPrev, -1));
  });
}

function moveCarousel(name, direction) {
  const track = document.querySelector(`[data-carousel="${name}"]`);
  if (!track) return;

  const card = track.querySelector("figure");
  const step = card ? card.getBoundingClientRect().width + 18 : 360;
  track.scrollBy({ left: step * direction, behavior: "smooth" });
}

// ─── Modal de cabaña ─────────────────────────────────────────────────────────

let currentCabinIndex = -1;
let currentHeroImages = [];
let currentHeroImageIndex = 0;

const modalOverlay = document.getElementById("cabinModalOverlay");
const modalClose = document.getElementById("cabinModalClose");
const modalHeroImg = document.getElementById("cabinModalHeroImg");
const modalTitle = document.getElementById("cabinModalTitle");
const modalDesc = document.getElementById("cabinModalDesc");
const modalDetails = document.getElementById("cabinModalDetails");
const interiorSection = document.getElementById("cabinInteriorSection");
const interiorGallery = document.getElementById("cabinInteriorGallery");
const constructionSection = document.getElementById("cabinConstructionSection");
const constructionGallery = document.getElementById("cabinConstructionGallery");
const heroPrevBtn = document.getElementById("heroPrev");
const heroNextBtn = document.getElementById("heroNext");
const heroCounter = document.getElementById("heroCounter");

function initCabinModal() {
  if (!modalOverlay) return;

  modalClose.addEventListener("click", closeCabinModal);

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeCabinModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalOverlay.hidden) closeCabinModal();
  });

  // Click en cards estáticas del HTML (si no se renderizaron desde JS)
  document.querySelectorAll(".cabin-card").forEach((card) => {
    card.addEventListener("click", () => openCabinModal(parseInt(card.dataset.cabinIndex, 10)));
  });

  if (modalHeroImg) {
    modalHeroImg.addEventListener("click", () => {
      if (currentHeroImages.length > 0) {
        openLightbox(currentHeroImages, currentHeroImageIndex);
      }
    });
  }

  if (heroPrevBtn) heroPrevBtn.addEventListener("click", (e) => { e.stopPropagation(); moveHeroCarousel(-1); });
  if (heroNextBtn) heroNextBtn.addEventListener("click", (e) => { e.stopPropagation(); moveHeroCarousel(1); });
}

function updateHeroImage() {
  if (currentHeroImages.length === 0) return;
  const img = currentHeroImages[currentHeroImageIndex];
  modalHeroImg.src = img.image || "";
  modalHeroImg.alt = img.alt || "";
  
  if (currentHeroImages.length > 1) {
    if (heroPrevBtn) heroPrevBtn.style.display = "";
    if (heroNextBtn) heroNextBtn.style.display = "";
    if (heroCounter) {
      heroCounter.style.display = "";
      heroCounter.textContent = `${currentHeroImageIndex + 1} / ${currentHeroImages.length}`;
    }
  } else {
    if (heroPrevBtn) heroPrevBtn.style.display = "none";
    if (heroNextBtn) heroNextBtn.style.display = "none";
    if (heroCounter) heroCounter.style.display = "none";
  }
}

function moveHeroCarousel(dir) {
  if (currentHeroImages.length <= 1) return;
  currentHeroImageIndex = (currentHeroImageIndex + dir + currentHeroImages.length) % currentHeroImages.length;
  updateHeroImage();
}

function openCabinModal(index) {
  const items = siteContent?.gallery?.items;
  if (!items || !items[index]) return;

  currentCabinIndex = index;
  const cabin = items[index];

  currentHeroImages = [{ image: cabin.image, alt: cabin.alt || cabin.name || "" }];
  if (cabin.exteriorImages && cabin.exteriorImages.length > 0) {
    currentHeroImages = currentHeroImages.concat(cabin.exteriorImages);
  }
  currentHeroImageIndex = 0;
  updateHeroImage();

  modalTitle.textContent = cabin.name || cabin.caption || "";
  modalDesc.textContent = cabin.description || "";
  modalDesc.hidden = !cabin.description;

  // Datos clave
  if (cabin.details && cabin.details.length > 0) {
    modalDetails.hidden = false;
    modalDetails.innerHTML = cabin.details
      .map((d) => `<div class="cabin-detail-chip"><span class="chip-label">${escapeHtml(d.label)}</span><span class="chip-value">${escapeHtml(d.value)}</span></div>`)
      .join("");
  } else {
    modalDetails.hidden = true;
    modalDetails.innerHTML = "";
  }

  // Galería interior
  renderModalGallery(interiorSection, interiorGallery, cabin.interiorImages || [], "interior");

  // Galería proceso
  renderModalGallery(constructionSection, constructionGallery, cabin.constructionImages || [], "construction");

  // CTA
  const ctaBtn = document.getElementById("cabinModalCtaBtn");
  if (ctaBtn) {
    const msg = encodeURIComponent(`Hola, me interesa consultar por la cabaña: ${cabin.name || cabin.caption}`);
    const number = siteContent?.contact?.whatsappNumber || "540111524967668";
    ctaBtn.href = `https://wa.me/${number}?text=${msg}`;
    ctaBtn.textContent = "Consultar este proyecto";
  }

  modalOverlay.hidden = false;
  document.body.classList.add("modal-open");
  modalClose.focus();
}

function renderModalGallery(section, gallery, images, type) {
  if (!images || images.length === 0) {
    section.hidden = true;
    gallery.innerHTML = "";
    return;
  }

  section.hidden = false;
  gallery.innerHTML = images
    .map(
      (img, i) => `
        <button class="modal-thumb" data-gallery-type="${type}" data-gallery-index="${i}" aria-label="Ampliar foto ${i + 1}">
          <img src="${escapeAttribute(img.image)}" alt="${escapeAttribute(img.alt || "")}" loading="lazy" />
        </button>
      `,
    )
    .join("");

  gallery.querySelectorAll(".modal-thumb").forEach((btn) => {
    btn.addEventListener("click", () => {
      const galleryType = btn.dataset.galleryType;
      const idx = parseInt(btn.dataset.galleryIndex, 10);
      const cabin = siteContent?.gallery?.items?.[currentCabinIndex];
      if (!cabin) return;
      const imgs = galleryType === "interior" ? cabin.interiorImages : cabin.constructionImages;
      openLightbox(imgs || [], idx);
    });
  });
}

function closeCabinModal() {
  modalOverlay.hidden = true;
  document.body.classList.remove("modal-open");
}

// ─── Lightbox ────────────────────────────────────────────────────────────────

let lightboxImages = [];
let lightboxIndex = 0;

const lightboxOverlay = document.getElementById("lightboxOverlay");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxPrev = document.getElementById("lightboxPrev");
const lightboxNext = document.getElementById("lightboxNext");
const lightboxClose = document.getElementById("lightboxClose");

function initLightbox() {
  if (!lightboxOverlay) return;

  lightboxClose.addEventListener("click", closeLightbox);
  lightboxOverlay.addEventListener("click", (e) => {
    if (e.target === lightboxOverlay) closeLightbox();
  });
  lightboxPrev.addEventListener("click", (e) => { e.stopPropagation(); moveLightbox(-1); });
  lightboxNext.addEventListener("click", (e) => { e.stopPropagation(); moveLightbox(1); });

  document.addEventListener("keydown", (e) => {
    if (lightboxOverlay.hidden) return;
    if (e.key === "ArrowLeft") moveLightbox(-1);
    if (e.key === "ArrowRight") moveLightbox(1);
    if (e.key === "Escape") closeLightbox();
  });
}

function openLightbox(images, index) {
  lightboxImages = images;
  lightboxIndex = index;
  updateLightboxImage();
  lightboxOverlay.hidden = false;
}

function updateLightboxImage() {
  const img = lightboxImages[lightboxIndex];
  if (!img) return;
  lightboxImg.src = img.image || "";
  lightboxImg.alt = img.alt || "";
  lightboxPrev.style.display = lightboxImages.length > 1 ? "" : "none";
  lightboxNext.style.display = lightboxImages.length > 1 ? "" : "none";
}

function moveLightbox(dir) {
  lightboxIndex = (lightboxIndex + dir + lightboxImages.length) % lightboxImages.length;
  updateLightboxImage();
}

function closeLightbox() {
  lightboxOverlay.hidden = true;
  lightboxImages = [];
}

// ─── Formulario ──────────────────────────────────────────────────────────────

function initForm() {
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const message = [
      siteContent?.contact?.whatsappMessage || "Hola, quiero pedir presupuesto para una cabaña.",
      `Nombre: ${data.get("nombre")}`,
      `Teléfono: ${data.get("telefono")}`,
      `Ubicación: ${data.get("ubicacion")}`,
      `Tipo de cabaña: ${data.get("tipo")}`,
      `Mensaje: ${data.get("mensaje")}`,
    ].join("\n");

    const number = siteContent?.contact?.whatsappNumber || "540111524967668";
    const url = whatsappUrl(number, message);
    status.textContent = "Listo. Te llevo a WhatsApp con el mensaje preparado.";
    window.open(url, "_blank", "noopener,noreferrer");
    form.reset();
  });
}

// ─── Utilidades ──────────────────────────────────────────────────────────────

function whatsappUrl(number, message) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element && value !== undefined) element.textContent = value;
}

function setAttribute(selector, attribute, value) {
  const element = document.querySelector(selector);
  if (element && value !== undefined) element.setAttribute(attribute, value);
}

function setImage(selector, src, alt) {
  const image = document.querySelector(selector);
  if (!image || !src) return;
  image.src = src;
  if (alt !== undefined) image.alt = alt;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value = "") {
  return escapeHtml(value);
}

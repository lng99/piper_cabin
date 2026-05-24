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
      (item) => `
        <figure>
          <img src="${escapeAttribute(item.image)}" alt="${escapeAttribute(item.alt || item.caption || "Cabaña de madera")}" />
          <figcaption>${escapeHtml(item.caption)}</figcaption>
        </figure>
      `,
    )
    .join("");
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

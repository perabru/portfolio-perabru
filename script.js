const GITHUB_USER = "perabru";

const categoryConfig = [
  {
    id: "robotica",
    title: "Robótica, Arduino e IoT",
    keywords: ["arduino", "robo", "robô", "sumo", "sumô", "esp", "iot", "mqtt", "sensor", "ponte", "h", "motor", "wokwi", "tinkercad"]
  },
  {
    id: "android",
    title: "Android, Kotlin e Firebase",
    keywords: ["android", "kotlin", "firebase", "app", "derma", "cantina", "mobile", "leaf", "fit", "ecotherms"]
  },
  {
    id: "web",
    title: "Web, Sistemas e Dashboards",
    keywords: ["site", "web", "html", "css", "javascript", "dashboard", "sistema", "simulador", "reels", "materiais", "prova"]
  },
  {
    id: "educacao",
    title: "Educação e Ferramentas Didáticas",
    keywords: ["educacao", "educação", "prova", "atividade", "aula", "ensino", "adaptacao", "adaptação", "escola"]
  },
  {
    id: "outros",
    title: "Outros Repositórios",
    keywords: []
  }
];

const featuredDescriptions = {
  "ponte-H-arduino": "Controle de motores DC com Arduino e Ponte H L298N.",
  "sumo-robos-2026": "Robô sumô com Arduino, sensores e estratégia de combate.",
  "selecao-materiais": "Sistema web para seleção de materiais.",
  "gerenciador-reels": "Protótipo web para organização de publicações.",
  "SumoBotStudio": "Ambiente para simulação de robôs sumô.",
  "sistema-adaptacao-prova": "Sistema educacional para adaptação de avaliações.",
  "DermaSkin2": "Aplicativo Android para triagem dermatológica.",
  "appCantina26": "Aplicativo Android para pedidos de cantina.",
  "LeafHeathi": "Aplicativo para análise de saúde de folhas."
};

let allRepos = [];
let filteredRepos = [];

const el = {
  cursorGlow: document.getElementById("cursorGlow"),
  menuToggle: document.getElementById("menuToggle"),
  nav: document.getElementById("nav"),
  avatar: document.getElementById("avatar"),
  profileName: document.getElementById("profileName"),
  profileBio: document.getElementById("profileBio"),
  repoCount: document.getElementById("repoCount"),
  followersCount: document.getElementById("followersCount"),
  followingCount: document.getElementById("followingCount"),
  totalRepos: document.getElementById("totalRepos"),
  totalLanguages: document.getElementById("totalLanguages"),
  lastUpdated: document.getElementById("lastUpdated"),
  searchInput: document.getElementById("searchInput"),
  sortFilter: document.getElementById("sortFilter"),
  projectMenu: document.getElementById("projectMenu"),
  emptyState: document.getElementById("emptyState"),
  repoTemplate: document.getElementById("repoTemplate"),
  year: document.getElementById("year")
};

el.year.textContent = new Date().getFullYear();

el.menuToggle.addEventListener("click", () => {
  el.nav.classList.toggle("open");
});

document.querySelectorAll(".nav a").forEach(link => {
  link.addEventListener("click", () => el.nav.classList.remove("open"));
});

document.addEventListener("mousemove", event => {
  el.cursorGlow.style.opacity = "1";
  el.cursorGlow.style.left = `${event.clientX}px`;
  el.cursorGlow.style.top = `${event.clientY}px`;
});

el.searchInput.addEventListener("input", applyFilters);
el.sortFilter.addEventListener("change", applyFilters);

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

function observeReveals() {
  document.querySelectorAll(".reveal").forEach(item => observer.observe(item));
}

async function init() {
  observeReveals();

  try {
    const [profile, repos] = await Promise.all([
      fetchProfile(),
      fetchRepos()
    ]);

    allRepos = repos.filter(repo => !repo.fork);
    filteredRepos = [...allRepos];

    renderProfile(profile);
    renderMetrics();
    renderProjectMenu(filteredRepos);

    setTimeout(observeReveals, 100);
  } catch (error) {
    console.error(error);
    el.projectMenu.innerHTML = `
      <div class="empty-state">
        <h3>Não foi possível carregar os projetos.</h3>
      </div>
    `;
  }
}

async function fetchProfile() {
  const response = await fetch(`https://api.github.com/users/${GITHUB_USER}`);
  if (!response.ok) throw new Error("Erro ao carregar perfil.");
  return response.json();
}

async function fetchRepos() {
  const repos = [];
  let page = 1;

  while (true) {
    const response = await fetch(
      `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&page=${page}&sort=updated`
    );

    if (!response.ok) throw new Error("Erro ao carregar repositórios.");

    const data = await response.json();
    repos.push(...data);

    if (data.length < 100) break;
    page++;
  }

  return repos;
}

function renderProfile(profile) {
  el.avatar.src = profile.avatar_url;
  el.profileName.textContent = profile.name || "Bruno Michel Pera";
  el.profileBio.textContent = profile.bio || "Professor, engenheiro de computação e desenvolvedor.";
  el.repoCount.textContent = profile.public_repos ?? allRepos.length;
  el.followersCount.textContent = profile.followers ?? "--";
  el.followingCount.textContent = profile.following ?? "--";
}

function renderMetrics() {
  const languages = new Set(allRepos.map(repo => repo.language || "Outros"));

  el.totalRepos.textContent = allRepos.length;
  el.totalLanguages.textContent = languages.size;
  el.lastUpdated.textContent = allRepos[0] ? formatDate(allRepos[0].updated_at) : "--";
}

function applyFilters() {
  const term = normalize(el.searchInput.value);
  const sort = el.sortFilter.value;

  filteredRepos = allRepos.filter(repo => {
    const searchable = normalize([
      repo.name,
      repo.description,
      repo.language,
      repo.topics?.join(" ")
    ].filter(Boolean).join(" "));

    return !term || searchable.includes(term);
  });

  if (sort === "name") {
    filteredRepos.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (sort === "stars") {
    filteredRepos.sort((a, b) => b.stargazers_count - a.stargazers_count);
  }

  if (sort === "updated") {
    filteredRepos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }

  renderProjectMenu(filteredRepos);
}

function renderProjectMenu(repos) {
  el.projectMenu.innerHTML = "";

  if (!repos.length) {
    el.emptyState.classList.remove("hidden");
    return;
  }

  el.emptyState.classList.add("hidden");

  const categorized = categorizeRepos(repos);

  categoryConfig.forEach((category, index) => {
    const categoryRepos = categorized[category.id] || [];

    if (!categoryRepos.length) return;

    const item = document.createElement("article");
    item.className = "accordion-item";

    if (index === 0) {
      item.classList.add("open");
    }

    item.innerHTML = `
      <button class="accordion-button" type="button" aria-expanded="${index === 0 ? "true" : "false"}">
        <h3>${category.title}</h3>
        <span class="count">${categoryRepos.length}</span>
      </button>
      <div class="accordion-content">
        <div class="accordion-inner">
          <div class="repo-grid"></div>
        </div>
      </div>
    `;

    const grid = item.querySelector(".repo-grid");
    categoryRepos.forEach(repo => {
      grid.appendChild(createRepoCard(repo));
    });

    const button = item.querySelector(".accordion-button");
    button.addEventListener("click", () => {
      const isOpen = item.classList.toggle("open");
      button.setAttribute("aria-expanded", String(isOpen));
    });

    el.projectMenu.appendChild(item);
  });
}

function categorizeRepos(repos) {
  const result = Object.fromEntries(categoryConfig.map(category => [category.id, []]));

  repos.forEach(repo => {
    const text = normalize([
      repo.name,
      repo.description,
      repo.language,
      repo.topics?.join(" ")
    ].filter(Boolean).join(" "));

    const category = categoryConfig.find(category => {
      if (category.id === "outros") return false;
      return category.keywords.some(keyword => text.includes(normalize(keyword)));
    });

    if (category) {
      result[category.id].push(repo);
    } else {
      result.outros.push(repo);
    }
  });

  return result;
}

function createRepoCard(repo) {
  const node = el.repoTemplate.content.cloneNode(true);

  const language = node.querySelector(".repo-language");
  const stars = node.querySelector(".repo-stars");
  const title = node.querySelector("h3");
  const description = node.querySelector(".repo-description");
  const date = node.querySelector(".repo-date");
  const link = node.querySelector(".repo-link");
  const demo = node.querySelector(".repo-demo");

  language.textContent = repo.language || "Projeto";
  stars.textContent = `★ ${repo.stargazers_count}`;
  title.textContent = repo.name;
  description.textContent =
    featuredDescriptions[repo.name] ||
    repo.description ||
    "Repositório público no GitHub.";

  date.textContent = formatDate(repo.updated_at);
  link.href = repo.html_url;

  if (repo.homepage) {
    demo.href = repo.homepage;
    demo.classList.remove("hidden");
  }

  return node;
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

init();

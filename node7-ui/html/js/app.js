(() => {
  'use strict';

  const NAMESPACE = 'node7-ui';
  const root = document.getElementById('n7ui-root');
  if (!root) return;

  const shell = root.querySelector('.n7ui-shell');
  const mainScene = root.querySelector('.n7ui-main-scene');
  const contentHost = document.getElementById('n7ui-content-host');
  const orbit = document.getElementById('n7ui-module-orbit');
  const screenScenes = document.getElementById('n7ui-screen-scenes');
  const categoryConstellation = document.getElementById('n7ui-category-constellation');
  const pagePips = document.getElementById('n7ui-page-pips');
  const modalLayer = document.getElementById('n7ui-modal-layer');
  const toastStack = document.getElementById('n7ui-toast-stack');

  const elements = {
    title: document.getElementById('n7ui-title'),
    subtitle: document.getElementById('n7ui-subtitle'),
    statusLeft: document.getElementById('n7ui-status-left'),
    statusRight: document.getElementById('n7ui-status-right'),
    compassIcon: document.getElementById('n7ui-compass-icon'),
    compassLabel: document.getElementById('n7ui-compass-label'),
    compassCount: document.getElementById('n7ui-compass-count'),
    sceneKicker: document.getElementById('n7ui-scene-kicker'),
    screenTitle: document.getElementById('n7ui-screen-title'),
    screenDescription: document.getElementById('n7ui-screen-description'),
    viewLabel: document.getElementById('n7ui-view-label'),
    pageLabel: document.getElementById('n7ui-page-label'),
    categoryPrev: document.getElementById('n7ui-category-prev'),
    categoryNext: document.getElementById('n7ui-category-next'),
    pagePrev: document.getElementById('n7ui-page-prev'),
    pageNext: document.getElementById('n7ui-page-next'),
    inspectorBadge: document.getElementById('n7ui-inspector-badge'),
    inspectorName: document.getElementById('n7ui-inspector-name'),
    inspectorType: document.getElementById('n7ui-inspector-type'),
    inspectorPreview: document.getElementById('n7ui-large-preview'),
    inspectorDescription: document.getElementById('n7ui-inspector-description'),
    inspectorStats: document.getElementById('n7ui-inspector-stats'),
    inspectorActions: document.getElementById('n7ui-inspector-actions'),
    controls: document.getElementById('n7ui-controls'),
    message: document.getElementById('n7ui-message'),
    modalBadge: document.getElementById('n7ui-modal-badge'),
    modalTitle: document.getElementById('n7ui-modal-title'),
    modalMessage: document.getElementById('n7ui-modal-message'),
    modalFields: document.getElementById('n7ui-modal-fields'),
    modalActions: document.getElementById('n7ui-modal-actions')
  };

  const VIEW_PAGE_SIZE = {
    grid: 6,
    list: 5,
    dashboard: 6,
    table: 5,
    components: 6,
    dialogue: 4,
    form: 4,
    dual: 6,
    tree: 9
  };

  const state = {
    open: false,
    payload: null,
    modules: [],
    moduleIndex: 0,
    screenIndex: 0,
    categoryIndex: 0,
    categoryWindow: 0,
    page: 0,
    selectedIndex: 0,
    modalOpen: false,
    resourceName: '',
    browserPreviewTimer: null
  };

  const SOUND_FILES = Object.freeze({
    open: 'sounds/ui_open.wav',
    close: 'sounds/ui_close.wav',
    navigate: 'sounds/navigate.wav',
    focus: 'sounds/focus.wav',
    select: 'sounds/select.wav',
    confirm: 'sounds/confirm.wav',
    cancel: 'sounds/cancel.wav',
    modal: 'sounds/modal.wav',
    info: 'sounds/notify_info.wav',
    success: 'sounds/notify_success.wav',
    warning: 'sounds/notify_warning.wav',
    error: 'sounds/notify_error.wav'
  });

  const soundState = {
    enabled: true,
    volume: 0.38,
    cooldown: 30,
    lastPlayed: new Map(),
    pools: new Map(),
    hoverTarget: null
  };

  function configureSounds(source = {}) {
    const settings = asObject(source);
    if (typeof settings.soundEnabled === 'boolean') soundState.enabled = settings.soundEnabled;
    const volume = Number(settings.soundVolume);
    if (Number.isFinite(volume)) soundState.volume = clamp(volume, 0, 1);
    const cooldown = Number(settings.soundCooldown);
    if (Number.isFinite(cooldown)) soundState.cooldown = clamp(cooldown, 0, 500);
  }

  function audioPool(name) {
    if (!SOUND_FILES[name] || typeof Audio !== 'function') return [];
    if (!soundState.pools.has(name)) {
      const pool = Array.from({ length: 3 }, () => {
        const audio = new Audio(SOUND_FILES[name]);
        audio.preload = 'auto';
        return audio;
      });
      soundState.pools.set(name, pool);
    }
    return soundState.pools.get(name);
  }

  function preloadSounds() {
    Object.keys(SOUND_FILES).forEach(name => {
      audioPool(name).forEach(audio => {
        try { audio.load(); } catch (_) {}
      });
    });
  }

  function playSound(name, options = {}) {
    const settings = asObject(options);
    if (!soundState.enabled || settings.silent === true || !SOUND_FILES[name]) return false;

    const now = performance.now();
    const cooldown = Number.isFinite(Number(settings.cooldown)) ? Number(settings.cooldown) : soundState.cooldown;
    const last = soundState.lastPlayed.get(name) || 0;
    if (settings.force !== true && now - last < cooldown) return false;
    soundState.lastPlayed.set(name, now);

    const pool = audioPool(name);
    if (!pool.length) return false;
    let audio = pool.find(entry => entry.paused || entry.ended);
    if (!audio) audio = pool[0];

    try {
      audio.pause();
      audio.currentTime = 0;
      const multiplier = Number.isFinite(Number(settings.volume)) ? clamp(Number(settings.volume), 0, 1) : 1;
      audio.volume = clamp(soundState.volume * multiplier, 0, 1);
      const result = audio.play();
      if (result && typeof result.catch === 'function') result.catch(() => {});
      return true;
    } catch (_) {
      return false;
    }
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function asObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function text(value, fallback = '') {
    return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback;
  }

  function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
  }

  function wrap(value, length) {
    if (length <= 0) return 0;
    return ((value % length) + length) % length;
  }

  function monogram(value) {
    const source = asObject(value);
    const explicit = text(source.icon, '').trim();
    if (explicit) return explicit.slice(0, 3).toUpperCase();
    return text(source.label || source.name || source.title, 'N7')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase();
  }

  function normalizeStatus(value, fallbackLabel, fallbackValue) {
    const source = asObject(value);
    return {
      label: text(source.label, fallbackLabel),
      value: text(source.value, fallbackValue)
    };
  }

  function normalizePayload(payload) {
    const source = asObject(payload);
    const modules = asArray(source.modules).map((module, moduleIndex) => ({
      ...module,
      id: text(module.id, `module_${moduleIndex}`),
      label: text(module.label, `Module ${moduleIndex + 1}`),
      screens: asArray(module.screens).map((screen, screenIndex) => ({
        ...screen,
        id: text(screen.id, `screen_${screenIndex}`),
        label: text(screen.label, `Scene ${screenIndex + 1}`),
        title: text(screen.title, text(screen.label, `Scene ${screenIndex + 1}`)),
        description: text(screen.description, 'Reusable NODE7 interface scene.'),
        view: text(screen.view, 'grid'),
        categories: asArray(screen.categories)
      }))
    })).filter(module => module.screens.length > 0);

    return {
      ...source,
      title: text(source.title, 'NODE7 Dominion'),
      subtitle: text(source.subtitle, 'ESO × Red Dead interface system'),
      statusLeft: normalizeStatus(source.statusLeft, 'NODE7 Framework', 'Universal UI Shell'),
      statusRight: normalizeStatus(source.statusRight, 'Preview State', 'Scene Navigation'),
      controls: asArray(source.controls),
      imageBase: text(source.imageBase, ''),
      soundEnabled: typeof source.soundEnabled === 'boolean' ? source.soundEnabled : soundState.enabled,
      soundVolume: Number.isFinite(Number(source.soundVolume)) ? clamp(Number(source.soundVolume), 0, 1) : soundState.volume,
      soundCooldown: Number.isFinite(Number(source.soundCooldown)) ? clamp(Number(source.soundCooldown), 0, 500) : soundState.cooldown,
      startModule: text(source.startModule, modules[0]?.id || ''),
      startScreen: text(source.startScreen, ''),
      modules
    };
  }

  function currentModule() {
    return state.modules[state.moduleIndex] || state.modules[0] || { id: 'default', label: 'Interface', screens: [] };
  }

  function currentScreen() {
    const module = currentModule();
    return module.screens[state.screenIndex] || module.screens[0] || {
      id: 'default',
      label: 'Scene',
      title: 'Scene',
      description: 'Reusable NODE7 interface scene.',
      view: 'grid',
      categories: []
    };
  }

  function currentCategories() {
    const categories = asArray(currentScreen().categories);
    return categories.length ? categories : [{ id: 'all', label: 'Overview' }];
  }

  function currentCategory() {
    const categories = currentCategories();
    return categories[state.categoryIndex] || categories[0];
  }

  function setStatus(node, status) {
    node.replaceChildren(document.createTextNode(text(status.label, 'Status')));
    const strong = document.createElement('strong');
    strong.textContent = text(status.value, 'Ready');
    node.appendChild(strong);
  }

  function setMessage(message) {
    elements.message.textContent = text(message, 'NODE7 scene shell ready.');
  }

  function resolveImage(item) {
    const source = asObject(item);
    const explicit = text(source.image, '').trim();
    if (explicit) {
      if (/^(https?:|data:|blob:|nui:)/i.test(explicit) || explicit.startsWith('https://cfx-nui-')) return explicit;
      const imageResource = text(source.imageResource, '').trim();
      if (imageResource) return `https://cfx-nui-${imageResource}/${explicit.replace(/^\/+/, '')}`;
      if (explicit.includes('/')) return explicit;
      if (state.payload?.imageBase) return `${state.payload.imageBase}/${encodeURIComponent(explicit)}`;
    }
    const itemName = text(source.item, '').trim();
    if (itemName && state.payload?.imageBase) return `${state.payload.imageBase}/${encodeURIComponent(itemName)}.png`;
    return '';
  }

  function createImageSlot(item, className) {
    const slot = document.createElement('span');
    slot.className = className;
    const fallback = document.createElement('span');
    fallback.textContent = monogram(item);
    slot.appendChild(fallback);

    const imageUrl = resolveImage(item);
    if (!imageUrl) return slot;

    const image = document.createElement('img');
    image.alt = text(item.alt || item.label || item.name, 'Preview image');
    image.hidden = true;
    image.addEventListener('load', () => {
      fallback.hidden = true;
      image.hidden = false;
    }, { once: true });
    image.addEventListener('error', () => image.remove(), { once: true });
    image.src = imageUrl;
    slot.appendChild(image);
    return slot;
  }

  function moduleTheme(module) {
    const id = text(module?.id, 'commerce').toLowerCase();
    const known = ['commerce', 'creation', 'character', 'world', 'organizations', 'services', 'social', 'travel', 'activities', 'medical', 'records', 'administration', 'components'];
    return known.includes(id) ? id : 'commerce';
  }

  function showRoot() {
    root.classList.remove('n7ui-toast-only');
    root.hidden = false;
    state.open = true;
  }

  function hideRoot(options = {}) {
    const wasOpen = state.open;
    state.open = false;
    state.modalOpen = false;
    modalLayer.hidden = true;
    root.classList.remove('n7ui-toast-only');
    root.hidden = true;
    if (wasOpen && options.sound !== false) playSound('close', { force: true });
  }

  async function nuiPost(callbackName, data = {}) {
    const resourceName = state.resourceName || (typeof GetParentResourceName === 'function' ? GetParentResourceName() : 'node7-ui');
    if (!resourceName || typeof GetParentResourceName !== 'function') return { ok: true, browser: true };

    try {
      const response = await fetch(`https://${resourceName}/${callbackName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (_) {
      return { ok: false };
    }
  }

  function dispatchAction(kind, detail) {
    playSound(kind === 'cancel' ? 'cancel' : 'confirm');
    const data = {
      kind,
      payloadId: text(state.payload?.id, ''),
      moduleId: currentModule().id,
      screenId: currentScreen().id,
      categoryId: currentCategory()?.id || 'all',
      ...asObject(detail)
    };
    nuiPost('node7ui_action', data);
    window.dispatchEvent(new CustomEvent('node7-ui:action', { detail: data }));
    setMessage(`${text(detail?.actionLabel || detail?.label || kind, 'Action')} selected.`);
  }

  function categoryMatches(entry) {
    const category = text(currentCategory()?.id, 'all').toLowerCase();
    if (category === 'all' || category === 'overview' || category === 'conversation') return true;
    const source = asObject(entry);
    const values = [source.category, source.status, source.badge, source.type, source.group, source.section]
      .map(value => text(value, '').toLowerCase());
    return values.some(value => value === category || value.includes(category));
  }

  function rawEntriesForScreen(screen) {
    const view = text(screen.view, 'grid').toLowerCase();
    if (view === 'grid' || view === 'list') return asArray(screen.items);
    if (view === 'dashboard') return asArray(screen.metrics);
    if (view === 'table') {
      return asArray(screen.table?.rows).map(row => ({
        ...row,
        label: row.label || row.entry,
        description: row.description || row.category,
        badge: row.badge || row.status,
        value: row.value
      }));
    }
    if (view === 'tree') return asArray(screen.tree?.columns).flatMap(column => asArray(column.nodes).map(node => ({ ...node, treeColumn: column.label })));
    if (view === 'dialogue') return asArray(screen.dialogue?.responses).map((response, index) => ({
      ...response,
      icon: response.icon || `D${index + 1}`,
      badge: response.badge || 'Dialogue',
      description: response.description || 'Selectable dialogue response.'
    }));
    if (view === 'form') return asArray(screen.form?.fields).map(field => ({
      ...field,
      label: field.label,
      description: field.placeholder || field.type,
      badge: 'Field',
      value: field.type
    }));
    if (view === 'components') return asArray(screen.components).map(component => ({ ...component, badge: component.badge || 'Component' }));
    if (view === 'dual') {
      const left = asArray(screen.dual?.left?.items).map(item => ({ ...item, side: 'left', sideLabel: screen.dual?.left?.title || 'Left Side' }));
      const right = asArray(screen.dual?.right?.items).map(item => ({ ...item, side: 'right', sideLabel: screen.dual?.right?.title || 'Right Side' }));
      return [...left, ...right];
    }
    return [];
  }

  function entriesForScreen(screen = currentScreen()) {
    const raw = rawEntriesForScreen(screen);
    if (text(screen.view, '').toLowerCase() === 'tree') {
      const category = text(currentCategory()?.id, '').toLowerCase();
      if (!category || category === 'all') return raw;
      const columnMatches = raw.filter(entry => text(entry.treeColumn, '').toLowerCase().includes(category));
      return columnMatches.length ? columnMatches : raw.filter(categoryMatches);
    }
    return raw.filter(categoryMatches);
  }

  function pageSizeForView(view) {
    return VIEW_PAGE_SIZE[text(view, 'grid').toLowerCase()] || 6;
  }

  function pageInfo() {
    const screen = currentScreen();
    const entries = entriesForScreen(screen);
    const size = pageSizeForView(screen.view);
    const totalPages = Math.max(1, Math.ceil(entries.length / size));
    state.page = clamp(state.page, 0, totalPages - 1);
    const start = state.page * size;
    return {
      entries,
      size,
      totalPages,
      pageEntries: entries.slice(start, start + size),
      start
    };
  }

  function selectedEntry() {
    const info = pageInfo();
    if (!info.pageEntries.length) return null;
    state.selectedIndex = clamp(state.selectedIndex, 0, info.pageEntries.length - 1);
    return info.pageEntries[state.selectedIndex];
  }

  function resetSceneState() {
    state.categoryIndex = 0;
    state.categoryWindow = 0;
    state.page = 0;
    state.selectedIndex = 0;
  }

  function animateScene() {
    mainScene.classList.remove('is-transitioning');
    void mainScene.offsetWidth;
    mainScene.classList.add('is-transitioning');
  }

  function setModule(index, silent = false) {
    state.moduleIndex = wrap(index, state.modules.length);
    state.screenIndex = 0;
    resetSceneState();
    shell.dataset.theme = moduleTheme(currentModule());
    renderAll();
    animateScene();
    if (!silent) playSound('navigate');
  }

  function setScreen(index, silent = false) {
    const screens = currentModule().screens;
    state.screenIndex = wrap(index, screens.length);
    resetSceneState();
    renderAll();
    animateScene();
    if (!silent) playSound('navigate');
  }

  function setCategory(index, silent = false) {
    const categories = currentCategories();
    state.categoryIndex = wrap(index, categories.length);
    state.categoryWindow = Math.floor(state.categoryIndex / 5);
    state.page = 0;
    state.selectedIndex = 0;
    renderCategoryConstellation();
    renderContent();
    animateScene();
    if (!silent) playSound('navigate');
  }

  function setPage(index, silent = false) {
    const info = pageInfo();
    state.page = wrap(index, info.totalPages);
    state.selectedIndex = 0;
    renderContent();
    animateScene();
    if (!silent) playSound('navigate');
  }

  function setSelection(index, silent = false) {
    const info = pageInfo();
    if (!info.pageEntries.length) return;
    state.selectedIndex = wrap(index, info.pageEntries.length);
    renderContent();
    if (!silent) playSound('focus');
  }

  function renderCompass() {
    orbit.replaceChildren();
    const modules = state.modules;
    const count = modules.length;
    elements.compassIcon.textContent = monogram(currentModule());
    elements.compassLabel.textContent = currentModule().label;
    elements.compassCount.textContent = `${String(state.moduleIndex + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}`;

    modules.forEach((module, index) => {
      const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
      const radius = count > 10 ? 45 : 43;
      const x = 50 + Math.cos(angle) * radius;
      const y = 50 + Math.sin(angle) * radius;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'n7ui-orbit-node';
      button.style.left = `${x}%`;
      button.style.top = `${y}%`;
      button.textContent = monogram(module);
      button.title = module.label;
      button.setAttribute('aria-label', module.label);
      button.setAttribute('aria-selected', index === state.moduleIndex ? 'true' : 'false');
      button.addEventListener('click', () => setModule(index));
      orbit.appendChild(button);
    });
  }

  function renderScreenScenes() {
    screenScenes.replaceChildren();
    currentModule().screens.slice(0, 4).forEach((screen, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'n7ui-screen-scene';
      button.setAttribute('aria-selected', index === state.screenIndex ? 'true' : 'false');
      const sceneNumber = `Scene ${String(index + 1).padStart(2, '0')}`;
      button.innerHTML = `<span>${sceneNumber}</span><strong>${text(screen.label, sceneNumber)}</strong><small>${text(screen.view, 'grid')}</small>`;
      button.addEventListener('click', () => setScreen(index));
      screenScenes.appendChild(button);
    });
  }

  function renderCategoryConstellation() {
    const categories = currentCategories();
    const pageCount = Math.max(1, Math.ceil(categories.length / 5));
    state.categoryWindow = clamp(state.categoryWindow, 0, pageCount - 1);
    const start = state.categoryWindow * 5;
    const visible = categories.slice(start, start + 5);

    categoryConstellation.replaceChildren();
    visible.forEach((category, localIndex) => {
      const actualIndex = start + localIndex;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'n7ui-category-node';
      button.textContent = text(category.label, category.id);
      button.setAttribute('aria-selected', actualIndex === state.categoryIndex ? 'true' : 'false');
      button.addEventListener('click', () => setCategory(actualIndex));
      categoryConstellation.appendChild(button);
    });

    elements.categoryPrev.disabled = pageCount <= 1;
    elements.categoryNext.disabled = pageCount <= 1;
  }

  function renderPageControls(info) {
    elements.pageLabel.textContent = `Page ${String(state.page + 1).padStart(2, '0')} / ${String(info.totalPages).padStart(2, '0')}`;
    elements.pagePrev.disabled = info.totalPages <= 1;
    elements.pageNext.disabled = info.totalPages <= 1;
    pagePips.replaceChildren();

    for (let index = 0; index < info.totalPages; index += 1) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'n7ui-page-pip';
      button.setAttribute('aria-label', `Page ${index + 1}`);
      button.setAttribute('aria-selected', index === state.page ? 'true' : 'false');
      button.addEventListener('click', () => setPage(index));
      pagePips.appendChild(button);
    }
  }

  function createEntryCard(entry, index) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'n7ui-entry-card';
    button.setAttribute('aria-selected', index === state.selectedIndex ? 'true' : 'false');

    const badge = document.createElement('span');
    badge.className = 'n7ui-card-badge';
    badge.textContent = text(entry.badge, 'Entry');
    const imageSlot = createImageSlot(entry, 'n7ui-image-slot');
    const name = document.createElement('span');
    name.className = 'n7ui-card-name';
    name.textContent = text(entry.label || entry.name, 'Entry');
    const meta = document.createElement('span');
    meta.className = 'n7ui-card-meta';
    meta.innerHTML = `<span>${text(entry.meta || entry.quantity || entry.status, entry.sideLabel || entry.category || 'Available')}</span><span>${text(entry.value || entry.price, 'Preview')}</span>`;
    button.append(badge, imageSlot, name, meta);
    button.addEventListener('click', () => setSelection(index));
    button.addEventListener('dblclick', () => dispatchPrimaryAction(entry));
    return button;
  }

  function renderGrid(entries) {
    const grid = document.createElement('div');
    grid.className = 'n7ui-grid';
    entries.forEach((entry, index) => grid.appendChild(createEntryCard(entry, index)));
    return grid;
  }

  function renderList(entries) {
    const list = document.createElement('div');
    list.className = 'n7ui-list';
    entries.forEach((entry, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'n7ui-list-row';
      button.setAttribute('aria-selected', index === state.selectedIndex ? 'true' : 'false');
      const icon = document.createElement('span');
      icon.className = 'n7ui-row-icon';
      icon.textContent = monogram(entry);
      const copy = document.createElement('span');
      copy.className = 'n7ui-row-copy';
      copy.innerHTML = `<strong>${text(entry.label || entry.name, 'Entry')}</strong><small>${text(entry.description, entry.category || 'Reusable row structure')}</small>`;
      const pill = document.createElement('span');
      pill.className = 'n7ui-pill';
      pill.textContent = text(entry.badge || entry.status, 'Active');
      const value = document.createElement('span');
      value.className = 'n7ui-row-value';
      value.textContent = text(entry.value || entry.price, 'Preview');
      button.append(icon, copy, pill, value);
      button.addEventListener('click', () => setSelection(index));
      list.appendChild(button);
    });
    return list;
  }

  function renderDashboard(entries) {
    const dashboard = document.createElement('div');
    dashboard.className = 'n7ui-dashboard';
    entries.forEach((entry, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'n7ui-dashboard-card';
      button.setAttribute('aria-selected', index === state.selectedIndex ? 'true' : 'false');
      const progress = clamp(Number(entry.progress) || 0, 0, 100);
      button.innerHTML = `<span>${text(entry.label, 'Metric')}</span><strong>${text(entry.value, '—')}</strong><div class="n7ui-progress-track"><span style="width:${progress}%"></span></div>`;
      button.addEventListener('click', () => setSelection(index));
      dashboard.appendChild(button);
    });
    return dashboard;
  }

  function renderTable(entries, screen) {
    const table = document.createElement('div');
    table.className = 'n7ui-table-scene';
    const columns = asArray(screen.table?.columns);
    const labels = columns.length >= 4 ? columns.slice(0, 4).map(column => text(column.label, column.key)) : ['Entry', 'Category', 'Status', 'Value'];
    const head = document.createElement('div');
    head.className = 'n7ui-table-head';
    head.innerHTML = labels.map(label => `<span>${label}</span>`).join('');
    table.appendChild(head);

    entries.forEach((entry, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'n7ui-table-row';
      button.setAttribute('aria-selected', index === state.selectedIndex ? 'true' : 'false');
      const values = [entry.entry || entry.label, entry.category || entry.type, entry.status || entry.badge, entry.value || entry.price];
      button.innerHTML = values.map(value => `<span>${text(value, '—')}</span>`).join('');
      button.addEventListener('click', () => setSelection(index));
      table.appendChild(button);
    });
    return table;
  }

  function renderTree(screen) {
    const tree = document.createElement('div');
    tree.className = 'n7ui-tree';
    let columns = asArray(screen.tree?.columns);
    const category = text(currentCategory()?.id, '').toLowerCase();
    if (category && category !== 'all') {
      const matching = columns.filter(column => text(column.label, '').toLowerCase().includes(category));
      if (matching.length) columns = matching;
    }
    columns.slice(0, 3).forEach(column => {
      const wrapper = document.createElement('div');
      wrapper.className = 'n7ui-tree-column';
      const heading = document.createElement('h3');
      heading.textContent = text(column.label, 'Skill Line');
      wrapper.appendChild(heading);
      asArray(column.nodes).slice(0, 3).forEach(node => {
        const flatEntries = entriesForScreen(screen);
        const nodeIndex = Math.max(0, flatEntries.findIndex(entry => entry.id === node.id));
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'n7ui-tree-node';
        button.setAttribute('aria-selected', flatEntries[state.selectedIndex]?.id === node.id ? 'true' : 'false');
        button.innerHTML = `<strong>${text(node.label, 'Ability')}</strong><small>${text(node.value, 'Rank')} · ${text(node.badge, 'Available')}</small>`;
        button.addEventListener('click', () => setSelection(nodeIndex));
        wrapper.appendChild(button);
      });
      tree.appendChild(wrapper);
    });
    return tree;
  }

  function renderDialogue(entries, screen) {
    const scene = document.createElement('div');
    scene.className = 'n7ui-dialogue-scene';
    const speaker = document.createElement('div');
    speaker.className = 'n7ui-dialogue-speaker';
    speaker.innerHTML = `<strong>${text(screen.dialogue?.speaker, 'Frontier Contact')}</strong><p>${text(screen.dialogue?.text, 'Reusable narrative and response structure.')}</p>`;
    scene.appendChild(speaker);
    entries.forEach((entry, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'n7ui-dialogue-option';
      button.setAttribute('aria-selected', index === state.selectedIndex ? 'true' : 'false');
      button.textContent = `${index + 1}. ${text(entry.label, 'Response')}`;
      button.addEventListener('click', () => setSelection(index));
      scene.appendChild(button);
    });
    return scene;
  }

  function createFormControl(field) {
    const wrapper = document.createElement('div');
    wrapper.className = 'n7ui-form-field';
    const label = document.createElement('label');
    label.textContent = text(field.label, 'Field');
    wrapper.appendChild(label);

    const type = text(field.type, 'text').toLowerCase();
    if (type === 'select' || type === 'choice' || type === 'radio') {
      const choices = document.createElement('div');
      choices.className = 'n7ui-choice-grid';
      const options = asArray(field.options);
      options.slice(0, 6).forEach((option, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'n7ui-form-choice';
        button.textContent = text(option.label, option.value);
        button.dataset.value = text(option.value, option.label);
        button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
        button.addEventListener('click', () => {
          choices.querySelectorAll('.n7ui-form-choice').forEach(entry => entry.setAttribute('aria-selected', entry === button ? 'true' : 'false'));
          playSound('select');
        });
        choices.appendChild(button);
      });
      wrapper.appendChild(choices);
      return wrapper;
    }

    if (type === 'checkbox' || type === 'toggle') {
      const choices = document.createElement('div');
      choices.className = 'n7ui-choice-grid';
      ['Enabled', 'Disabled'].forEach((choice, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'n7ui-form-choice';
        button.textContent = choice;
        button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
        button.addEventListener('click', () => {
          choices.querySelectorAll('.n7ui-form-choice').forEach(entry => entry.setAttribute('aria-selected', entry === button ? 'true' : 'false'));
          playSound('select');
        });
        choices.appendChild(button);
      });
      wrapper.appendChild(choices);
      return wrapper;
    }

    if (type === 'textarea') {
      const textarea = document.createElement('textarea');
      textarea.rows = 3;
      textarea.placeholder = text(field.placeholder, 'Enter details');
      textarea.value = text(field.value, '');
      wrapper.appendChild(textarea);
      return wrapper;
    }

    const input = document.createElement('input');
    input.type = ['number', 'text', 'email', 'tel', 'date', 'time'].includes(type) ? type : 'text';
    input.placeholder = text(field.placeholder, 'Enter a value');
    input.value = text(field.value, '');
    if (typeof field.min === 'number') input.min = String(field.min);
    if (typeof field.max === 'number') input.max = String(field.max);
    wrapper.appendChild(input);
    return wrapper;
  }

  function renderForm(entries, screen) {
    const form = document.createElement('div');
    form.className = 'n7ui-form-scene';
    entries.forEach(entry => form.appendChild(createFormControl(entry)));
    const submit = document.createElement('button');
    submit.type = 'button';
    submit.className = 'n7ui-action is-primary';
    submit.textContent = text(screen.form?.submitLabel, 'Preview Submission');
    submit.addEventListener('click', () => {
      playSound('confirm');
      nuiPost('node7ui_submit', {
        payloadId: text(state.payload?.id, ''),
        moduleId: currentModule().id,
        screenId: screen.id,
        preview: true
      });
    });
    if (form.children.length < 4) form.appendChild(submit);
    return form;
  }

  function renderComponents(entries) {
    const grid = document.createElement('div');
    grid.className = 'n7ui-component-grid';
    entries.forEach((entry, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'n7ui-component-card';
      button.setAttribute('aria-selected', index === state.selectedIndex ? 'true' : 'false');
      button.innerHTML = `<h3>${text(entry.label, 'Component')}</h3><p>${text(entry.description, 'Reusable NODE7 component structure.')}</p>`;
      button.addEventListener('click', () => {
        state.selectedIndex = index;
        renderContent();
        if (entry.action === 'modal') showModal({ badge: 'Component', title: entry.label, message: entry.description });
        if (entry.action === 'toast') showToast({ title: entry.label, message: entry.description, duration: 2600 });
      });
      grid.appendChild(button);
    });
    return grid;
  }

  function renderContent() {
    const screen = currentScreen();
    const view = text(screen.view, 'grid').toLowerCase();
    const info = pageInfo();
    state.selectedIndex = info.pageEntries.length ? clamp(state.selectedIndex, 0, info.pageEntries.length - 1) : 0;
    contentHost.replaceChildren();

    let rendered;
    if (view === 'grid' || view === 'dual') rendered = renderGrid(info.pageEntries);
    else if (view === 'list') rendered = renderList(info.pageEntries);
    else if (view === 'dashboard') rendered = renderDashboard(info.pageEntries);
    else if (view === 'table') rendered = renderTable(info.pageEntries, screen);
    else if (view === 'tree') rendered = renderTree(screen);
    else if (view === 'dialogue') rendered = renderDialogue(info.pageEntries, screen);
    else if (view === 'form') rendered = renderForm(info.pageEntries, screen);
    else if (view === 'components') rendered = renderComponents(info.pageEntries);

    if (!rendered || (!info.pageEntries.length && view !== 'tree')) {
      rendered = document.createElement('div');
      rendered.className = 'n7ui-empty-scene';
      rendered.innerHTML = '<div><strong>No entries in this scene.</strong><br><span>Use another category or page.</span></div>';
    }

    contentHost.appendChild(rendered);
    renderPageControls(info);
    updateInspector(selectedEntry());
  }

  function updateInspector(entry) {
    const screen = currentScreen();
    const data = entry || {
      label: screen.title,
      description: screen.description,
      badge: currentModule().label,
      type: screen.view,
      value: 'Structure'
    };

    elements.inspectorBadge.textContent = text(data.badge, currentModule().label);
    elements.inspectorName.textContent = text(data.label || data.name, screen.title);
    elements.inspectorType.textContent = text(data.type || data.category || screen.view, 'Scene Structure');
    elements.inspectorDescription.textContent = text(data.description, 'Reusable inspection region for future NODE7 script data.');

    elements.inspectorPreview.replaceChildren();
    const fallback = document.createElement('span');
    fallback.textContent = monogram(data);
    elements.inspectorPreview.appendChild(fallback);
    const imageUrl = resolveImage(data);
    if (imageUrl) {
      const image = document.createElement('img');
      image.alt = text(data.alt || data.label || data.name, 'Large preview');
      image.hidden = true;
      image.addEventListener('load', () => { fallback.hidden = true; image.hidden = false; }, { once: true });
      image.addEventListener('error', () => image.remove(), { once: true });
      image.src = imageUrl;
      elements.inspectorPreview.appendChild(image);
    }

    const stats = asArray(data.stats).length ? asArray(data.stats).slice(0, 4) : [
      { label: 'Realm', value: currentModule().label },
      { label: 'Scene', value: screen.label },
      { label: 'Category', value: text(currentCategory()?.label, 'Overview') },
      { label: 'Value', value: text(data.value || data.price, 'Preview') }
    ];

    elements.inspectorStats.replaceChildren();
    stats.forEach(stat => {
      const row = document.createElement('div');
      row.className = 'n7ui-inspector-stat';
      const left = document.createElement('span');
      left.textContent = text(stat.label, 'Stat');
      const right = document.createElement('strong');
      right.textContent = text(stat.value, '—');
      row.append(left, right);
      elements.inspectorStats.appendChild(row);
    });

    const actions = asArray(data.actions).length ? asArray(data.actions).slice(0, 2) : [
      { id: 'primary', label: 'Preview Action', style: 'primary' },
      { id: 'inspect', label: 'Inspect', style: 'secondary' }
    ];
    elements.inspectorActions.replaceChildren();
    actions.forEach(action => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `n7ui-action ${action.style === 'primary' ? 'is-primary' : ''}`.trim();
      button.textContent = text(action.label, 'Action');
      button.addEventListener('click', () => dispatchAction('action', { actionId: action.id, actionLabel: action.label, entry: data }));
      elements.inspectorActions.appendChild(button);
    });
  }

  function dispatchPrimaryAction(entry = selectedEntry()) {
    const action = asArray(entry?.actions)[0] || { id: 'primary', label: 'Preview Action' };
    dispatchAction('action', { actionId: action.id, actionLabel: action.label, entry });
  }

  function renderHeader() {
    elements.title.textContent = state.payload.title;
    elements.subtitle.textContent = state.payload.subtitle;
    setStatus(elements.statusLeft, state.payload.statusLeft);
    setStatus(elements.statusRight, state.payload.statusRight);
    shell.dataset.theme = moduleTheme(currentModule());

    if (state.payload.controls.length) {
      elements.controls.replaceChildren();
      state.payload.controls.slice(0, 6).forEach(control => {
        const span = document.createElement('span');
        const strong = document.createElement('strong');
        strong.textContent = text(control.key, 'Key');
        span.append(strong, document.createTextNode(` ${text(control.label, 'Action')}`));
        elements.controls.appendChild(span);
      });
    }
  }

  function renderSceneHeading() {
    const module = currentModule();
    const screen = currentScreen();
    elements.sceneKicker.textContent = `${module.label} · Scene ${String(state.screenIndex + 1).padStart(2, '0')}`;
    elements.screenTitle.textContent = screen.title;
    elements.screenDescription.textContent = screen.description;
    elements.viewLabel.textContent = `${text(screen.view, 'grid')} scene`;
  }

  function renderAll() {
    renderHeader();
    renderCompass();
    renderScreenScenes();
    renderSceneHeading();
    renderCategoryConstellation();
    renderContent();
  }

  function openPayload(payload) {
    state.payload = normalizePayload(payload);
    configureSounds(state.payload);
    state.modules = state.payload.modules;
    if (!state.modules.length) return;
    const requestedModule = state.modules.findIndex(module => module.id === state.payload.startModule);
    state.moduleIndex = requestedModule >= 0 ? requestedModule : 0;
    const requestedScreen = currentModule().screens.findIndex(screen => screen.id === state.payload.startScreen);
    state.screenIndex = requestedScreen >= 0 ? requestedScreen : 0;
    resetSceneState();
    renderAll();
    showRoot();
    createParticles();
    playSound('open', { force: true });
  }

  function updatePayload(update) {
    if (!state.payload) return;
    const merged = {
      ...state.payload,
      ...asObject(update),
      modules: asArray(update?.modules).length ? update.modules : state.payload.modules
    };
    openPayload(merged);
  }

  function showToast(data = {}) {
    const source = asObject(data);
    const standalone = !state.open && source.standalone !== false;
    if (standalone) {
      root.hidden = false;
      root.classList.add('n7ui-toast-only');
    }

    const type = text(source.type, 'info').toLowerCase();
    const soundName = text(source.sound, type);
    if (source.sound !== false) playSound(SOUND_FILES[soundName] ? soundName : 'info', { force: true, volume: 0.92 });

    const toast = document.createElement('div');
    toast.className = `n7ui-toast is-${type}`;

    const icon = document.createElement('span');
    icon.className = 'n7ui-toast-icon';
    icon.textContent = text(source.icon, type === 'success' ? '✓' : type === 'warning' ? '!' : type === 'error' ? '×' : 'i');

    const copy = document.createElement('span');
    copy.className = 'n7ui-toast-copy';
    const title = document.createElement('strong');
    title.textContent = text(source.title, 'NODE7');
    const message = document.createElement('span');
    message.textContent = text(source.message, 'Notification');
    copy.append(title, message);

    const progress = document.createElement('span');
    progress.className = 'n7ui-toast-progress';

    toast.append(icon, copy, progress);
    toastStack.appendChild(toast);

    const duration = clamp(Number(source.duration) || 3200, 900, 12000);
    progress.style.animationDuration = `${duration}ms`;

    window.setTimeout(() => {
      toast.classList.add('is-leaving');
      window.setTimeout(() => {
        toast.remove();
        if (standalone && !state.open && !toastStack.children.length) {
          root.classList.remove('n7ui-toast-only');
          root.hidden = true;
        }
      }, 180);
    }, duration);
  }

  function closeModal(playFeedback = true) {
    state.modalOpen = false;
    modalLayer.hidden = true;
    elements.modalFields.replaceChildren();
    elements.modalActions.replaceChildren();
    if (playFeedback) playSound('cancel');
  }

  function showModal(data = {}) {
    const source = asObject(data);
    if (!state.open) return;
    playSound('modal', { force: true });
    state.modalOpen = true;
    elements.modalBadge.textContent = text(source.badge, 'Preview');
    elements.modalTitle.textContent = text(source.title, 'NODE7 Modal');
    elements.modalMessage.textContent = text(source.message, 'Reusable modal structure.');
    elements.modalFields.replaceChildren();
    elements.modalActions.replaceChildren();

    asArray(source.fields).slice(0, 4).forEach(field => elements.modalFields.appendChild(createFormControl(field)));
    const actions = asArray(source.actions).length ? asArray(source.actions).slice(0, 3) : [
      { id: 'cancel', label: 'Cancel' },
      { id: 'confirm', label: 'Confirm', style: 'primary' }
    ];
    actions.forEach(action => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `n7ui-modal-action ${action.style === 'primary' ? 'is-primary' : ''}`.trim();
      button.textContent = text(action.label, 'Action');
      button.addEventListener('click', () => {
        dispatchAction('modal', { actionId: action.id, actionLabel: action.label });
        closeModal(false);
      });
      elements.modalActions.appendChild(button);
    });
    modalLayer.hidden = false;
  }

  function createParticles() {
    const host = document.getElementById('n7ui-particles');
    if (!host || host.children.length) return;
    for (let index = 0; index < 34; index += 1) {
      const particle = document.createElement('span');
      particle.className = 'n7ui-particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${20 + Math.random() * 85}%`;
      particle.style.animationDuration = `${7 + Math.random() * 11}s`;
      particle.style.animationDelay = `${-Math.random() * 12}s`;
      particle.style.transform = `scale(${0.7 + Math.random() * 1.4})`;
      host.appendChild(particle);
    }
  }

  function closeUi(reason = 'nui') {
    if (!state.open) return;
    hideRoot();
    nuiPost('node7ui_close', { reason });
  }

  function handleKeyboard(event) {
    if (root.hidden) return;

    if (state.modalOpen) {
      if (event.key === 'Escape' || event.key === 'Backspace') {
        event.preventDefault();
        closeModal();
      }
      return;
    }

    const activeTag = document.activeElement?.tagName;
    const editing = activeTag === 'INPUT' || activeTag === 'TEXTAREA';
    if (editing && event.key !== 'Escape') return;

    const key = event.key.toLowerCase();
    if (key === 'escape' || key === 'backspace') {
      event.preventDefault();
      closeUi('keyboard');
    } else if (key === 'q') {
      event.preventDefault();
      setModule(state.moduleIndex - 1);
    } else if (key === 'e') {
      event.preventDefault();
      setModule(state.moduleIndex + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setScreen(state.screenIndex - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      setScreen(state.screenIndex + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelection(state.selectedIndex - 1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelection(state.selectedIndex + 1);
    } else if (event.key === 'PageUp' || key === '[') {
      event.preventDefault();
      setCategory(state.categoryIndex - 1);
    } else if (event.key === 'PageDown' || key === ']') {
      event.preventDefault();
      setCategory(state.categoryIndex + 1);
    } else if (key === 'a') {
      event.preventDefault();
      setPage(state.page - 1);
    } else if (key === 'd') {
      event.preventDefault();
      setPage(state.page + 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      dispatchPrimaryAction();
    }
  }

  function handleMessage(event) {
    const message = asObject(event.data);
    if (message.namespace !== NAMESPACE) return;
    const action = text(message.action, '');
    const payload = asObject(message.payload);

    if (action === 'bootstrap') {
      state.resourceName = text(payload.resource, state.resourceName);
      configureSounds(payload);
      preloadSounds();
      return;
    }
    if (action === 'open') openPayload(payload);
    if (action === 'update') updatePayload(payload);
    if (action === 'close') hideRoot();
    if (action === 'toast') showToast(payload);
    if (action === 'modal') showModal(payload);
    if (action === 'sound') playSound(text(payload.name, 'select'), payload);
  }

  elements.categoryPrev.addEventListener('click', () => {
    const categories = currentCategories();
    const pageCount = Math.max(1, Math.ceil(categories.length / 5));
    state.categoryWindow = wrap(state.categoryWindow - 1, pageCount);
    renderCategoryConstellation();
    playSound('navigate');
  });

  elements.categoryNext.addEventListener('click', () => {
    const categories = currentCategories();
    const pageCount = Math.max(1, Math.ceil(categories.length / 5));
    state.categoryWindow = wrap(state.categoryWindow + 1, pageCount);
    renderCategoryConstellation();
    playSound('navigate');
  });

  elements.pagePrev.addEventListener('click', () => setPage(state.page - 1));
  elements.pageNext.addEventListener('click', () => setPage(state.page + 1));
  modalLayer.addEventListener('click', event => {
    if (event.target === modalLayer) closeModal();
  });

  root.addEventListener('mouseover', event => {
    const interactive = event.target.closest('button, input, textarea');
    if (!interactive || interactive === soundState.hoverTarget) return;
    soundState.hoverTarget = interactive;
    playSound('focus', { cooldown: 65, volume: 0.65 });
  });

  root.addEventListener('mouseout', event => {
    const interactive = event.target.closest('button, input, textarea');
    if (interactive && !interactive.contains(event.relatedTarget)) soundState.hoverTarget = null;
  });

  root.addEventListener('focusin', event => {
    if (event.target.matches('button, input, textarea')) playSound('focus', { cooldown: 65, volume: 0.65 });
  });

  window.addEventListener('message', handleMessage);
  window.addEventListener('keydown', handleKeyboard);

  function browserPreviewPayload() {
    const makeItems = prefix => Array.from({ length: 11 }, (_, index) => ({
      id: `${prefix}_${index}`,
      label: ['Frontier Revolver', 'Miracle Tonic', 'Leather Satchel', 'Property Key', 'Iron Ore', 'Stable Service', 'Ledger Record', 'Travel Permit', 'Hunting Contract', 'Medical Supply', 'Rare Component'][index],
      icon: ['FR', 'MT', 'LS', 'PK', 'IO', 'SS', 'LR', 'TP', 'HC', 'MS', 'RC'][index],
      category: ['weapons', 'consumables', 'clothing', 'tools', 'materials', 'services', 'documents', 'documents', 'featured', 'consumables', 'unique'][index],
      value: index % 3 === 0 ? 'Owned' : `$${(index + 1) * 2}.25`,
      badge: ['Common', 'Rare', 'Uncommon', 'Unique'][index % 4],
      description: 'Reusable scene entry with reserved image, metadata, state, value, and action regions.'
    }));
    const gridScreen = (id, label, view = 'grid') => ({
      id,
      label,
      title: label,
      description: 'Universal no-scroll scene structure with page rotation and large inspection space.',
      view,
      categories: [
        { id: 'all', label: 'All' }, { id: 'featured', label: 'Featured' }, { id: 'weapons', label: 'Weapons' },
        { id: 'consumables', label: 'Consumables' }, { id: 'materials', label: 'Materials' },
        { id: 'services', label: 'Services' }, { id: 'documents', label: 'Records' }
      ],
      items: makeItems(id)
    });
    const module = (id, label) => ({ id, label, screens: [gridScreen(`${id}_one`, `${label} Overview`), gridScreen(`${id}_two`, `${label} Catalogue`), gridScreen(`${id}_three`, `${label} Activity`, 'list'), gridScreen(`${id}_four`, `${label} Records`, 'grid')] });
    return {
      id: 'browser-preview',
      title: 'NODE7 Dominion',
      subtitle: 'ESO × Red Dead universal scene shell',
      statusLeft: { label: 'NODE7 Framework', value: 'UI Structure Only' },
      statusRight: { label: 'Browser Preview', value: 'No Script Integrations' },
      modules: [
        module('commerce', 'Commerce'), module('creation', 'Creation'), module('character', 'Character'),
        module('world', 'World'), module('organizations', 'Organizations'), module('services', 'Services'),
        module('social', 'Social'), module('travel', 'Travel'), module('activities', 'Activities'),
        module('medical', 'Medical'), module('records', 'Records'), module('administration', 'Administration'),
        module('components', 'Components')
      ]
    };
  }

  preloadSounds();

  if (typeof GetParentResourceName === 'function') {
    state.resourceName = GetParentResourceName();
    nuiPost('node7ui_ready', {});
  } else {
    state.browserPreviewTimer = window.setTimeout(() => openPayload(browserPreviewPayload()), 80);
  }
})();

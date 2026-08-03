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
    checkout: 1,
    commerce: 1,
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
    browserPreviewTimer: null,
    defaultImageBase: '',
    defaultImageResource: 'node7-inventory',
    defaultImagePath: 'html/images'
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

    const imageResource = text(source.imageResource || source.inventoryImageResource, state.defaultImageResource || 'node7-inventory');
    const imagePath = text(source.imagePath || source.inventoryImagePath, state.defaultImagePath || 'html/images');
    const imageBase = text(source.imageBase || source.inventoryImageBase, state.defaultImageBase || '');

    return {
      ...source,
      title: text(source.title, 'NODE7 Dominion'),
      subtitle: text(source.subtitle, 'ESO × Red Dead interface system'),
      statusLeft: normalizeStatus(source.statusLeft, 'NODE7 Framework', 'Universal UI Shell'),
      statusRight: normalizeStatus(source.statusRight, 'Preview State', 'Scene Navigation'),
      controls: asArray(source.controls),
      imageBase,
      imageResource,
      imagePath,
      imageExtensions: asArray(source.imageExtensions).length ? asArray(source.imageExtensions) : ['png', 'webp', 'jpg', 'jpeg'],
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

  function cleanImagePath(value) {
    return text(value, '').trim().replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/{2,}/g, '/');
  }

  function encodeImagePath(value) {
    return cleanImagePath(value).split('/').map(part => encodeURIComponent(part)).join('/');
  }

  function resourceImageUrl(resource, path) {
    const resourceName = text(resource, '').trim();
    const cleanPath = encodeImagePath(path);
    if (!resourceName || !cleanPath) return '';
    return `https://cfx-nui-${resourceName}/${cleanPath}`;
  }

  function pushUnique(list, value) {
    const candidate = text(value, '').trim();
    if (candidate && !list.includes(candidate)) list.push(candidate);
  }

  function resolveImageCandidates(item) {
    const source = asObject(item);
    const candidates = [];
    const explicitValues = [source.imageUrl, source.image, source.thumbnail, source.iconImage, ...asArray(source.imageCandidates)];
    const resource = text(source.imageResource || source.resource || state.payload?.imageResource, state.defaultImageResource || 'node7-inventory').trim();
    const imagePath = cleanImagePath(source.imagePath || state.payload?.imagePath || state.defaultImagePath || 'html/images');
    const bases = [source.imageBase, state.payload?.imageBase, state.defaultImageBase].map(value => text(value, '').replace(/\/+$/, '')).filter(Boolean);

    explicitValues.forEach(value => {
      const explicit = text(value, '').trim();
      if (!explicit) return;
      if (/^(https?:|data:|blob:|nui:)/i.test(explicit)) {
        pushUnique(candidates, explicit);
        return;
      }

      const clean = cleanImagePath(explicit);
      const resourceMatch = clean.match(/^([^/]+)\/(html|assets)\/(.+)$/i);
      if (resourceMatch) {
        pushUnique(candidates, resourceImageUrl(resourceMatch[1], `${resourceMatch[2]}/${resourceMatch[3]}`));
        return;
      }

      if (source.imageResource || source.resource) {
        pushUnique(candidates, resourceImageUrl(source.imageResource || source.resource, clean));
        return;
      }

      if (/^(html|assets)\//i.test(clean)) {
        pushUnique(candidates, resourceImageUrl(resource, clean));
        pushUnique(candidates, clean);
        return;
      }

      if (clean.includes('/')) {
        pushUnique(candidates, clean);
        pushUnique(candidates, resourceImageUrl(resource, clean));
        return;
      }

      bases.forEach(base => pushUnique(candidates, `${base}/${encodeURIComponent(clean)}`));
      pushUnique(candidates, resourceImageUrl(resource, `${imagePath}/${clean}`));
      pushUnique(candidates, clean);
    });

    const itemName = text(source.item || source.itemName || source.name, '').trim();
    if (itemName) {
      const hasExtension = /\.[a-z0-9]{2,5}$/i.test(itemName);
      const extensions = hasExtension ? [''] : (asArray(state.payload?.imageExtensions).length ? state.payload.imageExtensions : ['png', 'webp', 'jpg', 'jpeg']);
      extensions.forEach(extension => {
        const filename = hasExtension ? itemName : `${itemName}.${extension}`;
        bases.forEach(base => pushUnique(candidates, `${base}/${encodeURIComponent(filename)}`));
        pushUnique(candidates, resourceImageUrl(resource, `${imagePath}/${filename}`));
      });
    }

    return candidates;
  }

  function resolveImage(item) {
    return resolveImageCandidates(item)[0] || '';
  }

  function createImageSlot(item, className) {
    const slot = document.createElement('span');
    slot.className = className;
    const fallback = document.createElement('span');
    fallback.textContent = monogram(item);
    slot.appendChild(fallback);

    const candidates = resolveImageCandidates(item);
    if (!candidates.length) return slot;

    const image = document.createElement('img');
    image.alt = text(item.alt || item.label || item.name, 'Preview image');
    image.hidden = true;
    image.dataset.candidateIndex = '0';

    const tryCandidate = index => {
      if (index >= candidates.length) {
        image.remove();
        fallback.hidden = false;
        return;
      }
      image.dataset.candidateIndex = String(index);
      image.src = candidates[index];
    };

    image.addEventListener('load', () => {
      fallback.hidden = true;
      image.hidden = false;
    });
    image.addEventListener('error', () => {
      image.hidden = true;
      tryCandidate(Number(image.dataset.candidateIndex || 0) + 1);
    });

    slot.appendChild(image);
    tryCandidate(0);
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
    if (view === 'checkout' || view === 'commerce') {
      const checkout = asObject(screen.checkout || screen.commerce);
      const explicitItems = asArray(checkout.items || checkout.cart);
      if (explicitItems.length) return explicitItems;
      if (checkout.item && typeof checkout.item === 'object') return [checkout.item];
      return asArray(screen.items);
    }
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

  function createSummaryPanel(summarySource, fieldsHost) {
    const summary = asObject(summarySource);
    const panel = document.createElement('section');
    panel.className = 'n7ui-commerce-summary';
    const heading = document.createElement('div');
    heading.className = 'n7ui-commerce-summary-heading';
    heading.innerHTML = `<span>${text(summary.kicker, 'Order Summary')}</span><strong>${text(summary.title, 'Review Transaction')}</strong>`;
    const rows = document.createElement('div');
    rows.className = 'n7ui-commerce-summary-rows';
    const total = document.createElement('div');
    total.className = 'n7ui-commerce-total';
    panel.append(heading, rows, total);

    const refresh = () => {
      const values = collectFormValues(fieldsHost);
      const quantityField = text(summary.quantityField, 'quantity');
      const quantity = Math.max(0, Number(values[quantityField]) || Number(summary.quantity) || 1);
      const unitPrice = Number(summary.unitPrice) || 0;
      const subtotal = unitPrice * quantity;
      const taxRate = Number(summary.taxRate) || 0;
      const fee = Number(summary.fee) || 0;
      const discount = Number(summary.discount) || 0;
      const tax = subtotal * taxRate;
      const grandTotal = Math.max(0, subtotal + tax + fee - discount);
      const currency = text(summary.currency, '$');
      const dynamicRows = asArray(summary.rows).length ? asArray(summary.rows) : [
        { label: 'Quantity', value: quantity },
        { label: 'Unit Price', value: `${currency}${unitPrice.toFixed(2)}` },
        { label: 'Subtotal', value: `${currency}${subtotal.toFixed(2)}` },
        ...(taxRate ? [{ label: 'Tax', value: `${currency}${tax.toFixed(2)}` }] : []),
        ...(fee ? [{ label: 'Fee', value: `${currency}${fee.toFixed(2)}` }] : [])
      ];
      rows.replaceChildren();
      dynamicRows.forEach(row => {
        const line = document.createElement('div');
        const value = row.valueFromField ? values[row.valueFromField] : row.value;
        line.innerHTML = `<span>${text(row.label, 'Entry')}</span><strong>${text(value, '—')}</strong>`;
        rows.appendChild(line);
      });
      total.innerHTML = `<span>${text(summary.totalLabel, 'Total')}</span><strong>${currency}${grandTotal.toFixed(2)}</strong>`;
      panel.dataset.total = String(grandTotal);
    };

    fieldsHost.addEventListener('n7ui-field-change', refresh);
    refresh();
    return panel;
  }

  function renderDashboard(entries, screen) {
    const config = asObject(screen.dashboard);
    const fields = asArray(config.fields || screen.fields);
    const actions = asArray(config.actions);
    const hasControls = fields.length || Object.keys(asObject(config.summary)).length || actions.length;

    if (!hasControls) {
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

    const layout = document.createElement('div');
    layout.className = 'n7ui-commerce-dashboard';

    const metrics = document.createElement('div');
    metrics.className = 'n7ui-commerce-metrics';
    entries.slice(0, 4).forEach((entry, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'n7ui-commerce-metric';
      button.setAttribute('aria-selected', index === state.selectedIndex ? 'true' : 'false');
      button.innerHTML = `<span>${text(entry.label, 'Metric')}</span><strong>${text(entry.value, '—')}</strong>`;
      button.addEventListener('click', () => setSelection(index));
      metrics.appendChild(button);
    });

    const controls = document.createElement('section');
    controls.className = 'n7ui-commerce-controls';
    const controlsHeading = document.createElement('div');
    controlsHeading.className = 'n7ui-commerce-controls-heading';
    controlsHeading.innerHTML = `<span>${text(config.kicker, 'Commerce Controls')}</span><strong>${text(config.title, 'Configure Transaction')}</strong><small>${text(config.description, 'Set quantity, options, payment, and notes before confirming.')}</small>`;
    const fieldsHost = document.createElement('div');
    fieldsHost.className = 'n7ui-commerce-fields';
    fields.forEach(field => fieldsHost.appendChild(createFormControl(field)));
    controls.append(controlsHeading, fieldsHost);

    const side = document.createElement('div');
    side.className = 'n7ui-commerce-side';
    side.appendChild(createSummaryPanel(config.summary || {}, fieldsHost));

    const actionBar = document.createElement('div');
    actionBar.className = 'n7ui-commerce-actions';
    const dashboardActions = actions.length ? actions.slice(0, 3) : [
      { id: 'cancel', label: 'Cancel' },
      { id: 'confirm', label: 'Confirm Order', style: 'primary' }
    ];
    dashboardActions.forEach(action => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `n7ui-action ${action.style === 'primary' ? 'is-primary' : ''}`.trim();
      button.textContent = text(action.label, 'Action');
      button.addEventListener('click', () => {
        const valid = action.validate === false ? true : validateForm(fieldsHost);
        if (!valid) {
          playSound('error', { force: true });
          setMessage('Complete the required commerce fields.');
          return;
        }
        dispatchAction('dashboard', {
          actionId: action.id,
          actionLabel: action.label,
          fields: collectFormValues(fieldsHost),
          total: Number(side.querySelector('.n7ui-commerce-summary')?.dataset.total || 0)
        });
      });
      actionBar.appendChild(button);
    });
    side.appendChild(actionBar);

    layout.append(metrics, controls, side);
    return layout;
  }


  function numberFromValue(value, fallback = 0) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const normalized = text(value, '').replace(/[^0-9.-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function statValue(entry, label) {
    const wanted = text(label, '').toLowerCase();
    const stat = asArray(entry?.stats).find(row => text(row.label, '').toLowerCase() === wanted);
    return stat ? stat.value : undefined;
  }

  function checkoutConfig(screen, entries) {
    const explicit = asObject(screen.checkout || screen.commerce);
    const sourceItems = asArray(explicit.items || explicit.cart);
    let item = asObject(explicit.item);
    if (!Object.keys(item).length) item = asObject(sourceItems[0] || entries[0]);

    const legacyItems = asArray(screen.items);
    const legacyOrder = legacyItems.find(entry => text(entry.id, '') === 'current_order');
    const legacyFine = legacyItems.find(entry => text(entry.id, '') === 'fine_adjustment');
    const legacyBulk = legacyItems.find(entry => text(entry.id, '') === 'bulk_adjustment');
    const legacyPresets = legacyItems.filter(entry => text(entry.id, '').startsWith('preset_'));
    const isLegacy = !Object.keys(explicit).length && !!legacyOrder;

    if (isLegacy) item = legacyOrder;
    const quantitySource = asObject(explicit.quantity);
    const quantityFromLegacy = numberFromValue(statValue(legacyOrder, 'Quantity'), numberFromValue(text(legacyOrder?.badge, '').match(/\d+/)?.[0], 1));
    const quantity = clamp(Math.floor(numberFromValue(quantitySource.value ?? explicit.quantityValue, isLegacy ? quantityFromLegacy : 1)), numberFromValue(quantitySource.min, 1), numberFromValue(quantitySource.max, 999999));
    const unitPrice = numberFromValue(explicit.unitPrice ?? item.unitPrice ?? statValue(item, 'Unit Price') ?? item.price, 0);
    const totalFromLegacy = numberFromValue(statValue(legacyOrder, 'Order Total') ?? legacyOrder?.value, unitPrice * quantity);
    const currencyMatch = text(explicit.currency || item.currency || statValue(item, 'Unit Price') || item.price || item.value, '$').match(/[^0-9\s.,-]+/);
    const currency = text(explicit.currency, currencyMatch ? currencyMatch[0] : '$');

    const paymentMethods = asArray(explicit.paymentMethods || explicit.payments);
    const money = asObject(state.payload?.money);
    const statusRight = asObject(state.payload?.statusRight);
    const statusKey = text(statusRight.label, '').toLowerCase();
    const cashBalance = explicit.cashBalance ?? state.payload?.cashBalance ?? money.cash
      ?? (statusKey.includes('cash') ? statusRight.value : 'Available');
    const bankBalance = explicit.bankBalance ?? state.payload?.bankBalance ?? money.bank
      ?? (statusKey.includes('bank') ? statusRight.value : 'Available');
    const fallbackPayments = [
      {
        id: 'cash',
        label: 'Cash',
        icon: '$',
        balance: text(cashBalance, 'Available'),
        description: 'Pay directly from carried cash',
        selected: true
      },
      {
        id: 'bank',
        label: 'Bank',
        icon: 'B',
        balance: text(bankBalance, 'Available'),
        description: 'Charge the connected bank account'
      }
    ];

    const explicitActions = asArray(explicit.actions);
    const legacyOrderActions = asArray(legacyOrder?.actions);
    const purchaseAction = explicitActions.find(action => action.style === 'primary' || /purchase|checkout|confirm|buy/i.test(text(action.id || action.label, '')))
      || legacyOrderActions.find(action => /purchase|checkout|confirm|buy/i.test(text(action.id || action.label, '')))
      || { id: 'checkout_confirm', label: 'Confirm Purchase', style: 'primary' };
    const backAction = explicitActions.find(action => /back|cancel|return/i.test(text(action.id || action.label, '')))
      || legacyOrderActions.find(action => /back|cancel|return/i.test(text(action.id || action.label, '')))
      || { id: 'checkout_cancel', label: 'Back' };

    const presetValues = asArray(quantitySource.presets || explicit.presets).length
      ? asArray(quantitySource.presets || explicit.presets)
      : legacyPresets.map(entry => entry.quantity).filter(value => Number.isFinite(Number(value)));

    return {
      explicit,
      isLegacy,
      item,
      quantity: {
        value: quantity,
        min: numberFromValue(quantitySource.min, 1),
        max: numberFromValue(quantitySource.max, numberFromValue(explicit.maxQuantity, 999999)),
        step: Math.max(1, numberFromValue(quantitySource.step, 1)),
        bulkStep: Math.max(1, numberFromValue(quantitySource.bulkStep, 5)),
        presets: presetValues.length ? presetValues : [1, 5, 10, 25]
      },
      unitPrice,
      totalFromLegacy,
      currency,
      taxRate: numberFromValue(explicit.taxRate ?? explicit.summary?.taxRate, 0),
      fee: numberFromValue(explicit.fee ?? explicit.summary?.fee, 0),
      discount: numberFromValue(explicit.discount ?? explicit.summary?.discount, 0),
      paymentMethods: paymentMethods.length ? paymentMethods : fallbackPayments,
      confirmations: asArray(explicit.confirmations || explicit.checkboxes),
      notes: asObject(explicit.notes),
      purchaseAction,
      backAction,
      legacyFine,
      legacyBulk,
      legacyPresets
    };
  }

  function renderCheckout(entries, screen) {
    const config = checkoutConfig(screen, entries);
    const item = asObject(config.item);
    const layout = document.createElement('div');
    layout.className = 'n7ui-checkout-scene';

    const productPanel = document.createElement('section');
    productPanel.className = 'n7ui-checkout-product';
    const imageWrap = createImageSlot(item, 'n7ui-checkout-image');
    const productCopy = document.createElement('div');
    productCopy.className = 'n7ui-checkout-product-copy';
    productCopy.innerHTML = `<span>${text(item.badge || item.category, 'Selected Item')}</span><h3>${text(item.label || item.name, 'Checkout Item')}</h3><p>${text(item.description, 'Review the selected item before completing checkout.')}</p>`;
    const unit = document.createElement('div');
    unit.className = 'n7ui-checkout-unit';
    unit.innerHTML = `<small>Unit Price</small><strong>${config.currency}${config.unitPrice.toFixed(2)}</strong>`;
    productPanel.append(imageWrap, productCopy, unit);

    const quantityPanel = document.createElement('section');
    quantityPanel.className = 'n7ui-checkout-panel n7ui-checkout-quantity';
    quantityPanel.innerHTML = '<div class="n7ui-checkout-heading"><span>Order Quantity</span><strong>Select Amount</strong><small>Use the buttons or type an exact whole number.</small></div>';
    const quantityBody = document.createElement('div');
    quantityBody.className = 'n7ui-checkout-quantity-body';
    const minusBulk = document.createElement('button');
    const minus = document.createElement('button');
    const input = document.createElement('input');
    const plus = document.createElement('button');
    const plusBulk = document.createElement('button');
    [minusBulk, minus, plus, plusBulk].forEach(button => { button.type = 'button'; button.className = 'n7ui-checkout-qty-button'; });
    minusBulk.textContent = `−${config.quantity.bulkStep}`;
    minus.textContent = '−';
    plus.textContent = '+';
    plusBulk.textContent = `+${config.quantity.bulkStep}`;
    input.type = 'number';
    input.inputMode = 'numeric';
    input.min = String(config.quantity.min);
    input.max = String(config.quantity.max);
    input.step = String(config.quantity.step);
    input.value = String(config.quantity.value);
    input.className = 'n7ui-checkout-qty-input';
    quantityBody.append(minusBulk, minus, input, plus, plusBulk);
    const quantityMeta = document.createElement('div');
    quantityMeta.className = 'n7ui-checkout-quantity-meta';
    quantityMeta.innerHTML = `<span>Minimum <strong>${config.quantity.min}</strong></span><span>Maximum <strong>${config.quantity.max >= 999999 ? 'No limit' : config.quantity.max}</strong></span>`;
    const presets = document.createElement('div');
    presets.className = 'n7ui-checkout-presets';
    config.quantity.presets.slice(0, 6).forEach(value => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = String(value).toLowerCase() === 'max' ? 'MAX' : String(value);
      button.dataset.value = String(value);
      presets.appendChild(button);
    });
    quantityPanel.append(quantityBody, quantityMeta, presets);

    const paymentPanel = document.createElement('section');
    paymentPanel.className = 'n7ui-checkout-panel n7ui-checkout-payment';
    paymentPanel.innerHTML = '<div class="n7ui-checkout-heading"><span>Checkout Selection</span><strong>Choose Payment</strong><small>Select the account used for this transaction.</small></div>';
    const paymentList = document.createElement('div');
    paymentList.className = 'n7ui-payment-methods';
    let selectedPayment = '';
    config.paymentMethods.slice(0, 4).forEach((method, index) => {
      const source = asObject(method);
      const id = text(source.id || source.value, `payment_${index}`);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'n7ui-payment-method';
      button.dataset.paymentId = id;
      button.disabled = source.disabled === true;
      const selected = source.selected === true || (!selectedPayment && index === 0);
      if (selected) selectedPayment = id;
      button.setAttribute('aria-selected', selected ? 'true' : 'false');
      const paymentIcon = text(source.icon, id.toLowerCase().includes('bank') ? 'B' : '$');
      button.innerHTML = `<span class="n7ui-payment-icon" aria-hidden="true">${paymentIcon}</span><span class="n7ui-payment-check"></span><span class="n7ui-payment-copy"><strong>${text(source.label, id)}</strong><small>${text(source.description, 'Payment account')}</small></span><span class="n7ui-payment-balance"><small>Available</small><strong>${text(source.balance || source.valueLabel, 'Ready')}</strong></span>`;
      button.addEventListener('click', () => {
        if (button.disabled) return;
        selectedPayment = id;
        paymentList.querySelectorAll('.n7ui-payment-method').forEach(entry => entry.setAttribute('aria-selected', entry === button ? 'true' : 'false'));
        playSound('select');
        refreshSummary();
      });
      paymentList.appendChild(button);
    });
    paymentPanel.appendChild(paymentList);

    const summaryPanel = document.createElement('section');
    summaryPanel.className = 'n7ui-checkout-summary';
    summaryPanel.innerHTML = '<div class="n7ui-checkout-heading"><span>Final Review</span><strong>Order Summary</strong><small>Confirm the amount and payment before purchasing.</small></div>';
    const summaryRows = document.createElement('div');
    summaryRows.className = 'n7ui-checkout-summary-rows';
    const summaryTotal = document.createElement('div');
    summaryTotal.className = 'n7ui-checkout-grand-total';
    const confirmations = document.createElement('div');
    confirmations.className = 'n7ui-checkout-confirmations';
    config.confirmations.forEach((confirmation, index) => {
      const source = asObject(confirmation);
      const label = document.createElement('label');
      label.className = 'n7ui-checkout-confirmation';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.dataset.confirmationId = text(source.id, `confirmation_${index}`);
      checkbox.checked = source.checked === true;
      checkbox.required = source.required === true;
      const mark = document.createElement('span');
      mark.className = 'n7ui-checkbox-mark';
      const copy = document.createElement('span');
      copy.textContent = text(source.label, 'Confirm this option');
      label.append(checkbox, mark, copy);
      confirmations.appendChild(label);
    });
    const notes = document.createElement('textarea');
    notes.className = 'n7ui-checkout-notes';
    notes.hidden = !Object.keys(config.notes).length;
    notes.placeholder = text(config.notes.placeholder, 'Optional order note');
    notes.maxLength = numberFromValue(config.notes.maxLength, 180);
    notes.value = text(config.notes.value, '');

    const actions = document.createElement('div');
    actions.className = 'n7ui-checkout-actions';
    const backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.className = 'n7ui-action';
    backButton.textContent = text(config.backAction.label, 'Back');
    const purchaseButton = document.createElement('button');
    purchaseButton.type = 'button';
    purchaseButton.className = 'n7ui-action is-primary n7ui-checkout-confirm';
    purchaseButton.textContent = text(config.purchaseAction.label, 'Confirm Purchase');
    actions.append(backButton, purchaseButton);
    summaryPanel.append(summaryRows, summaryTotal, confirmations, notes, actions);

    function normalizeQuantity(value) {
      return clamp(Math.floor(numberFromValue(value, config.quantity.min)), config.quantity.min, config.quantity.max);
    }

    function currentQuantity() {
      return normalizeQuantity(input.value);
    }

    function setQuantity(value, dispatchLegacy = false) {
      const previous = currentQuantity();
      const next = normalizeQuantity(value);
      input.value = String(next);
      refreshSummary();
      if (dispatchLegacy && config.isLegacy && next !== previous) {
        dispatchAction('checkout_quantity', {
          actionId: 'checkout_quantity',
          actionLabel: 'Update Quantity',
          entry: item,
          checkout: { quantity: next, paymentMethod: selectedPayment }
        });
      }
    }

    function checkoutData() {
      const quantity = currentQuantity();
      const subtotal = config.unitPrice * quantity;
      const tax = subtotal * config.taxRate;
      const total = Math.max(0, subtotal + tax + config.fee - config.discount);
      const confirmationValues = {};
      confirmations.querySelectorAll('input[type="checkbox"]').forEach(box => { confirmationValues[box.dataset.confirmationId] = box.checked; });
      return {
        itemId: text(item.productId || item.itemId || item.id, ''),
        item: item.item,
        quantity,
        paymentMethod: selectedPayment,
        unitPrice: config.unitPrice,
        subtotal,
        tax,
        fee: config.fee,
        discount: config.discount,
        total,
        confirmations: confirmationValues,
        note: notes.hidden ? '' : notes.value.trim()
      };
    }

    function refreshSummary() {
      const data = checkoutData();
      const method = config.paymentMethods.find(method => text(method.id || method.value, '') === selectedPayment) || config.paymentMethods[0] || {};
      summaryRows.innerHTML = [
        ['Item', text(item.label || item.name, 'Selected item')],
        ['Quantity', String(data.quantity)],
        ['Unit Price', `${config.currency}${data.unitPrice.toFixed(2)}`],
        ['Subtotal', `${config.currency}${data.subtotal.toFixed(2)}`],
        ...(data.tax ? [['Tax', `${config.currency}${data.tax.toFixed(2)}`]] : []),
        ...(data.fee ? [['Fees', `${config.currency}${data.fee.toFixed(2)}`]] : []),
        ...(data.discount ? [['Discount', `−${config.currency}${data.discount.toFixed(2)}`]] : []),
        ['Payment', text(method.label, selectedPayment || 'Selected account')]
      ].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join('');
      summaryTotal.innerHTML = `<span>Total Due</span><strong>${config.currency}${data.total.toFixed(2)}</strong>`;
      purchaseButton.textContent = `${text(config.purchaseAction.label, 'Confirm Purchase')} · ${config.currency}${data.total.toFixed(2)}`;
    }

    minus.addEventListener('click', () => setQuantity(currentQuantity() - config.quantity.step));
    plus.addEventListener('click', () => setQuantity(currentQuantity() + config.quantity.step));
    minusBulk.addEventListener('click', () => setQuantity(currentQuantity() - config.quantity.bulkStep));
    plusBulk.addEventListener('click', () => setQuantity(currentQuantity() + config.quantity.bulkStep));
    [minusBulk, minus, plus, plusBulk].forEach(button => button.addEventListener('click', () => playSound('select')));
    input.addEventListener('input', refreshSummary);
    input.addEventListener('change', () => setQuantity(input.value, config.isLegacy));
    presets.addEventListener('click', event => {
      const button = event.target.closest('button[data-value]');
      if (!button) return;
      const value = button.dataset.value.toLowerCase() === 'max' ? config.quantity.max : button.dataset.value;
      setQuantity(value, config.isLegacy);
      playSound('select');
    });
    backButton.addEventListener('click', () => dispatchAction('checkout', {
      actionId: config.backAction.id,
      actionLabel: config.backAction.label,
      entry: item,
      checkout: checkoutData()
    }));
    purchaseButton.addEventListener('click', () => {
      const requiredUnchecked = Array.from(confirmations.querySelectorAll('input[required]')).some(box => !box.checked);
      if (!selectedPayment || requiredUnchecked) {
        playSound('error', { force: true });
        setMessage(!selectedPayment ? 'Select a checkout payment method.' : 'Complete the required checkout confirmation.');
        return;
      }
      const data = checkoutData();
      dispatchAction('checkout', {
        actionId: config.purchaseAction.id,
        actionLabel: config.purchaseAction.label,
        entry: item,
        checkout: data,
        fields: { quantity: data.quantity, payment: data.paymentMethod, note: data.note }
      });
    });

    refreshSummary();
    layout.append(productPanel, quantityPanel, paymentPanel, summaryPanel);
    return layout;
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

  function fieldIdentifier(field) {
    return text(field.id || field.name || field.key || field.label, `field_${Math.random().toString(36).slice(2, 8)}`).trim().replace(/\s+/g, '_').toLowerCase();
  }

  function emitFieldChange(wrapper, value) {
    wrapper.dataset.value = typeof value === 'string' ? value : JSON.stringify(value);
    wrapper.dispatchEvent(new CustomEvent('n7ui-field-change', {
      bubbles: true,
      detail: { id: wrapper.dataset.fieldId, value }
    }));
  }

  function createFormControl(field) {
    const source = asObject(field);
    const wrapper = document.createElement('div');
    wrapper.className = 'n7ui-form-field';
    wrapper.dataset.fieldId = fieldIdentifier(source);
    wrapper.dataset.required = source.required === true ? 'true' : 'false';

    const label = document.createElement('label');
    label.textContent = text(source.label, 'Field');
    if (source.required === true) {
      const required = document.createElement('b');
      required.textContent = ' *';
      label.appendChild(required);
    }
    wrapper.appendChild(label);

    const type = text(source.type, 'text').toLowerCase();
    wrapper.dataset.fieldType = type;

    const setReader = reader => { wrapper._n7GetValue = reader; };

    if (type === 'quantity' || type === 'stepper') {
      const minimum = Number.isFinite(Number(source.min)) ? Number(source.min) : 1;
      const maximum = Number.isFinite(Number(source.max)) ? Number(source.max) : 999999;
      const step = Math.max(1, Number(source.step) || 1);
      const control = document.createElement('div');
      control.className = 'n7ui-quantity-control';
      const decrease = document.createElement('button');
      decrease.type = 'button';
      decrease.className = 'n7ui-quantity-button';
      decrease.textContent = '−';
      decrease.setAttribute('aria-label', 'Decrease quantity');
      const input = document.createElement('input');
      input.type = 'number';
      input.inputMode = 'numeric';
      input.min = String(minimum);
      input.max = String(maximum);
      input.step = String(step);
      input.value = String(clamp(Number(source.value) || minimum, minimum, maximum));
      input.setAttribute('aria-label', text(source.label, 'Quantity'));
      const increase = document.createElement('button');
      increase.type = 'button';
      increase.className = 'n7ui-quantity-button';
      increase.textContent = '+';
      increase.setAttribute('aria-label', 'Increase quantity');
      const update = value => {
        const normalized = clamp(Math.floor(Number(value) || minimum), minimum, maximum);
        input.value = String(normalized);
        emitFieldChange(wrapper, normalized);
      };
      decrease.addEventListener('click', () => { update(Number(input.value) - step); playSound('select'); });
      increase.addEventListener('click', () => { update(Number(input.value) + step); playSound('select'); });
      input.addEventListener('input', () => update(input.value));
      control.append(decrease, input, increase);
      wrapper.appendChild(control);

      const presets = asArray(source.presets || source.quickValues);
      if (presets.length) {
        const quick = document.createElement('div');
        quick.className = 'n7ui-quantity-presets';
        presets.slice(0, 5).forEach(value => {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = String(value).toLowerCase() === 'max' ? 'MAX' : String(value);
          button.addEventListener('click', () => { update(String(value).toLowerCase() === 'max' ? maximum : value); playSound('select'); });
          quick.appendChild(button);
        });
        wrapper.appendChild(quick);
      }
      setReader(() => Number(input.value));
      emitFieldChange(wrapper, Number(input.value));
    } else if (type === 'checkbox' || type === 'checkboxes' || type === 'toggle') {
      const options = asArray(source.options);
      const list = document.createElement('div');
      list.className = 'n7ui-checkbox-list';
      if (options.length) {
        options.slice(0, 8).forEach((option, index) => {
          const row = document.createElement('label');
          row.className = 'n7ui-checkbox-row';
          const input = document.createElement('input');
          input.type = 'checkbox';
          input.value = text(option.value, option.label);
          input.checked = option.checked === true || asArray(source.value).includes(input.value);
          const mark = document.createElement('span');
          mark.className = 'n7ui-checkbox-mark';
          const copy = document.createElement('span');
          copy.textContent = text(option.label, option.value);
          row.append(input, mark, copy);
          list.appendChild(row);
        });
        setReader(() => Array.from(list.querySelectorAll('input:checked')).map(input => input.value));
      } else {
        const row = document.createElement('label');
        row.className = `n7ui-checkbox-row ${type === 'toggle' ? 'is-toggle' : ''}`.trim();
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = source.value === true || source.checked === true;
        const mark = document.createElement('span');
        mark.className = 'n7ui-checkbox-mark';
        const copy = document.createElement('span');
        copy.textContent = text(source.optionLabel, type === 'toggle' ? 'Enabled' : 'Confirm option');
        row.append(input, mark, copy);
        list.appendChild(row);
        setReader(() => input.checked);
      }
      list.addEventListener('change', () => emitFieldChange(wrapper, wrapper._n7GetValue()));
      wrapper.appendChild(list);
      emitFieldChange(wrapper, wrapper._n7GetValue());
    } else if (type === 'select') {
      // RedM NUI handles native HTML dropdowns inconsistently. Keep legacy
      // `type = "select"` payload compatibility, but always render button cards.
      const choices = document.createElement('div');
      choices.className = 'n7ui-choice-grid n7ui-choice-grid-select';
      const options = asArray(source.options);
      options.slice(0, 8).forEach((option, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'n7ui-form-choice n7ui-form-choice-card';
        button.dataset.value = text(option.value, option.label);
        const selected = String(source.value) === button.dataset.value || option.selected === true || (!text(source.value, '') && index === 0);
        button.setAttribute('aria-selected', selected ? 'true' : 'false');
        button.innerHTML = `<span class="n7ui-choice-indicator"></span><span class="n7ui-choice-copy"><strong>${text(option.label, option.value)}</strong><small>${text(option.description || option.subtitle, 'Select this option')}</small></span>${option.valueLabel || option.balance ? `<span class="n7ui-choice-value">${text(option.valueLabel || option.balance, '')}</span>` : ''}`;
        button.addEventListener('click', () => {
          choices.querySelectorAll('.n7ui-form-choice').forEach(entry => entry.setAttribute('aria-selected', entry === button ? 'true' : 'false'));
          emitFieldChange(wrapper, button.dataset.value);
          playSound('select');
        });
        choices.appendChild(button);
      });
      wrapper.appendChild(choices);
      setReader(() => choices.querySelector('[aria-selected="true"]')?.dataset.value || '');
      emitFieldChange(wrapper, wrapper._n7GetValue());
    } else if (type === 'choice' || type === 'radio') {
      const choices = document.createElement('div');
      choices.className = 'n7ui-choice-grid';
      const options = asArray(source.options);
      options.slice(0, 6).forEach((option, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'n7ui-form-choice';
        button.textContent = text(option.label, option.value);
        button.dataset.value = text(option.value, option.label);
        const selected = String(source.value) === button.dataset.value || option.selected === true || (!text(source.value, '') && index === 0);
        button.setAttribute('aria-selected', selected ? 'true' : 'false');
        button.addEventListener('click', () => {
          choices.querySelectorAll('.n7ui-form-choice').forEach(entry => entry.setAttribute('aria-selected', entry === button ? 'true' : 'false'));
          emitFieldChange(wrapper, button.dataset.value);
          playSound('select');
        });
        choices.appendChild(button);
      });
      wrapper.appendChild(choices);
      setReader(() => choices.querySelector('[aria-selected="true"]')?.dataset.value || '');
      emitFieldChange(wrapper, wrapper._n7GetValue());
    } else if (type === 'textarea') {
      const textarea = document.createElement('textarea');
      textarea.rows = Number(source.rows) || 3;
      textarea.maxLength = Number(source.maxLength) || 1000;
      textarea.placeholder = text(source.placeholder, 'Enter details');
      textarea.value = text(source.value, '');
      textarea.addEventListener('input', () => emitFieldChange(wrapper, textarea.value));
      wrapper.appendChild(textarea);
      setReader(() => textarea.value.trim());
      emitFieldChange(wrapper, textarea.value.trim());
    } else if (type === 'range') {
      const row = document.createElement('div');
      row.className = 'n7ui-range-control';
      const input = document.createElement('input');
      input.type = 'range';
      input.min = String(Number.isFinite(Number(source.min)) ? Number(source.min) : 0);
      input.max = String(Number.isFinite(Number(source.max)) ? Number(source.max) : 100);
      input.step = String(Number(source.step) || 1);
      input.value = String(Number(source.value) || Number(input.min));
      const output = document.createElement('output');
      output.textContent = input.value;
      input.addEventListener('input', () => { output.textContent = input.value; emitFieldChange(wrapper, Number(input.value)); });
      row.append(input, output);
      wrapper.appendChild(row);
      setReader(() => Number(input.value));
      emitFieldChange(wrapper, Number(input.value));
    } else {
      const input = document.createElement('input');
      const allowed = ['number', 'text', 'email', 'tel', 'date', 'time', 'password', 'url', 'search'];
      input.type = allowed.includes(type) ? type : 'text';
      input.placeholder = text(source.placeholder, 'Enter a value');
      input.value = text(source.value, '');
      input.autocomplete = text(source.autocomplete, 'off');
      if (Number.isFinite(Number(source.min))) input.min = String(source.min);
      if (Number.isFinite(Number(source.max))) input.max = String(source.max);
      if (Number.isFinite(Number(source.step))) input.step = String(source.step);
      if (Number.isFinite(Number(source.maxLength))) input.maxLength = Number(source.maxLength);
      input.addEventListener('input', () => emitFieldChange(wrapper, input.type === 'number' ? Number(input.value) : input.value));
      wrapper.appendChild(input);
      setReader(() => input.type === 'number' ? Number(input.value) : input.value.trim());
      emitFieldChange(wrapper, wrapper._n7GetValue());
    }

    if (source.helper || source.description) {
      const helper = document.createElement('small');
      helper.className = 'n7ui-field-helper';
      helper.textContent = text(source.helper || source.description, '');
      wrapper.appendChild(helper);
    }
    const error = document.createElement('small');
    error.className = 'n7ui-field-error';
    error.hidden = true;
    wrapper.appendChild(error);
    return wrapper;
  }

  function collectFormValues(container) {
    const values = {};
    container.querySelectorAll('.n7ui-form-field').forEach(field => {
      values[field.dataset.fieldId] = typeof field._n7GetValue === 'function' ? field._n7GetValue() : field.dataset.value;
    });
    return values;
  }

  function validateForm(container) {
    let valid = true;
    container.querySelectorAll('.n7ui-form-field').forEach(field => {
      const value = typeof field._n7GetValue === 'function' ? field._n7GetValue() : field.dataset.value;
      const required = field.dataset.required === 'true';
      const empty = Array.isArray(value) ? value.length === 0 : value === '' || value === null || value === undefined || value === false || (typeof value === 'number' && !Number.isFinite(value));
      const error = field.querySelector('.n7ui-field-error');
      field.classList.toggle('is-invalid', required && empty);
      if (error) {
        error.hidden = !(required && empty);
        error.textContent = required && empty ? 'This field is required.' : '';
      }
      if (required && empty) valid = false;
    });
    return valid;
  }

  function renderForm(entries, screen) {
    const form = document.createElement('div');
    form.className = 'n7ui-form-scene';
    entries.forEach(entry => form.appendChild(createFormControl(entry)));
    const submit = document.createElement('button');
    submit.type = 'button';
    submit.className = 'n7ui-action is-primary n7ui-form-submit';
    submit.textContent = text(screen.form?.submitLabel, 'Submit');
    submit.addEventListener('click', () => {
      if (!validateForm(form)) {
        playSound('error', { force: true });
        setMessage('Complete the required fields.');
        return;
      }
      playSound('confirm');
      nuiPost('node7ui_submit', {
        payloadId: text(state.payload?.id, ''),
        moduleId: currentModule().id,
        screenId: screen.id,
        formId: text(screen.form?.id, screen.id),
        fields: collectFormValues(form)
      });
    });
    form.appendChild(submit);
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
    else if (view === 'dashboard') rendered = renderDashboard(info.pageEntries, screen);
    else if (view === 'checkout' || view === 'commerce' || (screen.id === 'order' && asArray(screen.items).some(entry => text(entry.id, '') === 'current_order'))) rendered = renderCheckout(info.pageEntries, screen);
    else if (view === 'table') rendered = renderTable(info.pageEntries, screen);
    else if (view === 'tree') rendered = renderTree(screen);
    else if (view === 'dialogue') rendered = renderDialogue(info.pageEntries, screen);
    else if (view === 'form') rendered = renderForm(info.pageEntries, screen);
    else if (view === 'components') rendered = renderComponents(info.pageEntries);

    if (!rendered || (!info.pageEntries.length && view !== 'tree' && view !== 'checkout' && view !== 'commerce')) {
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

    asArray(source.fields).slice(0, 8).forEach(field => elements.modalFields.appendChild(createFormControl(field)));
    if (Object.keys(asObject(source.summary)).length) {
      elements.modalFields.appendChild(createSummaryPanel(source.summary, elements.modalFields));
    }
    const actions = asArray(source.actions).length ? asArray(source.actions).slice(0, 3) : [
      { id: 'cancel', label: 'Cancel', validate: false },
      { id: 'confirm', label: 'Confirm', style: 'primary' }
    ];
    actions.forEach(action => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `n7ui-modal-action ${action.style === 'primary' ? 'is-primary' : ''}`.trim();
      button.textContent = text(action.label, 'Action');
      button.addEventListener('click', () => {
        const shouldValidate = action.validate !== false && action.id !== 'cancel';
        if (shouldValidate && !validateForm(elements.modalFields)) {
          playSound('error', { force: true });
          return;
        }
        dispatchAction('modal', {
          modalId: text(source.id, ''),
          actionId: action.id,
          actionLabel: action.label,
          fields: collectFormValues(elements.modalFields),
          entry: source.entry || null
        });
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
      state.defaultImageBase = text(payload.imageBase, state.defaultImageBase);
      state.defaultImageResource = text(payload.imageResource, state.defaultImageResource);
      state.defaultImagePath = text(payload.imagePath, state.defaultImagePath);
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
    const interactive = event.target.closest('button, input, textarea, select');
    if (!interactive || interactive === soundState.hoverTarget) return;
    soundState.hoverTarget = interactive;
    playSound('focus', { cooldown: 65, volume: 0.65 });
  });

  root.addEventListener('mouseout', event => {
    const interactive = event.target.closest('button, input, textarea, select');
    if (interactive && !interactive.contains(event.relatedTarget)) soundState.hoverTarget = null;
  });

  root.addEventListener('focusin', event => {
    if (event.target.matches('button, input, textarea, select')) playSound('focus', { cooldown: 65, volume: 0.65 });
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
    const commerceDashboard = () => ({
      id: 'commerce_dashboard',
      label: 'Commerce Checkout',
      title: 'Commerce Checkout',
      description: 'Complete quantity and checkout selection for shops, markets, vendors, and black-market transactions.',
      view: 'checkout',
      categories: [{ id: 'checkout', label: 'Checkout' }],
      checkout: {
        item: {
          id: 'frontier_revolver',
          item: 'weapon_revolver_cattleman',
          label: 'Frontier Revolver',
          badge: 'Selected Item',
          description: 'A dependable revolver prepared for checkout.',
          image: 'weapon_revolver_cattleman.png',
          imageResource: 'node7-inventory'
        },
        quantity: { value: 1, min: 1, max: 99, step: 1, bulkStep: 5, presets: [1, 5, 10, 25, 'max'] },
        unitPrice: 58.25,
        currency: '$',
        taxRate: 0.02,
        paymentMethods: [
          { id: 'cash', label: 'Cash', description: 'Pay from carried cash', balance: '$245.00', selected: true },
          { id: 'bank', label: 'Bank Account', description: 'Pay from deposited funds', balance: '$1,420.00' },
          { id: 'gold', label: 'Gold', description: 'Premium currency account', balance: '8.25 bars' }
        ],
        confirmations: [{ id: 'inventory', label: 'Deliver purchased items to inventory', checked: true }],
        notes: { placeholder: 'Optional merchant note', maxLength: 180 },
        actions: [{ id: 'return_catalogue', label: 'Back to Catalogue' }, { id: 'purchase_selected', label: 'Complete Checkout', style: 'primary' }]
      }
    });
    const module = (id, label) => ({ id, label, screens: [gridScreen(`${id}_one`, `${label} Overview`), gridScreen(`${id}_two`, `${label} Catalogue`), gridScreen(`${id}_three`, `${label} Activity`, 'list'), gridScreen(`${id}_four`, `${label} Records`, 'grid')] });
    return {
      id: 'browser-preview',
      title: 'NODE7 Dominion',
      subtitle: 'ESO × Red Dead universal scene shell',
      statusLeft: { label: 'NODE7 Framework', value: 'UI Structure Only' },
      statusRight: { label: 'Browser Preview', value: 'No Script Integrations' },
      startModule: 'commerce',
      startScreen: 'commerce_dashboard',
      modules: [
        { id: 'commerce', label: 'Commerce', screens: [gridScreen('commerce_catalogue', 'Vendor Catalogue'), commerceDashboard(), gridScreen('commerce_market', 'Buy & Sell', 'list'), gridScreen('commerce_records', 'Market Records')] }, module('creation', 'Creation'), module('character', 'Character'),
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

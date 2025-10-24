let gameData = {};
let currentChapter = null;
let currentScene = null;
let gameUrl = 'game.json';
let locked = false;

/* === Основная загрузка игры === */
async function loadGame(url = gameUrl) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Ошибка загрузки: ${url}`);
    let text = await res.text();

    // если строка в кавычках, убираем их
    if (text.startsWith('"') && text.endsWith('"')) {
      text = text.slice(1, -1);
      // распарсим экранированные кавычки
      text = text.replace(/\\"/g, '"');
    }

    gameData = JSON.parse(text);

    const firstChapter = Object.keys(gameData.chapters)[0];
    const firstScene = Object.keys(gameData.chapters[firstChapter])[0];
    const saved = localStorage.getItem('currentScene');
    loadScene(saved || `${firstChapter}:${firstScene}`, true);

  } catch (e) {
    console.error(e);
    document.getElementById('scene-text').textContent = 'Ошибка загрузки JSON.';
  }
}


/* === Плавная смена сцены === */
async function loadScene(path, instant = false) {
  if (locked) return;
  locked = true;

  const [chapter, sceneName] = path.includes(':')
    ? path.split(':')
    : [Object.keys(gameData.chapters)[0], path];

  const scene = gameData.chapters?.[chapter]?.[sceneName];
  if (!scene) { locked = false; return; }

  const text = document.getElementById('scene-text');
  const bg = document.getElementById('scene-bg');
  const btns = document.getElementById('buttons');
  const id = document.getElementById('scene-id');

  // скрытие старого текста, кнопок и фона
  if (!instant) {
    text.classList.remove('visible');
    btns.classList.remove('visible');
    bg.classList.remove('visible');
    await wait(350);
  }

  // установка новой сцены
  currentChapter = chapter;
  currentScene = sceneName;
  id.textContent = `${gameData.title} — ${chapter} — ${sceneName}`;
  bg.style.backgroundImage = `url(${scene.bgimage})`;
  text.textContent = scene.text;
  btns.innerHTML = '';

  Object.values(scene.buttons).forEach((b, i) => {
    const btn = document.createElement('button');
    btn.className = 'button';
    btn.textContent = b.text;
    btn.style.transitionDelay = `${i * 80}ms`;
    btn.onclick = async () => {
      await fadeOutScene();
      loadScene(b.next);
    };
    btns.appendChild(btn);
  });

  saveProgress();

  // принудительный reflow
  void text.offsetWidth;
  void bg.offsetWidth;

  // плавное появление
  bg.classList.add('visible');
  text.classList.add('visible');
  btns.classList.add('visible');

  locked = false;
}

/* === Скрытие сцены === */
async function fadeOutScene() {
  const text = document.getElementById('scene-text');
  const btns = document.getElementById('buttons');
  const bg = document.getElementById('scene-bg');
  text.classList.remove('visible');
  btns.classList.remove('visible');
  bg.classList.remove('visible');
  await wait(300);
}

/* === Утилиты === */
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

function saveProgress() {
  localStorage.setItem('currentScene', `${currentChapter}:${currentScene}`);
}

/* === Сохранения === */
function addManualSave() {
  const saves = JSON.parse(localStorage.getItem('saves') || '[]');
  const date = new Date().toLocaleString();
  saves.push({ title: gameData.title, chapter: currentChapter, scene: currentScene, date });
  localStorage.setItem('saves', JSON.stringify(saves));
}

function updateSaveList() {
  const list = document.getElementById('save-list');
  const saves = JSON.parse(localStorage.getItem('saves') || '[]');
  list.innerHTML = '';
  saves.forEach(s => {
    const li = document.createElement('li');
    li.textContent = `${s.title} — ${s.chapter} — ${s.date}`;
    li.onclick = () => {
      loadScene(`${s.chapter}:${s.scene}`);
      closeSaveModal();
    };
    list.appendChild(li);
  });
}

function exportAllSaves() {
  const saves = localStorage.getItem('saves') || '[]';
  const blob = new Blob([saves], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'all_saves.json';
  a.click();
}

/* === Модальные окна === */
function openSaveModal() {
  updateSaveList();
  document.getElementById('save-modal').classList.remove('hidden');
}
function closeSaveModal() {
  document.getElementById('save-modal').classList.add('hidden');
}
function openSettingsModal() {
  document.getElementById('settings-modal').classList.remove('hidden');
}
function closeSettingsModal() {
  document.getElementById('settings-modal').classList.add('hidden');
}

/* === Новая игра / Смена JSON === */
function startNewGame() {
  localStorage.removeItem('currentScene');
  const firstChapter = Object.keys(gameData.chapters)[0];
  const firstScene = Object.keys(gameData.chapters[firstChapter])[0];
  loadScene(`${firstChapter}:${firstScene}`);
}

function loadCustomGame() {
  const input = document.getElementById('game-url').value.trim();
  if (!input) return;

  // Если это ссылка pastebin, автоматически заменяем на raw
  let url = input;
  const pastebinMatch = input.match(/pastebin\.com\/([a-zA-Z0-9]+)/);
  if (pastebinMatch) {
    url = `https://pastebin.com/raw/${pastebinMatch[1]}`;
  }

  loadGame(url);
  gameUrl = url;
  closeSettingsModal();
}


/* === Инициализация === */
window.onload = () => {
  loadGame();

  document.getElementById('load-btn').onclick = openSaveModal;
  document.getElementById('save-btn').onclick = () => {
    addManualSave();
    alert('Сохранение создано.');
  };
  document.getElementById('newgame-btn').onclick = startNewGame;
  document.getElementById('settings-btn').onclick = openSettingsModal;

  document.getElementById('close-save-modal').onclick = closeSaveModal;
  document.getElementById('close-settings-modal').onclick = closeSettingsModal;

  document.getElementById('export-saves-btn').onclick = exportAllSaves;
  document.getElementById('load-json-btn').onclick = loadCustomGame;
};

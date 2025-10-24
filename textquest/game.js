let gameData = {};
let currentScene = null;
let currentChapter = null;
let gameUrl = 'game.json';

async function loadGame(fromUrl = false) {
  const url = fromUrl || gameUrl;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Не удалось загрузить ${url}`);
    gameData = await res.json();
    const firstChapter = Object.keys(gameData.chapters)[0];
    const firstScene = Object.keys(gameData.chapters[firstChapter])[0];
    const savedScene = localStorage.getItem('currentScene');
    loadScene(savedScene || `${firstChapter}:${firstScene}`);
  } catch(e) {
    console.error(e);
    document.getElementById('scene-text').textContent = "Ошибка загрузки игры.";
  }
}

function loadScene(scenePath) {
  let chapter, sceneName;
  if (scenePath.includes(':')) {
    [chapter, sceneName] = scenePath.split(':');
  } else {
    chapter = Object.keys(gameData.chapters)[0];
    sceneName = scenePath;
  }

  const scene = gameData.chapters[chapter][sceneName];
  if (!scene) return;
  currentChapter = chapter;
  currentScene = sceneName;

  const bg = document.getElementById('scene-bg');
  const text = document.getElementById('scene-text');
  const btnsContainer = document.getElementById('buttons');
  const sceneId = document.getElementById('scene-id');

  bg.style.backgroundImage = `url(${scene.bgimage})`;
  text.textContent = scene.text;
  btnsContainer.innerHTML = '';
  sceneId.textContent = `${gameData.title} — ${currentChapter} — ${sceneName}`;

  const btnArray = Object.values(scene.buttons);
  let i = 0;

  while (i < btnArray.length) {
    const row = document.createElement('div');
    row.className = 'button-row';

    // 1. Длинная кнопка
    if (i < btnArray.length) {
      const b = btnArray[i++];
      const btn = createSceneButton(b, 'button-long');
      row.appendChild(btn);
    }

    // 2. Две средние кнопки
    const mediumBtns = [];
    for (let j = 0; j < 2 && i < btnArray.length; j++, i++) {
      const b = btnArray[i];
      mediumBtns.push(createSceneButton(b, 'button-medium'));
    }
    mediumBtns.forEach(b => row.appendChild(b));

    // 3. Две средние + одна длинная снизу
    if (i < btnArray.length) {
      const row3 = document.createElement('div');
      row3.className = 'button-row';
      for (let j = 0; j < 2 && i < btnArray.length; j++, i++) {
        const b = btnArray[i];
        const btn = createSceneButton(b, 'button-medium');
        row3.appendChild(btn);
      }
      if (i < btnArray.length) {
        const b = btnArray[i++];
        const btn = createSceneButton(b, 'button-long');
        row3.appendChild(btn);
      }
      btnsContainer.appendChild(row3);
      continue;
    }

    // 4. Четыре средние кнопки
    if (i + 4 <= btnArray.length) {
      const row4 = document.createElement('div');
      row4.className = 'button-row';
      for (let j = 0; j < 4 && i < btnArray.length; j++, i++) {
        const b = btnArray[i];
        const btn = createSceneButton(b, 'button-small');
        row4.appendChild(btn);
      }
      btnsContainer.appendChild(row4);
      continue;
    }

    btnsContainer.appendChild(row);
  }

  saveProgress();
  document.getElementById('scene-text-container').scrollTop = 0;
}

function createSceneButton(b, sizeClass) {
  const btn = document.createElement('button');
  btn.textContent = b.text;
  btn.className = `button ${sizeClass || ''}`;
  btn.onclick = () => {
    saveProgress();
    loadScene(b.next);
  };
  return btn;
}

function saveProgress() {
  localStorage.setItem('currentScene', `${currentChapter}:${currentScene}`);
}

function addManualSave() {
  const saves = JSON.parse(localStorage.getItem('saves') || '[]');
  const date = new Date().toLocaleString();
  saves.push({
    title: gameData.title,
    chapter: currentChapter,
    scene: currentScene,
    date
  });
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

function clearAllSaves() {
  localStorage.removeItem('saves');
  localStorage.removeItem('currentScene');
  updateSaveList();
  alert('Все сохранения удалены.');
}

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

function startNewGame() {
  localStorage.removeItem('currentScene');
  const firstChapter = Object.keys(gameData.chapters)[0];
  const firstScene = Object.keys(gameData.chapters[firstChapter])[0];
  loadScene(`${firstChapter}:${firstScene}`);
}

function loadCustomGame() {
  const input = document.getElementById('game-url').value.trim();
  if (!input) return;
  loadGame(input);
  gameUrl = input;
  closeSettingsModal();
}

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
  document.getElementById('clear-saves-btn').onclick = clearAllSaves;
  document.getElementById('load-json-btn').onclick = loadCustomGame;
};

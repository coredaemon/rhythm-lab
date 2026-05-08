# RhythmLab

RhythmLab — PWA-first ритм-помощник для дыхания, фокуса, музыки и тренировок. Приложение работает как статический сайт, использует Web Audio API для звука и хранит настройки локально в `localStorage`.

## Локальный запуск

```bash
npm install
npm run dev
```

Затем откройте адрес, который покажет Vite, обычно `http://localhost:5173/`.

## Сборка

```bash
npm run build
npm run preview
```

## GitHub Pages

По умолчанию production-сборка использует base path `/rhythm-lab/`, чтобы приложение работало по адресу вида:

```text
https://username.github.io/rhythm-lab/
```

Если репозиторий называется иначе, задайте переменную окружения:

```bash
VITE_BASE_PATH=/my-repo/ npm run build
```

В Windows PowerShell:

```powershell
$env:VITE_BASE_PATH="/my-repo/"; npm run build
```

В проект добавлен GitHub Actions workflow `.github/workflows/deploy.yml` для публикации в GitHub Pages.

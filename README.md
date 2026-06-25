# mutag

[English](README.md) | [简体中文](docs/README_CN.md)

Elegant audio tag editing software.

## Introduction

![home_screenshot](assets/screenshot/home_screenshot.png)

mutag is a cross-platform desktop application for editing audio metadata. Built with Electron and React, it provides a clear side-by-side editing workflow for browsing, comparing, modifying, and saving audio tags.

### Features And Use Cases

- **Tag editing** - Edit embedded metadata fields such as Title, Artist, Album, Year, Genre, BPM, Lyrics, and more for common audio formats including MP3, FLAC, WAV, M4A, and OGG.
- **Batch workflow** - Open a folder and recursively scan audio files up to 5 levels deep. Files are listed in the left panel and can be saved individually or written in bulk with `Accept all`.
- **Visual comparison** - The editor shows Original values on the left and Modified values on the right. Changed fields are highlighted with color and status badges (M/A/D), making edits easy to review before saving.
- **Custom fields** - Add supported metadata fields from a controlled menu, including Composer, Album Artist, Track Number, ISRC, MusicBrainz IDs, and other advanced tags.
- **Chat assistant** - Use the built-in LLM chat panel with any OpenAI-compatible API to apply contextual tag changes across files.
- **File renaming** - After changing Title and saving, files are automatically renamed to `{track_number} {title}.ext`. Track numbers are padded to two digits, and files without a track number use `title.ext`.
- **Save-time validation** - Title is validated only when saving. Empty titles, duplicate titles in the same directory, and target file-name conflicts are blocked with themed toast feedback.
- **Persistent recovery** - Global settings such as LLM configuration, layout widths, and default tag fields are saved to the system temp directory. In-progress edits and chat history are saved to `mutag.json` in the opened folder and restored on the next launch.

### Highlights

- **Local-first** - Tag reading and writing are handled directly by the Electron main process against local files. No backend service is required.
- **Fast folder entry** - Folder scanning displays skeleton loading states so the app never appears blank while loading files.
- **Keyboard-friendly** - Use arrow keys to move between files quickly: ↑/← for Prev and ↓/→ for Next.
- **Consistent UI** - The interface follows a GitHub-inspired visual language and is implemented with Tailwind CSS utility classes.
- **Predictable behavior** - File renaming is explicit, validation happens at save time, and existing data is not overwritten silently.

## Project Structure

```text
src/
  main/       Electron main process
  preload/    Electron preload API
  renderer/   React renderer process
  shared/     Shared types between main and renderer
```

## How To Develop

```powershell
git clone https://github.com/TecReaGroup/mutag
cd mutag
npm install
npm run dev
```

## Friendly Links

- [LINUX DO](https://linux.do/)

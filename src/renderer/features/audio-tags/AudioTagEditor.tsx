import { useState, useCallback, useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { ChevronLeft, ChevronRight, Save, FileAudio, Plus, X, Trash2, FolderOpen, Settings, ArrowLeft, GripVertical, Undo2 } from "lucide-react";
import type { AudioFile, AudioTag, MutagConfig, MutagProjectState, OpenFolderResult } from "@/shared/audio-tags";

const DEMO_FILES: AudioFile[] = [
  {
    id: "1",
    name: "midnight_drive.mp3",
    path: "/music/midnight_drive.mp3",
    savedTags: { title: "Midnight Drive", artist: "Neon Pulse", album: "Urban Echoes", year: "2023", genre: "Synthwave", bpm: "128", comment: "", lyrics: "[ti:Midnight Drive]\n[ar:Neon Pulse]\n[al:Urban Echoes]\n[00:00.00]\n[00:01.20] Neon lights streak across the rain\n[00:05.44] Engine hums a low refrain\n[00:09.88] The city fades in silver glow\n[00:14.12] Nowhere left but the road below\n[00:18.56] Headlights cut the boulevard\n[00:22.80] Every mile a little harder\n[00:27.04] Radio just static now\n[00:31.28] Can't remember when or how\n[00:35.52] I started driving through the night\n[00:39.76] Chasing something out of sight\n[00:44.00] The skyline shrinks in the rearview glass\n[00:48.24] Another version of me in the past\n[00:52.48] Midnight drive, midnight drive\n[00:56.72] Keeping ghosts and dreams alive\n[01:00.96] Midnight drive, midnight drive\n[01:05.20] On a road where stars arrive" },
    tempTags: null,
  },
  {
    id: "2",
    name: "summer_haze.flac",
    path: "/music/summer_haze.flac",
    savedTags: { title: "Summer Haze", artist: "Coastline", album: "Golden Hours", year: "2021", genre: "Indie Pop", bpm: "95", comment: "Live recording", lyrics: "[ti:Summer Haze]\n[ar:Coastline]\n[al:Golden Hours]\n[00:00.00]\n[00:02.30] Warm sand between my toes\n[00:05.90] Where the summer river flows\n[00:09.50] Golden light on everything\n[00:13.10] Hear the distant church bells ring\n[00:16.70] Ice melts in a paper cup\n[00:20.30] We never talk about growing up\n[00:23.90] Screen door swings in the afternoon\n[00:27.50] Sunburned kids and a half-full moon\n[00:31.10] Stay a little longer here\n[00:34.70] Before the end of the year\n[00:38.30] Summer haze over everything\n[00:41.90] Forgetting what the winters bring\n[00:45.50] Summer haze, summer haze\n[00:49.10] Lost inside these golden days\n[00:52.70] Summer haze, summer haze\n[00:56.30] Nothing ever really fades" },
    tempTags: { title: "Summer Haze", artist: "Coastline feat. Luna", album: "Golden Hours (Deluxe)", year: "2022", genre: "Indie Pop", bpm: "95", comment: "", lyrics: "[ti:Summer Haze]\n[ar:Coastline]\n[al:Golden Hours]\n[00:00.00]\n[00:02.30] Warm sand between my toes\n[00:05.90] Where the summer river flows\n[00:09.50] Golden light on everything\n[00:13.10] Hear the distant church bells ring\n[00:16.70] Ice melts in a paper cup\n[00:20.30] We never talk about growing up\n[00:23.90] Screen door swings in the afternoon\n[00:27.50] Sunburned kids and a half-full moon\n[00:31.10] Stay a little longer here\n[00:34.70] Before the end of the year\n[00:38.30] Summer haze over everything\n[00:41.90] Forgetting what the winters bring\n[00:45.50] Summer haze, summer haze\n[00:49.10] Lost inside these golden days\n[00:52.70] Summer haze, summer haze\n[00:56.30] Nothing ever really fades" },
  },
  {
    id: "3",
    name: "rain_static.wav",
    path: "/music/rain_static.wav",
    savedTags: { title: "Rain Static", artist: "Grey Matter", album: "Ambient Vol.2", year: "2022", genre: "Ambient", bpm: "60", comment: "Extended version", lyrics: "[ti:Rain Static]\n[ar:Grey Matter]\n[al:Ambient Vol.2]\n[00:00.00]\n[00:04.80] Static hiss and falling rain\n[00:12.60] Dissolving into the window pane\n[00:20.40] Nothing moves, nothing calls\n[00:28.20] Just the quiet between the walls\n[00:36.00] A breath held for too long\n[00:43.80] The absence of a song\n[00:51.60] Frequencies we cannot name\n[00:59.40] Everything and more the same\n[01:07.20] Grey on grey on grey on grey\n[01:15.00] Watching time erode away\n[01:22.80] Rain static, rain static\n[01:30.60] Filling all the attic\n[01:38.40] Rain static, rain static\n[01:46.20] Softly automatic" },
    tempTags: null,
  },
  {
    id: "4",
    name: "crystal_caves.mp3",
    path: "/music/crystal_caves.mp3",
    savedTags: { title: "Crystal Caves", artist: "Echo Chamber", album: "", year: "2024", genre: "Electronic", bpm: "140", comment: "", lyrics: "[ti:Crystal Caves]\n[ar:Echo Chamber]\n[00:00.00]\n[00:01.80] Deep below the mountain stone\n[00:04.50] Crystal walls and undertone\n[00:07.20] Echoes bounce from wall to wall\n[00:09.90] Answer to the cavern's call\n[00:12.60] Stalactites drip in time\n[00:15.30] Every drop a perfect rhyme\n[00:18.00] Bioluminescent glow\n[00:20.70] Lighting paths we'll never know\n[00:23.40] Deeper, deeper, further in\n[00:26.10] Where the hollow worlds begin\n[00:28.80] Crystal caves, crystal caves\n[00:31.50] Resonating in the haze\n[00:34.20] Crystal caves, crystal caves\n[00:36.90] Underground and all ablaze" },
    tempTags: null,
  },
  {
    id: "5",
    name: "lost_signal.aiff",
    path: "/music/lost_signal.aiff",
    savedTags: { title: "Lost Signal", artist: "Void Walker", album: "Deep Space Sessions", year: "2020", genre: "Techno", bpm: "150", comment: "", lyrics: "[ti:Lost Signal]\n[ar:Void Walker]\n[al:Deep Space Sessions]\n[00:00.00]\n[00:02.00] Signal lost at light-year four\n[00:05.20] Can't find what I'm searching for\n[00:08.40] Static fills the empty space\n[00:11.60] Drifting through this dark expanse\n[00:14.80] Transmission on repeat\n[00:18.00] No one left to hear the beat\n[00:21.20] Coordinates unknown\n[00:24.40] Traveling the void alone\n[00:27.60] Last broadcast at 03:00\n[00:30.80] Nobody received it though\n[00:34.00] Lost signal, lost signal\n[00:37.20] Fading out to minimal\n[00:40.40] Lost signal, lost signal\n[00:43.60] Beyond the dark subliminal" },
    tempTags: null,
  },
];

const TAG_FIELDS: { key: string; label: string }[] = [
  { key: "title", label: "Title" },
  { key: "artist", label: "Artist" },
  { key: "album", label: "Album" },
  { key: "year", label: "Year" },
  { key: "genre", label: "Genre" },
  { key: "bpm", label: "BPM" },
  { key: "comment", label: "Comment" },
  { key: "lyrics", label: "Lyrics" },
];

const TAG_LABELS: Record<string, string> = {
  title: "Title",
  artist: "Artist",
  album: "Album",
  year: "Year",
  genre: "Genre",
  bpm: "BPM",
  comment: "Comment",
  lyrics: "Lyrics",
  album_artist: "Album Artist",
  composer: "Composer",
  track_number: "Track Number",
  track_total: "Track Total",
  disc_number: "Disc Number",
  disc_total: "Disc Total",
  subtitle: "Subtitle",
  description: "Description",
  grouping: "Grouping",
  copyright: "Copyright",
  conductor: "Conductor",
  remixedby: "Remixed By",
  publisher: "Publisher",
  isrc: "ISRC",
  initial_key: "Initial Key",
  musicbrainz_artist_id: "MusicBrainz Artist ID",
  musicbrainz_album_id: "MusicBrainz Album ID",
  musicbrainz_albumartist_id: "MusicBrainz Album Artist ID",
  musicbrainz_track_id: "MusicBrainz Track ID",
  musicbrainz_release_group_id: "MusicBrainz Release Group ID",
  musicbrainz_disc_id: "MusicBrainz Disc ID",
  musicbrainz_release_status: "MusicBrainz Release Status",
  musicbrainz_release_type: "MusicBrainz Release Type",
  musicbrainz_release_country: "MusicBrainz Release Country",
  musicip_id: "MusicIP ID",
  amazon_id: "Amazon ID",
};

const TAG_KEY_ALIASES: Record<string, string> = {
  albumartist: "album_artist",
  track: "track_number",
  tracktotal: "track_total",
  disc: "disc_number",
  disctotal: "disc_total",
  initialkey: "initial_key",
  musicbrainzalbumid: "musicbrainz_album_id",
  musicbrainzalbumartistid: "musicbrainz_albumartist_id",
  musicbrainzartistid: "musicbrainz_artist_id",
  musicbrainztrackid: "musicbrainz_track_id",
};

function normalizeTagKey(key: string) {
  return TAG_KEY_ALIASES[key] ?? key;
}

function formatTagLabel(key: string) {
  key = normalizeTagKey(key);
  return TAG_LABELS[key] ?? key.replace(/[_-]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function getTagValue(tags: AudioTag | null | undefined, key: string) {
  if (!tags) return "";
  const normalized = normalizeTagKey(key);
  return tags[normalized] ?? tags[key] ?? "";
}

function formatSaveError(err: unknown) {
  const raw = err instanceof Error ? err.message : String(err);
  return raw
    .replace(/^Error invoking remote method '[^']+':\s*/i, "")
    .replace(/^Error:\s*/i, "");
}

type DiffStatus = "unchanged" | "modified" | "added" | "deleted";

function getFieldStatus(original: string, edited: string): DiffStatus {
  if (original !== "" && edited === "") return "deleted";
  if (original === "" && edited !== "") return "added";
  if (original !== edited) return "modified";
  return "unchanged";
}

const STATUS_INPUT_STYLE: Record<DiffStatus, string> = {
  unchanged: "bg-white border-[#d0d7de] text-[#1f2328]",
  modified:  "bg-[#fff8c5] border-[#d4a72c] text-[#633c01]",
  added:     "bg-[#dafbe1] border-[#1a7f37] text-[#0a5c28]",
  deleted:   "bg-[#ffebe9] border-[#cf222e] text-[#82071e]",
};

const STATUS_BADGE: Record<DiffStatus, { label: string; color: string }> = {
  unchanged: { label: "",  color: "" },
  modified:  { label: "M", color: "text-[#9a6700]" },
  added:     { label: "A", color: "text-[#1a7f37]" },
  deleted:   { label: "D", color: "text-[#cf222e]" },
};

function AutoTextarea({ value, onChange, onFocus, onBlur, placeholder, className }: {
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
}) {
  // A hidden mirror div drives the height (same trick the Original column relies on);
  // the textarea is absolutely positioned on top and inherits that height.
  return (
    <div className={`relative ${className ?? ""}`} style={{ padding: 0 }}>
      <div
        aria-hidden
        className="px-3 py-2 text-sm whitespace-pre-wrap break-words invisible min-h-[36px]"
      >
        {value ? value + "​" : placeholder || "​"}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className="absolute inset-0 w-full h-full px-3 py-2 text-sm bg-transparent outline-none placeholder-[#afb8c1] placeholder:italic resize-none whitespace-pre-wrap break-words"
      />
    </div>
  );
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`rounded bg-[#d8dee4] ${className}`} />;
}

function FieldSkeletonRows() {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: 8 }).map((_, idx) => (
        <div key={idx} className="flex gap-4 items-start">
          <div className="flex-1 flex flex-col">
            <SkeletonLine className="mb-1 h-3 w-20" />
            <SkeletonLine className="h-9 w-full" />
          </div>
          <div className="flex-1 flex flex-col">
            <SkeletonLine className="mb-1 h-3 w-24" />
            <SkeletonLine className="h-9 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ResizeDivider({ onDrag, extend = "both" }: { onDrag: (dx: number) => void; extend?: "left" | "right" | "both" }) {
  const dragging = useRef(false);
  const lastX = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    lastX.current = e.clientX;
    e.preventDefault();

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      onDrag(ev.clientX - lastX.current);
      lastX.current = ev.clientX;
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div className="w-px flex-shrink-0 relative group">
      <div
        onMouseDown={onMouseDown}
        className={`absolute inset-y-0 cursor-col-resize select-none flex items-center justify-center z-10 ${
          extend === "left" ? "-left-3 right-0" : extend === "right" ? "left-0 -right-3" : "-left-2 -right-2"
        }`}
      >
        <div className={`absolute inset-y-0 flex flex-col items-center justify-center text-[#d0d7de] group-hover:text-[#0969da] transition-colors ${
          extend === "left" ? "right-0" : extend === "right" ? "left-0" : "left-2"
        }`}>
          <div className="flex-1 w-px bg-current" />
          <div className="w-[3px] h-[3px] rounded-full bg-current my-[3px]" />
          <div className="w-[3px] h-[3px] rounded-full bg-current my-[3px]" />
          <div className="w-[3px] h-[3px] rounded-full bg-current my-[3px]" />
          <div className="flex-1 w-px bg-current" />
        </div>
      </div>
    </div>
  );
}

// Header row height shared across all three panels
const HEADER_H = "h-10";
const INITIAL_FILES = import.meta.env.DEV ? DEMO_FILES : [];
const INITIAL_SELECTED_ID = import.meta.env.DEV ? "2" : "";
const DEFAULT_OPENAI = {
  baseURL: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4o-mini",
  filesPerRequest: 5,
  concurrency: 1,
};
const DEFAULT_LEFT_W = 224;
const DEFAULT_RIGHT_W = 208;

function clampPositiveInteger(value: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.floor(value));
}

function chunkFiles<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

function fuzzyIncludes(value: string, query: string) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = value.toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

type SettledBatchResult<R> =
  | { ok: true; value: R }
  | { ok: false; error: unknown };

async function runSettledWithConcurrency<T, R>(items: T[], concurrency: number, worker: (item: T, index: number) => Promise<R>) {
  const results: SettledBatchResult<R>[] = new Array(items.length);
  let nextIndex = 0;
  const workerCount = Math.min(concurrency, items.length);

  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      try {
        results[index] = { ok: true, value: await worker(items[index], index) };
      } catch (error) {
        results[index] = { ok: false, error };
      }
    }
  }));

  return results;
}

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

function applyProjectState(result: OpenFolderResult, setFiles: Dispatch<SetStateAction<AudioFile[]>>, setSelectedId: Dispatch<SetStateAction<string>>, setChatMessages: Dispatch<SetStateAction<ChatMessage[]>>) {
  const projectState = result.projectState;
  setFiles(result.files);
  setSelectedId(
    projectState?.selectedId && result.files.some((f) => f.id === projectState.selectedId)
      ? projectState.selectedId
      : result.files[0]?.id ?? ""
  );
  setChatMessages(Array.isArray(projectState?.chatMessages) ? projectState.chatMessages : []);
}

export function AudioTagEditor() {
  const [files, setFiles] = useState<AudioFile[]>(INITIAL_FILES);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_SELECTED_ID);
  const [extraFields, setExtraFields] = useState<{ key: string; label: string }[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [leftW, setLeftW] = useState(DEFAULT_LEFT_W);   // files panel px
  const [rightW, setRightW] = useState(DEFAULT_RIGHT_W); // pending panel px
  const [showSettings, setShowSettings] = useState(false);
  const [defaultFieldKeys, setDefaultFieldKeys] = useState<string[]>(() => TAG_FIELDS.map((f) => f.key));
  const [settingsCategory, setSettingsCategory] = useState<"audio-tag" | "openai">("audio-tag");
  const dragFromRef = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [addingDefault, setAddingDefault] = useState(false);
  const [rightTab, setRightTab] = useState<"pending" | "chat">("pending");
  const [openAI, setOpenAI] = useState(DEFAULT_OPENAI);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [fileSearch, setFileSearch] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [projectRoot, setProjectRoot] = useState("");
  const [configLoaded, setConfigLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(!import.meta.env.DEV);
  const projectSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const configSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const scanStartRef = useRef(0);
  const MIN_SCAN_MS = 300;

  const selectedIndex = files.findIndex((f) => f.id === selectedId);
  const hasSelectedFile = selectedIndex >= 0;
  const selectedFile = files[selectedIndex] ?? {
    id: "",
    name: "No audio files found",
    path: "Open a folder with supported audio files to start editing.",
    savedTags: {} as AudioTag,
    tempTags: null,
  };
  const effectiveTags: AudioTag = hasSelectedFile ? selectedFile.tempTags ?? { ...selectedFile.savedTags } : ({} as AudioTag);
  const hasAnyChange = hasSelectedFile
    ? Object.keys({ ...effectiveTags, ...selectedFile.savedTags }).some(
        (k) => getTagValue(effectiveTags, k) !== getTagValue(selectedFile.savedTags, k)
      )
    : false;
  const hasPendingChanges = hasAnyChange;
  const visibleFiles = files.filter((f) => fuzzyIncludes(f.name, fileSearch));

  useEffect(() => {
    setIsAdding(false);
    setFocusedField(null);
    setSaveError(null);
  }, [selectedId]);

  useEffect(() => {
    fileButtonRefs.current.get(selectedId)?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  useEffect(() => {
    if (!saveError) return;
    const timer = setTimeout(() => setSaveError(null), 3500);
    return () => clearTimeout(timer);
  }, [saveError]);

  useEffect(() => {
    setIsAdding(false);
    setAddingDefault(false);
    setFocusedField(null);
  }, [showSettings, settingsCategory]);

  useEffect(() => {
    if (!configLoaded || !window.audioTagApi) return;
    if (configSaveTimerRef.current) clearTimeout(configSaveTimerRef.current);

    const config: MutagConfig = {
      lastFolder: projectRoot,
      openAI,
      audioTag: { defaultFieldKeys },
      layout: { leftW, rightW },
    };

    configSaveTimerRef.current = setTimeout(() => {
      window.audioTagApi?.saveConfig(config).catch((err) => console.warn("Failed to save mutag config", err));
    }, 250);
  }, [configLoaded, defaultFieldKeys, leftW, openAI, projectRoot, rightW]);

  useEffect(() => {
    if (!configLoaded || !projectRoot || !window.audioTagApi) return;
    if (projectSaveTimerRef.current) clearTimeout(projectSaveTimerRef.current);

    const state: MutagProjectState = {
      selectedId,
      files: Object.fromEntries(
        files.map((f) => [
          f.id,
          {
            tempTags: f.tempTags,
          },
        ])
      ),
      chatMessages,
    };

    projectSaveTimerRef.current = setTimeout(() => {
      window.audioTagApi?.saveProjectState(projectRoot, state).catch((err) => console.warn("Failed to save project state", err));
    }, 250);
  }, [chatMessages, configLoaded, files, projectRoot, selectedId]);

  useEffect(() => {
    return () => {
      if (configSaveTimerRef.current) clearTimeout(configSaveTimerRef.current);
      if (projectSaveTimerRef.current) clearTimeout(projectSaveTimerRef.current);
    };
  }, []);

  const handleOpenFolder = useCallback(async () => {
    if (!window.audioTagApi) return;

    setIsScanning(true);
    scanStartRef.current = Date.now();
    try {
      const result = await window.audioTagApi.openFolder();
      if (!result) return;
      setProjectRoot(result.root);
      applyProjectState(result, setFiles, setSelectedId, setChatMessages);
    } catch (err) {
      window.alert(`Failed to open folder: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      const remaining = MIN_SCAN_MS - (Date.now() - scanStartRef.current);
      if (remaining > 0) setTimeout(() => setIsScanning(false), remaining);
      else setIsScanning(false);
    }
  }, []);

  useEffect(() => {
    if (!window.audioTagApi) { setConfigLoaded(true); setIsScanning(false); return; }

    let cancelled = false;
    const restore = async () => {
      setIsScanning(true);
      scanStartRef.current = Date.now();
      try {
        const config = await window.audioTagApi?.loadConfig();
        if (cancelled) return;
        if (config?.openAI) {
          setOpenAI((prev) => ({
            ...prev,
            ...config.openAI,
            filesPerRequest: clampPositiveInteger(config.openAI.filesPerRequest, prev.filesPerRequest),
            concurrency: clampPositiveInteger(config.openAI.concurrency, prev.concurrency),
          }));
        }
        if (Array.isArray(config?.audioTag?.defaultFieldKeys)) setDefaultFieldKeys(config.audioTag.defaultFieldKeys);
        if (typeof config?.layout?.leftW === "number") setLeftW(config.layout.leftW);
        if (typeof config?.layout?.rightW === "number") setRightW(config.layout.rightW);

        if (config?.lastFolder) {
          const result = await window.audioTagApi?.openLastFolder(config.lastFolder);
          if (!cancelled && result) {
            setProjectRoot(result.root);
            applyProjectState(result, setFiles, setSelectedId, setChatMessages);
          }
        }
      } catch (err) {
        console.warn("Failed to restore mutag state", err);
      } finally {
        if (!cancelled) {
          setConfigLoaded(true);
          const remaining = MIN_SCAN_MS - (Date.now() - scanStartRef.current);
          if (remaining > 0) setTimeout(() => setIsScanning(false), remaining);
          else setIsScanning(false);
        }
      }
    };

    restore();
    return () => { cancelled = true; };
  }, []);

  const updateTempField = useCallback(
    (field: string, value: string) => {
      const key = normalizeTagKey(field);
      setSaveError(null);
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id !== selectedId) return f;
          const base = f.tempTags ?? { ...f.savedTags };
          return {
            ...f,
            tempTags: { ...base, [key]: value },
          };
        })
      );
    },
    [selectedId]
  );

  const deleteField = useCallback(
    (field: string) => {
      updateTempField(field, "");
    },
    [updateTempField]
  );

  const saveFile = useCallback(async () => {
    const current = files.find((f) => f.id === selectedId);
    if (!current) return;

    const next: AudioTag = { ...(current.tempTags ?? current.savedTags) } as AudioTag;

    let savedTags = next;
    let savedPath = current.path;
    let savedName = current.name;
    if (window.audioTagApi) {
      try {
        const result = await window.audioTagApi.saveTags(current.path, next);
        if (!result.ok) { setSaveError(result.error); return; }
        savedTags = result.tags;
        savedPath = result.path;
        savedName = result.name;
      } catch (err) {
        setSaveError(formatSaveError(err));
        return;
      }
    }

    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== selectedId) return f;
        return { ...f, id: savedPath, path: savedPath, name: savedName, savedTags, tempTags: null };
      })
    );
    setSelectedId(savedPath);
    setExtraFields((prev) => prev.filter(({ key }) => getTagValue(savedTags, key) !== ""));
  }, [files, selectedId]);

  const discardChanges = useCallback(() => {
    setFiles((prev) =>
      prev.map((f) => (f.id !== selectedId ? f : { ...f, tempTags: null }))
    );
  }, [selectedId]);

  const discardAll = useCallback(() => {
    setFiles((prev) => prev.map((f) => ({ ...f, tempTags: null })));
  }, []);

  const acceptAll = useCallback(async () => {
    const changedFiles = files.filter((f) => f.tempTags !== null);
    const savedById = new Map<string, { tags: AudioTag; path: string; name: string }>();

    if (window.audioTagApi) {
      try {
        for (const f of changedFiles) {
          const next: AudioTag = { ...(f.tempTags ?? f.savedTags) } as AudioTag;
          const result = await window.audioTagApi.saveTags(f.path, next);
          if (!result.ok) { setSaveError(result.error); return; }
          savedById.set(f.id, { tags: result.tags, path: result.path, name: result.name });
        }
      } catch (err) {
        setSaveError(formatSaveError(err));
        return;
      }
    }

    setFiles((prev) =>
      prev.map((f) => {
        if (f.tempTags === null) return f;
        const saved = savedById.get(f.id);
        if (saved) return { ...f, id: saved.path, path: saved.path, name: saved.name, savedTags: saved.tags, tempTags: null };
        const next: AudioTag = { ...(f.tempTags ?? f.savedTags) } as AudioTag;
        return { ...f, savedTags: next, tempTags: null };
      })
    );
    setSelectedId((prevId) => {
      const renamed = savedById.get(prevId);
      return renamed ? renamed.path : prevId;
    });
    setExtraFields((prev) =>
      prev.filter(({ key }) => files.some((f) => getTagValue(savedById.get(f.id)?.tags ?? f.savedTags, key) !== ""))
    );
  }, [files]);

  const applyChatChanges = useCallback((updates: Record<string, Record<string, string | null>>) => {
    setFiles((prev) =>
      prev.map((f) => {
        const u = updates[f.id];
        if (!u) return f;
        const nextTags: AudioTag = { ...f.savedTags };
        for (const [rawKey, v] of Object.entries(u)) {
          const k = normalizeTagKey(rawKey);
          if (v === null) {
            nextTags[k] = "";
          } else {
            nextTags[k] = String(v);
          }
        }
        return { ...f, tempTags: nextTags };
      })
    );
  }, []);

  const sendChat = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || chatSending) return;
    setChatError(null);

    const userMsg = { role: "user" as const, content: text };
    const fileDict: Record<string, AudioTag> = {};
    for (const f of files) fileDict[f.id] = f.savedTags;
    const systemMsg = {
      role: "system" as const,
      content:
        "You are an audio tag editor. The user gives you a dictionary of audio files keyed by a stable `id`, where each value is the file's current tags JSON. " +
        "Reply with ONLY a JSON object — no prose, no markdown fences. " +
        "Shape: { \"<id>\": { fieldKey: newValue, ... }, ... }. " +
        "Keys MUST be ids from the input dictionary. " +
        "Include ONLY fields you changed. Use null to delete a field. " +
        "Omit any file that needs no changes.",
    };
    const contextMsg = {
      role: "user" as const,
      content: "Files:\n" + JSON.stringify(fileDict, null, 2),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatSending(true);

    try {
      const filesPerRequest = clampPositiveInteger(openAI.filesPerRequest, DEFAULT_OPENAI.filesPerRequest);
      const concurrency = clampPositiveInteger(openAI.concurrency, DEFAULT_OPENAI.concurrency);
      const batches = chunkFiles(files, filesPerRequest);
      const url = `${openAI.baseURL.replace(/\/$/, "")}/chat/completions`;
      const results = await runSettledWithConcurrency(batches, concurrency, async (batch, batchIndex) => {
        const batchDict: Record<string, AudioTag> = {};
        for (const f of batch) batchDict[f.id] = f.savedTags;
        const batchContextMsg = {
          ...contextMsg,
          content: "Files:\n" + JSON.stringify(batchDict, null, 2),
        };

        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAI.apiKey}`,
          },
          body: JSON.stringify({
            model: openAI.model,
            messages: [systemMsg, batchContextMsg, ...chatMessages, userMsg],
          }),
        });
        if (!res.ok) throw new Error(`Batch ${batchIndex + 1}/${batches.length}: ${res.status} ${res.statusText}`);
        const data = await res.json();
        const content: string = data?.choices?.[0]?.message?.content ?? "";

        const match = content.match(/\{[\s\S]*\}/);
        if (!match) throw new Error(`Batch ${batchIndex + 1}/${batches.length}: response did not contain a JSON object`);
        const parsed = JSON.parse(match[0]);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error(`Batch ${batchIndex + 1}/${batches.length}: response was not a JSON object`);
        }
        const updates = parsed as Record<string, Record<string, string | null>>;
        applyChatChanges(updates);
        return updates;
      });

      const failures = results.filter((result) => !result.ok) as { ok: false; error: unknown }[];
      const merged = Object.assign(
        {},
        ...results.flatMap((result) => (result.ok ? [result.value] : []))
      ) as Record<string, Record<string, string | null>>;
      const count = Object.keys(merged).length;
      if (failures.length > 0) {
        const firstError = failures[0].error instanceof Error ? failures[0].error.message : String(failures[0].error);
        throw new Error(`${failures.length}/${batches.length} request(s) failed after applying ${count} file(s): ${firstError}`);
      }
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Applied changes to ${count} file(s) across ${batches.length} request(s).` },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setChatError(msg);
      setChatMessages((prev) => [...prev, { role: "assistant", content: `Error: ${msg}` }]);
    } finally {
      setChatSending(false);
    }
  }, [chatInput, chatSending, chatMessages, files, openAI, applyChatChanges]);

  const goNext = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < files.length - 1) setSelectedId(files[selectedIndex + 1].id);
  }, [files, selectedIndex]);
  const goPrev = useCallback(() => {
    if (selectedIndex > 0) setSelectedId(files[selectedIndex - 1].id);
  }, [files, selectedIndex]);

  useEffect(() => {
    if (showSettings || !hasSelectedFile) return;

    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      if (target.isContentEditable) return true;
      return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (isEditableTarget(event.target)) return;

      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, hasSelectedFile, showSettings]);
  const fileExt = (name: string) => name.split(".").pop()?.toUpperCase() ?? "?";

  const dirtyFiles = files.filter((f) => {
    if (!f.tempTags) return false;
    return Object.keys({ ...f.savedTags, ...f.tempTags }).some(
      (k) => getTagValue(f.tempTags, k) !== getTagValue(f.savedTags, k)
    );
  });
  const canClearChat = !chatSending && chatMessages.length > 0;

  const labelForKey = useCallback(
    (key: string) => extraFields.find((f) => f.key === key)?.label ?? formatTagLabel(key),
    [extraFields]
  );

  const buildFieldsForFile = useCallback(
    (file: AudioFile) => {
      const presentKeys = new Set<string>();
      for (const rawKey of Object.keys(file.savedTags)) {
        const key = normalizeTagKey(rawKey);
        if (getTagValue(file.savedTags, key) !== "") presentKeys.add(key);
      }
      if (file.tempTags) {
        for (const rawKey of Object.keys(file.tempTags)) {
          const key = normalizeTagKey(rawKey);
          if (getTagValue(file.savedTags, key) !== "" || getTagValue(file.tempTags, key) !== "") {
            presentKeys.add(key);
          }
        }
      }
      const usedKeys = new Set<string>();
      const fields: { key: string; label: string }[] = [];

      for (const key of defaultFieldKeys.map(normalizeTagKey)) {
        if (usedKeys.has(key)) continue;
        fields.push({ key, label: labelForKey(key) });
        usedKeys.add(key);
      }

      for (const key of presentKeys) {
        if (usedKeys.has(key)) continue;
        fields.push({ key, label: labelForKey(key) });
        usedKeys.add(key);
      }

      for (const { key: rawKey, label } of extraFields) {
        const key = normalizeTagKey(rawKey);
        if (usedKeys.has(key)) continue;
        fields.push({ key, label });
        usedKeys.add(key);
      }

      return fields;
    },
    [defaultFieldKeys, extraFields, labelForKey]
  );
  const allFields = hasSelectedFile ? buildFieldsForFile(selectedFile) : [];
  const knownTagFields = Object.entries(TAG_LABELS)
    .map(([key, label]) => ({ key: normalizeTagKey(key), label }))
    .filter(({ key }, idx, arr) => arr.findIndex((f) => f.key === key) === idx);
  const availableAddFields = knownTagFields
    .filter(({ key }) => !allFields.some((f) => normalizeTagKey(f.key) === key));
  const availableDefaultFields = knownTagFields
    .filter(({ key }) => !defaultFieldKeys.some((defaultKey) => normalizeTagKey(defaultKey) === key));

  const selectAddField = (key: string, label: string) => {
    if (allFields.some((f) => normalizeTagKey(f.key) === key)) { setIsAdding(false); return; }
    setExtraFields((prev) => (prev.some((f) => normalizeTagKey(f.key) === key) ? prev : [...prev, { key, label }]));
    updateTempField(key, "");
    setIsAdding(false);
  };

  if (showSettings) {
    const categories: { key: "audio-tag" | "openai"; label: string }[] = [
      { key: "audio-tag", label: "Audio Tag" },
      { key: "openai", label: "LLM" },
    ];
    const removeDefault = (k: string) =>
      setDefaultFieldKeys((prev) => prev.filter((x) => normalizeTagKey(x) !== k));
    const addDefault = (k: string) =>
      setDefaultFieldKeys((prev) => {
        const key = normalizeTagKey(k);
        return prev.map(normalizeTagKey).includes(key) ? prev : [...prev, key];
      });
    const reorderDefault = (from: number, to: number) => {
      if (from === to) return;
      setDefaultFieldKeys((prev) => {
        const next = [...prev];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
      });
    };
    const labelOf = (k: string) => labelForKey(k);
    return (
      <div className="flex flex-col h-screen w-full bg-[#f6f8fa] text-[#1f2328] font-mono overflow-hidden border-t border-[#d0d7de]">
        <div className={`${HEADER_H} px-4 flex items-center gap-2 border-b border-[#d0d7de] bg-white flex-shrink-0`}>
          <button
            onClick={() => setShowSettings(false)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[#656d76] hover:text-[#1f2328] hover:bg-[#f6f8fa] transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <span className="text-xs text-[#656d76] uppercase tracking-wider ml-2">Settings</span>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left: category nav */}
          <div className="w-56 flex-shrink-0 bg-white border-r border-[#d0d7de] py-2 overflow-y-auto">
            {categories.map((c) => {
              const active = settingsCategory === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setSettingsCategory(c.key)}
                  className={`w-full text-left px-4 py-2 text-xs transition-colors border-l-2 ${
                    active
                      ? "bg-[#ddf4ff] border-[#0969da] text-[#1f2328]"
                      : "border-transparent text-[#656d76] hover:bg-[#f6f8fa] hover:text-[#1f2328]"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Right: content */}
          <div className="flex-1 overflow-y-auto p-6">
            {settingsCategory === "audio-tag" && (
              <div className="max-w-2xl space-y-4">
                <div>
                  <h2 className="text-sm text-[#1f2328]">Default Fields</h2>
                  <p className="text-xs text-[#656d76] mt-1">
                    Default fields always appear in this order, even when empty. Other fields appear after them only while they have content; clearing an other field removes it on save.
                  </p>
                </div>

                <div className="space-y-2">
                  {defaultFieldKeys.map((rawKey, idx) => {
                    const key = normalizeTagKey(rawKey);
                    const isOver = dragOverIdx === idx;
                    return (
                      <div
                        key={key}
                        draggable
                        onDragStart={() => { dragFromRef.current = idx; }}
                        onDragOver={(e) => { e.preventDefault(); if (dragOverIdx !== idx) setDragOverIdx(idx); }}
                        onDragLeave={() => { if (dragOverIdx === idx) setDragOverIdx(null); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const from = dragFromRef.current;
                          if (from !== null) reorderDefault(from, idx);
                          dragFromRef.current = null;
                          setDragOverIdx(null);
                        }}
                        onDragEnd={() => { dragFromRef.current = null; setDragOverIdx(null); }}
                        className={`group flex items-center gap-2 px-3 py-2 bg-white border rounded transition-colors ${
                          isOver ? "border-[#0969da] bg-[#ddf4ff]" : "border-[#d0d7de]"
                        }`}
                      >
                        <span className="cursor-grab active:cursor-grabbing text-[#8c959f] hover:text-[#1f2328]">
                          <GripVertical size={14} />
                        </span>
                        <span className="text-[10px] text-[#8c959f] uppercase tracking-wider w-6">{idx + 1}</span>
                        <span className="text-sm text-[#1f2328] flex-1">{labelOf(key)}</span>
                        <button
                          onClick={() => removeDefault(key)}
                          title="Remove from defaults"
                          className="opacity-0 group-hover:opacity-100 text-[#656d76] hover:text-[#cf222e] transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}

                  <div className="relative">
                    {addingDefault && (
                      <div className="absolute bottom-full left-0 right-0 mb-2 rounded border border-[#d0d7de] bg-white shadow-lg overflow-hidden z-10">
                        <div className="h-8 px-3 flex items-center justify-between border-b border-[#d0d7de] bg-[#f6f8fa]">
                          <span className="text-[10px] text-[#656d76] uppercase tracking-wider">Choose default field</span>
                          <button
                            onClick={() => setAddingDefault(false)}
                            className="h-6 w-6 flex items-center justify-center text-[#656d76] hover:text-[#1f2328] transition-colors"
                            title="Close"
                          >
                            <X size={13} />
                          </button>
                        </div>
                        <div className="max-h-56 overflow-y-auto thin-scrollbar py-1">
                          {availableDefaultFields.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-[#8c959f] italic">No available fields</div>
                          ) : (
                            availableDefaultFields.map(({ key, label }) => (
                              <button
                                key={key}
                                onClick={() => { addDefault(key); setAddingDefault(false); }}
                                className="w-full px-3 py-2 text-left text-xs text-[#1f2328] hover:bg-[#ddf4ff] hover:text-[#0969da] transition-colors"
                              >
                                {label}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => setAddingDefault((open) => !open)}
                      className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs border border-dashed rounded transition-colors ${
                        addingDefault
                          ? "border-[#0969da] bg-[#ddf4ff] text-[#0969da]"
                          : "border-[#d0d7de] text-[#656d76] hover:text-[#0969da] hover:border-[#0969da]"
                      }`}
                    >
                      <Plus size={13} /> Add default field
                    </button>
                  </div>
                </div>
              </div>
            )}

            {settingsCategory === "openai" && (
              <div className="max-w-2xl space-y-4">
                <div>
                  <h2 className="text-sm text-[#1f2328]">OpenAI-compatible API</h2>
                  <p className="text-xs text-[#656d76] mt-1">
                    Used by the Chat panel to ask an LLM to modify tags. Any OpenAI-compatible endpoint works.
                  </p>
                </div>
                <div className="bg-white border border-[#d0d7de] rounded p-4 space-y-3">
                  <label className="block">
                    <div className="text-[10px] text-[#8c959f] uppercase tracking-wider mb-1">Base URL</div>
                    <input
                      value={openAI.baseURL}
                      onChange={(e) => setOpenAI((s) => ({ ...s, baseURL: e.target.value }))}
                      placeholder="https://api.openai.com/v1"
                      className="w-full h-8 px-2 text-sm bg-white border border-[#d0d7de] rounded outline-none focus:border-[#0969da]"
                    />
                  </label>
                  <label className="block">
                    <div className="text-[10px] text-[#8c959f] uppercase tracking-wider mb-1">API Key</div>
                    <input
                      type="password"
                      value={openAI.apiKey}
                      onChange={(e) => setOpenAI((s) => ({ ...s, apiKey: e.target.value }))}
                      placeholder="sk-..."
                      className="w-full h-8 px-2 text-sm bg-white border border-[#d0d7de] rounded outline-none focus:border-[#0969da]"
                    />
                  </label>
                  <label className="block">
                    <div className="text-[10px] text-[#8c959f] uppercase tracking-wider mb-1">Model</div>
                    <input
                      value={openAI.model}
                      onChange={(e) => setOpenAI((s) => ({ ...s, model: e.target.value }))}
                      placeholder="gpt-4o-mini"
                      className="w-full h-8 px-2 text-sm bg-white border border-[#d0d7de] rounded outline-none focus:border-[#0969da]"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <div className="text-[10px] text-[#8c959f] uppercase tracking-wider mb-1">Files per request</div>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={openAI.filesPerRequest}
                        onChange={(e) => setOpenAI((s) => ({ ...s, filesPerRequest: clampPositiveInteger(e.target.valueAsNumber, DEFAULT_OPENAI.filesPerRequest) }))}
                        className="w-full h-8 px-2 text-sm bg-white border border-[#d0d7de] rounded outline-none focus:border-[#0969da]"
                      />
                    </label>
                    <label className="block">
                      <div className="text-[10px] text-[#8c959f] uppercase tracking-wider mb-1">Concurrency</div>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={openAI.concurrency}
                        onChange={(e) => setOpenAI((s) => ({ ...s, concurrency: clampPositiveInteger(e.target.valueAsNumber, DEFAULT_OPENAI.concurrency) }))}
                        className="w-full h-8 px-2 text-sm bg-white border border-[#d0d7de] rounded outline-none focus:border-[#0969da]"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-[#656d76]">
                    Chat sends files in batches in the background, but keeps a single user message and a single assistant result in the chat history.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#f6f8fa] text-[#1f2328] font-mono overflow-hidden border-t border-[#d0d7de]">

      {/* ── Left: File List ── */}
      <div className="flex-shrink-0 border-r-0 bg-white flex flex-col" style={{ width: leftW }}>
        {/* Row 1 — aligns with middle's filename top bar */}
        <div className={`${HEADER_H} px-4 flex items-center gap-2 border-b border-[#d0d7de] flex-shrink-0`}>
          <span className="text-xs text-[#656d76] uppercase tracking-wider">Audio Files</span>
          <button
            onClick={handleOpenFolder}
            disabled={isScanning}
            title="Open folder"
            className="ml-auto flex items-center justify-center w-6 h-6 rounded text-[#656d76] hover:text-[#1f2328] hover:bg-[#f6f8fa] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <FolderOpen size={14} />
          </button>
        </div>
        {/* Row 2 — aligns with middle's Original/Modified column header row */}
        <div className={`${HEADER_H} px-4 flex items-center gap-2 border-b border-[#d0d7de] flex-shrink-0 bg-[#f6f8fa]`}>
          <span className="text-[10px] text-[#8c959f] uppercase tracking-wider flex-shrink-0">
            {isScanning ? "scanning..." : `${visibleFiles.length}${fileSearch.trim() ? `/${files.length}` : ""} items`}
          </span>
          <input
            value={fileSearch}
            onChange={(e) => setFileSearch(e.target.value)}
            disabled={isScanning}
            placeholder="Search"
            className="ml-auto min-w-0 flex-1 h-6 px-2 text-[11px] bg-white border border-[#d0d7de] rounded outline-none focus:border-[#0969da] disabled:bg-[#f6f8fa] disabled:cursor-not-allowed"
          />
        </div>

        <div className="flex-1 overflow-y-auto thin-scrollbar py-1">
          {isScanning ? (
            <div className="space-y-1 px-3 py-2">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="flex items-start gap-2 py-2">
                  <SkeletonLine className="mt-0.5 h-3 w-3 rounded-sm flex-shrink-0" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <SkeletonLine className="h-3 w-4/5" />
                    <SkeletonLine className="h-2 w-10" />
                  </div>
                </div>
              ))}
            </div>
          ) : visibleFiles.map((f) => {
            const isSelected = f.id === selectedId;
            const isDirty = (() => {
              if (!f.tempTags) return false;
              return Object.keys({ ...f.savedTags, ...f.tempTags }).some(
                (k) => getTagValue(f.tempTags, k) !== getTagValue(f.savedTags, k)
              );
            })();
            return (
              <button
                key={f.id}
                ref={(node) => {
                  if (node) fileButtonRefs.current.set(f.id, node);
                  else fileButtonRefs.current.delete(f.id);
                }}
                onClick={() => setSelectedId(f.id)}
                className={`w-full text-left px-3 py-2 flex items-start gap-2 transition-colors ${
                  isSelected
                    ? "bg-[#ddf4ff] border-l-2 border-[#0969da]"
                    : "border-l-2 border-transparent hover:bg-[#f6f8fa]"
                }`}
              >
                <FileAudio size={13} className="mt-0.5 flex-shrink-0 text-[#8c959f]" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs truncate text-[#1f2328]">{f.name}</div>
                  <div className="text-[10px] text-[#8c959f] mt-0.5">{fileExt(f.name)}</div>
                </div>
                {isDirty && <span className="text-[10px] text-[#9a6700] flex-shrink-0 mt-0.5">●</span>}
              </button>
            );
          })}
        </div>

      </div>

      <button
        onClick={() => setShowSettings(true)}
        title="Settings"
        className="fixed bottom-3 left-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#d0d7de] text-[#656d76] hover:text-[#1f2328] hover:border-[#8c959f] shadow-sm transition-colors"
      >
        <Settings size={14} />
      </button>

      <ResizeDivider extend="right" onDrag={(dx) => setLeftW((w) => Math.max(120, Math.min(480, w + dx)))} />

      {/* ── Main: Original + Modified ── */}
      <div className="relative flex-1 flex flex-col overflow-hidden bg-white">
        {saveError && (
          <div className="absolute bottom-14 left-1/2 z-30 w-[min(520px,calc(100%-32px))] -translate-x-1/2 rounded border border-[#cf222e] bg-[#ffebe9] shadow-lg">
            <div className="flex items-start gap-3 px-3 py-2">
              <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#cf222e]" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#82071e]">Save failed</div>
                <div className="mt-0.5 text-xs text-[#82071e] break-words">{saveError}</div>
              </div>
              <button
                onClick={() => setSaveError(null)}
                className="h-6 w-6 flex-shrink-0 flex items-center justify-center rounded text-[#82071e] hover:bg-[#ffd7d5] transition-colors"
                title="Close"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )}
        {/* Top bar — Row 1, HEADER_H to match side panels */}
        <div className={`${HEADER_H} px-5 border-b border-[#d0d7de] flex items-center gap-4 flex-shrink-0`}>
          <div className="min-w-0 flex-1 whitespace-nowrap truncate">
            {isScanning ? (
              <div className="flex items-center gap-2">
                <SkeletonLine className="h-4 w-48" />
                <SkeletonLine className="h-3 w-64" />
              </div>
            ) : (
              <>
                <span className="text-sm text-[#1f2328]">{selectedFile.name}</span>
                <span className="ml-2 text-xs text-[#8c959f]">{selectedFile.path}</span>
              </>
            )}
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            {hasPendingChanges && (
              <>
                <span className="text-xs text-[#9a6700]">● unsaved changes</span>
                <button
                  onClick={discardChanges}
                  className="text-xs text-[#656d76] hover:text-[#1f2328] px-2 py-1 rounded border border-[#d0d7de] hover:border-[#8c959f] transition-colors bg-white"
                >
                  Discard
                </button>
              </>
            )}
          </div>
        </div>

        {/* Column headers — same HEADER_H as Files panel */}
        <div className={`${HEADER_H} flex border-b border-[#d0d7de] flex-shrink-0 bg-[#f6f8fa]`}>
          <div className="flex-1 flex items-center px-4 border-r border-[#d0d7de]">
            <span className="text-xs text-[#656d76] uppercase tracking-wider">Original</span>
          </div>
          <div className="flex-1 flex items-center justify-between px-4">
            <span className="text-xs text-[#656d76] uppercase tracking-wider">Modified</span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="text-[#9a6700]">■ M</span>
              <span className="text-[#1a7f37]">■ A</span>
              <span className="text-[#cf222e]">■ D</span>
            </div>
          </div>
        </div>

        {/* Synchronized field rows — scroll together */}
        <div className="flex-1 overflow-y-auto thin-scrollbar">
          {isScanning ? (
            <FieldSkeletonRows />
          ) : hasSelectedFile ? (
          <div className="p-4 space-y-3">
            {allFields.map(({ key, label }) => {
              const origVal = getTagValue(selectedFile.savedTags, key);
              const editVal = getTagValue(effectiveTags, key);
              const status = getFieldStatus(origVal, editVal);
              const badge = STATUS_BADGE[status];

              return (
                /* Each row is a horizontal flex — both columns in the same div, so they share the same height */
                <div key={key} className="flex gap-4 items-start">

                  {/* Original column */}
                  <div className="flex-1 flex flex-col">
                    <div className="text-[10px] text-[#8c959f] mb-1 uppercase tracking-wider">
                      {label}
                      {defaultFieldKeys.includes(key) && (
                        <span className="text-[#cf222e] ml-1">*</span>
                      )}
                    </div>
                    <div className="flex-1 px-3 py-2 rounded border border-[#d0d7de] bg-[#f6f8fa] text-sm text-[#656d76] min-h-[36px] whitespace-pre-wrap break-words">
                      {origVal || <span className="text-[#afb8c1] italic">empty</span>}
                    </div>
                  </div>

                  {/* Modified column */}
                  <div className="flex-1 flex flex-col">
                    <div className="text-[10px] text-[#8c959f] mb-1 uppercase tracking-wider flex items-center gap-1.5">
                      <span>
                        {label}
                        {defaultFieldKeys.includes(key) && (
                          <span className="text-[#cf222e] ml-1">*</span>
                        )}
                      </span>
                      {status !== "unchanged" && (
                        <span className={`font-bold ${badge.color}`}>[{badge.label}]</span>
                      )}
                    </div>
                    <div className={`flex-1 flex items-start rounded border transition-colors ${STATUS_INPUT_STYLE[status]}`}>
                      <AutoTextarea
                        value={editVal}
                        onChange={(v) => updateTempField(key, v)}
                        onFocus={() => setFocusedField(key)}
                        onBlur={() => setTimeout(() => setFocusedField((f) => f === key ? null : f), 150)}
                        placeholder="empty"
                        className="flex-1 min-h-[36px] w-full"
                      />
                      {focusedField === key && (
                        <div className="self-stretch flex items-center flex-shrink-0">
                          {status !== "unchanged" && (
                            <button
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => updateTempField(key, origVal)}
                              title="Revert field"
                              className="h-full w-8 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
                            >
                              <Undo2 size={14} />
                            </button>
                          )}
                          <button
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => deleteField(key)}
                            title="Clear field"
                            className="h-full px-2 opacity-50 hover:opacity-100 hover:text-[#cf222e] transition-opacity"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}

            {/* Add-field row — spans Original + Modified */}
            <div className="relative">
              {isAdding && (
                <div className="absolute bottom-full left-0 right-0 mb-2 rounded border border-[#d0d7de] bg-white shadow-lg overflow-hidden z-10">
                  <div className="h-8 px-3 flex items-center justify-between border-b border-[#d0d7de] bg-[#f6f8fa]">
                    <span className="text-[10px] text-[#656d76] uppercase tracking-wider">Choose field</span>
                    <button
                      onClick={() => setIsAdding(false)}
                      className="h-6 w-6 flex items-center justify-center text-[#656d76] hover:text-[#1f2328] transition-colors"
                      title="Close"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto thin-scrollbar py-1">
                    {availableAddFields.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-[#8c959f] italic">No available fields</div>
                    ) : (
                      availableAddFields.map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => selectAddField(key, label)}
                          className="w-full px-3 py-2 text-left text-xs text-[#1f2328] hover:bg-[#ddf4ff] hover:text-[#0969da] transition-colors"
                        >
                          {label}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
              <button
                onClick={() => setIsAdding((open) => !open)}
                className={`w-full h-11 flex items-center justify-center gap-1.5 px-3 text-xs rounded border border-dashed transition-colors ${
                  isAdding
                    ? "border-[#0969da] bg-[#ddf4ff] text-[#0969da]"
                    : "border-[#d0d7de] text-[#656d76] hover:text-[#0969da] hover:border-[#0969da] hover:bg-[#ddf4ff]"
                }`}
              >
                <Plus size={14} /> Add field
              </button>
            </div>
          </div>
          ) : (
            <div className="h-full flex items-center justify-center p-6 text-center">
              <div>
                <div className="text-sm text-[#656d76]">No audio files found</div>
                <div className="mt-1 text-xs text-[#8c959f]">Choose another folder or add supported audio files within 5 folder levels.</div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom action bar */}
        <div className="p-2 border-t border-[#d0d7de] grid grid-cols-3 items-center flex-shrink-0 bg-white">
          <div className="justify-self-start">
            <button
              onClick={goPrev}
              disabled={isScanning || !hasSelectedFile || selectedIndex === 0}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded border border-[#d0d7de] bg-white text-[#656d76] hover:text-[#1f2328] hover:border-[#8c959f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={13} /> Prev
            </button>
          </div>
          <div className="justify-self-center">
            <button
              onClick={saveFile}
              disabled={isScanning || !hasAnyChange}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs rounded border border-[#1a7f37] bg-[#1f883d] text-white hover:bg-[#1a7f37] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={13} /> Save
            </button>
          </div>
          <div className="justify-self-end">
            <button
              onClick={goNext}
              disabled={isScanning || !hasSelectedFile || selectedIndex === files.length - 1}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded border border-[#d0d7de] bg-white text-[#656d76] hover:text-[#1f2328] hover:border-[#8c959f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      <ResizeDivider extend="right" onDrag={(dx) => setRightW((w) => Math.max(120, Math.min(480, w - dx)))} />

      {/* ── Right: Pending / Chat ── */}
      <div className="flex-shrink-0 bg-white flex flex-col" style={{ width: rightW }}>
        {/* Row 1 — tab switcher */}
        <div className={`${HEADER_H} flex items-stretch border-b border-[#d0d7de] flex-shrink-0`}>
          {(["pending", "chat"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setRightTab(t)}
              className={`flex-1 text-xs uppercase tracking-wider transition-colors ${
                rightTab === t
                  ? "text-[#1f2328] border-b-2 border-[#0969da] -mb-px"
                  : "text-[#656d76] hover:text-[#1f2328]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {rightTab === "pending" ? (
          <>
            <div className={`${HEADER_H} px-4 flex items-center border-b border-[#d0d7de] flex-shrink-0 bg-[#f6f8fa]`}>
              <span className="text-[10px] text-[#8c959f] uppercase tracking-wider">{dirtyFiles.length} changed</span>
            </div>
            <div className="flex-1 overflow-y-auto thin-scrollbar py-1">
              {isScanning ? (
                <div className="space-y-2 px-3 py-3">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <SkeletonLine className="h-3 w-4/5" />
                      <SkeletonLine className="h-2 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : dirtyFiles.length === 0 && (
                <div className="px-4 py-3 text-[10px] text-[#8c959f] italic">No pending changes</div>
              )}
              {!isScanning && dirtyFiles.map((f) => {
                const changes = buildFieldsForFile(f).filter(({ key }) => {
                  const orig = getTagValue(f.savedTags, key);
                  const edit = f.tempTags ? getTagValue(f.tempTags, key) : orig;
                  return orig !== edit;
                });
                return (
                  <button
                    key={f.id}
                    onClick={() => setSelectedId(f.id)}
                    className={`w-full text-left px-3 py-2 hover:bg-[#f6f8fa] transition-colors ${f.id === selectedId ? "bg-[#ddf4ff]" : ""}`}
                  >
                    <div className="text-xs text-[#1f2328] truncate">{f.name}</div>
                    <div className="mt-1 space-y-0.5">
                      {changes.map(({ key, label }) => {
                        const s = getFieldStatus(
                          getTagValue(f.savedTags, key),
                          f.tempTags ? getTagValue(f.tempTags, key) : getTagValue(f.savedTags, key)
                        );
                        return (
                          <div key={key} className="flex items-center gap-1">
                            <span className={`text-[10px] font-bold ${STATUS_BADGE[s].color}`}>{STATUS_BADGE[s].label}</span>
                            <span className="text-[10px] text-[#656d76]">{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="border-t border-[#d0d7de] p-2 flex-shrink-0 flex gap-2">
              <button
                onClick={acceptAll}
                disabled={dirtyFiles.length === 0}
                className="flex-1 px-2 py-1.5 text-xs rounded bg-[#1f883d] text-white hover:bg-[#1a7f37] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Accept all
              </button>
              <button
                onClick={discardAll}
                disabled={dirtyFiles.length === 0}
                className="flex-1 px-2 py-1.5 text-xs rounded border border-[#d0d7de] text-[#656d76] hover:text-[#cf222e] hover:border-[#cf222e] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-[#656d76] disabled:hover:border-[#d0d7de] transition-colors bg-white"
              >
                Discard all
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={`${HEADER_H} px-4 flex items-center border-b border-[#d0d7de] flex-shrink-0 bg-[#f6f8fa]`}>
              <span className="text-[10px] text-[#8c959f] uppercase tracking-wider">{files.length} files · {clampPositiveInteger(openAI.filesPerRequest, DEFAULT_OPENAI.filesPerRequest)}/request · {clampPositiveInteger(openAI.concurrency, DEFAULT_OPENAI.concurrency)} concurrent</span>
            </div>
            <div className="flex-1 overflow-y-auto thin-scrollbar p-3 space-y-2">
              {chatMessages.length === 0 && (
                <div className="text-[10px] text-[#8c959f] italic">
                  Ask the AI to modify tags across all files. It will see every file's current tags as JSON.
                </div>
              )}
              {chatMessages.map((m, i) => (
                <div
                  key={i}
                  className={`text-xs rounded px-2 py-1.5 whitespace-pre-wrap break-words ${
                    m.role === "user"
                      ? "bg-[#ddf4ff] text-[#1f2328]"
                      : "bg-[#f6f8fa] text-[#1f2328] border border-[#d0d7de]"
                  }`}
                >
                  <div className="text-[10px] text-[#8c959f] uppercase tracking-wider mb-0.5">{m.role}</div>
                  {m.content}
                </div>
              ))}
              {chatSending && (
                <div className="text-[10px] text-[#8c959f] italic">Sending…</div>
              )}
            </div>
            <div className="border-t border-[#d0d7de] p-2 flex-shrink-0 space-y-1.5">
              {chatError && (
                <div className="text-[10px] text-[#cf222e] px-1 truncate" title={chatError}>{chatError}</div>
              )}
              <div className="flex items-center gap-2">
                {dirtyFiles.length > 0 && (
                  <div className="min-w-0 flex-1 text-[10px] leading-4 text-[#9a6700] px-1 whitespace-normal break-words">
                    Discard or save pending changes before chatting.
                  </div>
                )}
                <button
                  onClick={() => setChatMessages([])}
                  disabled={!canClearChat}
                  className="ml-auto flex-shrink-0 px-2 py-1 text-[10px] rounded border border-[#d0d7de] bg-white text-[#656d76] hover:text-[#cf222e] hover:border-[#cf222e] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-[#656d76] disabled:hover:border-[#d0d7de] transition-colors"
                >
                  Clear
                </button>
              </div>
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendChat();
                  }
                }}
                disabled={dirtyFiles.length > 0 || chatSending}
                placeholder={dirtyFiles.length > 0 ? "Pending changes block chat" : "Describe the changes you want…"}
                rows={5}
                className="w-full px-2 py-1.5 text-xs bg-white border border-[#d0d7de] rounded outline-none focus:border-[#0969da] resize-none disabled:bg-[#f6f8fa] disabled:cursor-not-allowed"
              />
              <button
                onClick={sendChat}
                disabled={dirtyFiles.length > 0 || chatSending || !chatInput.trim()}
                className="w-full px-2 py-1.5 text-xs rounded bg-[#0969da] text-white hover:bg-[#0860c4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {chatSending ? "Sending…" : "Send"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

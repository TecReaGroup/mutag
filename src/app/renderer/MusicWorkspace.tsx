import { useState, useCallback, useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { ChevronLeft, ChevronRight, Save, FileAudio, Plus, X, Trash2, FolderOpen, Settings, ArrowLeft, GripVertical, Undo2, Upload, Download, Image as ImageIcon } from "lucide-react";
import type { AudioFile, AudioTag } from "../../features/audio-tags/contracts";
import type { MutagConfig } from "../../features/settings/contracts";
import type { MutagProjectState, OpenFolderResult } from "../../features/music-library/contracts";
import { CHAT_COMMANDS, resolveChatCommand } from "./chat-commands";
import type { ChatCommand } from "../../features/music-library/command-contracts";

const DEMO_FILES: AudioFile[] = [
  {
    id: "1",
    name: "midnight_drive.mp3",
    path: "/music/midnight_drive.mp3",
    savedTags: { image: "", title: "Midnight Drive", artist: "Neon Pulse", album: "Urban Echoes", year: "2023", genre: "Synthwave", bpm: "128", comment: "", lyrics: "[ti:Midnight Drive]\n[ar:Neon Pulse]\n[al:Urban Echoes]\n[00:00.00]\n[00:01.20] Neon lights streak across the rain\n[00:05.44] Engine hums a low refrain\n[00:09.88] The city fades in silver glow\n[00:14.12] Nowhere left but the road below\n[00:18.56] Headlights cut the boulevard\n[00:22.80] Every mile a little harder\n[00:27.04] Radio just static now\n[00:31.28] Can't remember when or how\n[00:35.52] I started driving through the night\n[00:39.76] Chasing something out of sight\n[00:44.00] The skyline shrinks in the rearview glass\n[00:48.24] Another version of me in the past\n[00:52.48] Midnight drive, midnight drive\n[00:56.72] Keeping ghosts and dreams alive\n[01:00.96] Midnight drive, midnight drive\n[01:05.20] On a road where stars arrive" },
    tempTags: null,
  },
  {
    id: "2",
    name: "summer_haze.flac",
    path: "/music/summer_haze.flac",
    savedTags: { image: "", title: "Summer Haze", artist: "Coastline", album: "Golden Hours", year: "2021", genre: "Indie Pop", bpm: "95", comment: "Live recording", lyrics: "[ti:Summer Haze]\n[ar:Coastline]\n[al:Golden Hours]\n[00:00.00]\n[00:02.30] Warm sand between my toes\n[00:05.90] Where the summer river flows\n[00:09.50] Golden light on everything\n[00:13.10] Hear the distant church bells ring\n[00:16.70] Ice melts in a paper cup\n[00:20.30] We never talk about growing up\n[00:23.90] Screen door swings in the afternoon\n[00:27.50] Sunburned kids and a half-full moon\n[00:31.10] Stay a little longer here\n[00:34.70] Before the end of the year\n[00:38.30] Summer haze over everything\n[00:41.90] Forgetting what the winters bring\n[00:45.50] Summer haze, summer haze\n[00:49.10] Lost inside these golden days\n[00:52.70] Summer haze, summer haze\n[00:56.30] Nothing ever really fades" },
    tempTags: { image: "", title: "Summer Haze", artist: "Coastline feat. Luna", album: "Golden Hours (Deluxe)", year: "2022", genre: "Indie Pop", bpm: "95", comment: "", lyrics: "[ti:Summer Haze]\n[ar:Coastline]\n[al:Golden Hours]\n[00:00.00]\n[00:02.30] Warm sand between my toes\n[00:05.90] Where the summer river flows\n[00:09.50] Golden light on everything\n[00:13.10] Hear the distant church bells ring\n[00:16.70] Ice melts in a paper cup\n[00:20.30] We never talk about growing up\n[00:23.90] Screen door swings in the afternoon\n[00:27.50] Sunburned kids and a half-full moon\n[00:31.10] Stay a little longer here\n[00:34.70] Before the end of the year\n[00:38.30] Summer haze over everything\n[00:41.90] Forgetting what the winters bring\n[00:45.50] Summer haze, summer haze\n[00:49.10] Lost inside these golden days\n[00:52.70] Summer haze, summer haze\n[00:56.30] Nothing ever really fades" },
  },
  {
    id: "3",
    name: "rain_static.wav",
    path: "/music/rain_static.wav",
    savedTags: { image: "", title: "Rain Static", artist: "Grey Matter", album: "Ambient Vol.2", year: "2022", genre: "Ambient", bpm: "60", comment: "Extended version", lyrics: "[ti:Rain Static]\n[ar:Grey Matter]\n[al:Ambient Vol.2]\n[00:00.00]\n[00:04.80] Static hiss and falling rain\n[00:12.60] Dissolving into the window pane\n[00:20.40] Nothing moves, nothing calls\n[00:28.20] Just the quiet between the walls\n[00:36.00] A breath held for too long\n[00:43.80] The absence of a song\n[00:51.60] Frequencies we cannot name\n[00:59.40] Everything and more the same\n[01:07.20] Grey on grey on grey on grey\n[01:15.00] Watching time erode away\n[01:22.80] Rain static, rain static\n[01:30.60] Filling all the attic\n[01:38.40] Rain static, rain static\n[01:46.20] Softly automatic" },
    tempTags: null,
  },
  {
    id: "4",
    name: "crystal_caves.mp3",
    path: "/music/crystal_caves.mp3",
    savedTags: { image: "", title: "Crystal Caves", artist: "Echo Chamber", album: "", year: "2024", genre: "Electronic", bpm: "140", comment: "", lyrics: "[ti:Crystal Caves]\n[ar:Echo Chamber]\n[00:00.00]\n[00:01.80] Deep below the mountain stone\n[00:04.50] Crystal walls and undertone\n[00:07.20] Echoes bounce from wall to wall\n[00:09.90] Answer to the cavern's call\n[00:12.60] Stalactites drip in time\n[00:15.30] Every drop a perfect rhyme\n[00:18.00] Bioluminescent glow\n[00:20.70] Lighting paths we'll never know\n[00:23.40] Deeper, deeper, further in\n[00:26.10] Where the hollow worlds begin\n[00:28.80] Crystal caves, crystal caves\n[00:31.50] Resonating in the haze\n[00:34.20] Crystal caves, crystal caves\n[00:36.90] Underground and all ablaze" },
    tempTags: null,
  },
  {
    id: "5",
    name: "lost_signal.aiff",
    path: "/music/lost_signal.aiff",
    savedTags: { image: "", title: "Lost Signal", artist: "Void Walker", album: "Deep Space Sessions", year: "2020", genre: "Techno", bpm: "150", comment: "", lyrics: "[ti:Lost Signal]\n[ar:Void Walker]\n[al:Deep Space Sessions]\n[00:00.00]\n[00:02.00] Signal lost at light-year four\n[00:05.20] Can't find what I'm searching for\n[00:08.40] Static fills the empty space\n[00:11.60] Drifting through this dark expanse\n[00:14.80] Transmission on repeat\n[00:18.00] No one left to hear the beat\n[00:21.20] Coordinates unknown\n[00:24.40] Traveling the void alone\n[00:27.60] Last broadcast at 03:00\n[00:30.80] Nobody received it though\n[00:34.00] Lost signal, lost signal\n[00:37.20] Fading out to minimal\n[00:40.40] Lost signal, lost signal\n[00:43.60] Beyond the dark subliminal" },
    tempTags: null,
  },
];

const TAG_FIELDS: { key: string; label: string }[] = [
  { key: "image", label: "Album cover" },
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
  image: "Album cover",
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

function compactTagsForChat(tags: AudioTag) {
  const compact: Record<string, string> = {};
  for (const [key, value] of Object.entries(tags)) {
    compact[key] = key === "image" && value ? "[cover image]" : value;
  }
  return compact as AudioTag;
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

function AutoTextarea({ value, onChange, onFocus, onBlur, placeholder, className, disabled }: {
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
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
        disabled={disabled}
        placeholder={placeholder}
        className="absolute inset-0 w-full h-full px-3 py-2 text-sm bg-transparent outline-none placeholder-[#afb8c1] placeholder:italic resize-none whitespace-pre-wrap break-words disabled:cursor-not-allowed"
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

function CoverPreview({ image, muted = false, onClick }: { image: string; muted?: boolean; onClick?: () => void }) {
  const preview = (
    <div className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded border border-[#d0d7de] bg-white ${onClick ? "cursor-pointer hover:border-[#0969da] transition-colors" : ""}`}>
      {image ? (
        <img src={image} alt="Album cover" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full flex items-center justify-center text-[#8c959f] bg-[#f6f8fa]">
          <ImageIcon size={24} />
        </div>
      )}
    </div>
  );

  return (
    <div className="flex items-center gap-3 min-h-[92px]">
      {onClick ? (
        <button type="button" onClick={onClick} title="Import image" className="rounded focus:outline-none focus:ring-2 focus:ring-[#0969da]">
          {preview}
        </button>
      ) : preview}
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
  timeoutSeconds: 60,
};
const DEFAULT_LEFT_W = 224;
const CHINESE_TAG_LABELS: Record<string, string> = {
  title: "歌名", artist: "歌手", album: "专辑", album_artist: "专辑歌手", genre: "流派",
  year: "年份", track: "音轨", disc: "碟号", composer: "作曲", comment: "备注",
  lyrics: "歌词", image: "封面", bpm: "节拍", copyright: "版权", publisher: "发行方",
};
const DEFAULT_RIGHT_W = 208;

function clampPositiveInteger(value: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.floor(value));
}

function fuzzyIncludes(value: string, query: string) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = value.toLowerCase();
  return terms.every((term) => haystack.includes(term));
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

export function MusicWorkspace() {
  const [files, setFiles] = useState<AudioFile[]>(INITIAL_FILES);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_SELECTED_ID);
  const [extraFields, setExtraFields] = useState<{ key: string; label: string }[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [leftW, setLeftW] = useState(DEFAULT_LEFT_W);   // files panel px
  const [rightW, setRightW] = useState(DEFAULT_RIGHT_W); // pending panel px
  const [showSettings, setShowSettings] = useState(false);
  const [defaultFieldKeys, setDefaultFieldKeys] = useState<string[]>(() => TAG_FIELDS.map((f) => f.key));
  const [settingsCategory, setSettingsCategory] = useState<"audio-tag" | "openai" | "language">("audio-tag");
  const [language, setLanguage] = useState<"en" | "zh-CN">("en");
  const t = (english: string, chinese: string) => language === "zh-CN" ? chinese : english;
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const dragFromRef = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [addingDefault, setAddingDefault] = useState(false);
  const [rightTab, setRightTab] = useState<"pending" | "chat">("pending");
  const [openAI, setOpenAI] = useState(DEFAULT_OPENAI);
  const [models, setModels] = useState<MutagConfig["openAI"][]>([]);
  const [modelDraft, setModelDraft] = useState(DEFAULT_OPENAI);
  const [modelError, setModelError] = useState("");
  const [editingModel, setEditingModel] = useState<string | null>(null);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [fileSearch, setFileSearch] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [activeCommand, setActiveCommand] = useState<ChatCommand | null>(null);
  const [acceptAllProgress, setAcceptAllProgress] = useState<{ done: number; total: number } | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [projectRoot, setProjectRoot] = useState("");
  const [configLoaded, setConfigLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(!import.meta.env.DEV);
  const projectSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const configSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const chatAbortRef = useRef<AbortController | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);
  const scanStartRef = useRef(0);
  const MIN_SCAN_MS = 300;

  const selectedIndex = files.findIndex((f) => f.id === selectedId);
  const hasSelectedFile = selectedIndex >= 0;
  const selectedFile = files[selectedIndex] ?? {
    id: "",
    name: t("No audio files found", "未找到音频文件"),
    path: t("Open a folder with supported audio files to start editing.", "打开包含音频文件的文件夹以开始编辑。"),
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
  const isFileOperationBusy = acceptAllProgress !== null || activeCommand !== null;
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
      language,
      openAI,
      models,
      audioTag: { defaultFieldKeys },
      layout: { leftW, rightW },
    };

    configSaveTimerRef.current = setTimeout(() => {
      window.audioTagApi?.saveConfig(config).catch((err) => console.warn("Failed to save mutag config", err));
    }, 250);
  }, [configLoaded, defaultFieldKeys, leftW, openAI, models, projectRoot, rightW, language]);

  useEffect(() => {
    if (!configLoaded || !projectRoot || !window.audioTagApi || activeCommand) return;
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
  }, [chatMessages, configLoaded, files, projectRoot, selectedId, activeCommand]);

  useEffect(() => {
    return () => {
      if (configSaveTimerRef.current) clearTimeout(configSaveTimerRef.current);
      if (projectSaveTimerRef.current) clearTimeout(projectSaveTimerRef.current);
    };
  }, []);

  const handleOpenFolder = useCallback(async () => {
    if (!window.audioTagApi || isFileOperationBusy) return;

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
  }, [isFileOperationBusy]);

  useEffect(() => {
    if (!window.audioTagApi) { setConfigLoaded(true); setIsScanning(false); return; }

    let cancelled = false;
    const restore = async () => {
      setIsScanning(true);
      scanStartRef.current = Date.now();
      try {
        const config = await window.audioTagApi?.loadConfig();
        if (cancelled) return;
        setLanguage(config?.language === "zh-CN" ? "zh-CN" : "en");
        if (config?.openAI) {
          setOpenAI((prev) => ({
            ...prev,
            ...config.openAI,
            filesPerRequest: clampPositiveInteger(config.openAI.filesPerRequest, prev.filesPerRequest),
            concurrency: clampPositiveInteger(config.openAI.concurrency, prev.concurrency),
            timeoutSeconds: clampPositiveInteger(config.openAI.timeoutSeconds, prev.timeoutSeconds),
          }));
          setModelDraft({ ...DEFAULT_OPENAI, ...config.openAI, timeoutSeconds: clampPositiveInteger(config.openAI.timeoutSeconds, DEFAULT_OPENAI.timeoutSeconds) });
          const restoredModels = (Array.isArray(config.models) ? config.models : [config.openAI])
            .filter((entry, index, entries) => entry.model?.trim() && entries.findIndex((other) => other.model.trim() === entry.model.trim()) === index)
            .map((entry) => ({ ...DEFAULT_OPENAI, ...entry, model: entry.model.trim(), timeoutSeconds: clampPositiveInteger(entry.timeoutSeconds, DEFAULT_OPENAI.timeoutSeconds) }));
          setModels(restoredModels);
        }
        if (Array.isArray(config?.audioTag?.defaultFieldKeys)) {
          const restored = config.audioTag.defaultFieldKeys.map(normalizeTagKey).filter((key) => key !== "image");
          setDefaultFieldKeys(["image", ...restored]);
        }
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
      if (isFileOperationBusy) return;
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
    [isFileOperationBusy, selectedId]
  );

  const deleteField = useCallback(
    (field: string) => {
      updateTempField(field, "");
    },
    [updateTempField]
  );

  const importImage = useCallback(async () => {
    if (isFileOperationBusy || !hasSelectedFile) return;
    setSaveError(null);
    try {
      const result = await window.audioTagApi?.importImage();
      if (!result || !result.ok) {
        if (result && !result.canceled && result.error) setSaveError(result.error);
        return;
      }
      updateTempField("image", result.image);
    } catch (err) {
      setSaveError(formatSaveError(err));
    }
  }, [hasSelectedFile, isFileOperationBusy, updateTempField]);

  const exportImage = useCallback(async () => {
    if (isFileOperationBusy || !hasSelectedFile) return;
    setSaveError(null);
    try {
      const result = await window.audioTagApi?.exportImage(selectedFile.path);
      if (result && !result.ok && !result.canceled && result.error) setSaveError(result.error);
    } catch (err) {
      setSaveError(formatSaveError(err));
    }
  }, [hasSelectedFile, isFileOperationBusy, selectedFile.path]);

  const saveFile = useCallback(async () => {
    if (isFileOperationBusy) return;
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
  }, [files, isFileOperationBusy, selectedId]);

  const discardChanges = useCallback(() => {
    if (isFileOperationBusy) return;
    setFiles((prev) =>
      prev.map((f) => (f.id !== selectedId ? f : { ...f, tempTags: null }))
    );
  }, [isFileOperationBusy, selectedId]);

  const discardAll = useCallback(() => {
    if (isFileOperationBusy) return;
    setFiles((prev) => prev.map((f) => ({ ...f, tempTags: null })));
  }, [isFileOperationBusy]);

  const acceptAll = useCallback(async () => {
    if (isFileOperationBusy) return;
    const changedFiles = files.filter((f) => f.tempTags !== null);
    if (changedFiles.length === 0) return;

    setSaveError(null);
    setAcceptAllProgress({ done: 0, total: changedFiles.length });
    const savedById = new Map<string, { tags: AudioTag; path: string; name: string; originalId: string }>();

    try {
      for (let index = 0; index < changedFiles.length; index += 1) {
        const f = changedFiles[index];
        const next: AudioTag = { ...(f.tempTags ?? f.savedTags) } as AudioTag;
        let savedTags = next;
        let savedPath = f.path;
        let savedName = f.name;

        if (window.audioTagApi) {
          const result = await window.audioTagApi.saveTags(f.path, next);
          if (!result.ok) { setSaveError(result.error); return; }
          savedTags = result.tags;
          savedPath = result.path;
          savedName = result.name;
        }

        savedById.set(f.id, { tags: savedTags, path: savedPath, name: savedName, originalId: f.id });
        setFiles((prev) =>
          prev.map((item) =>
            item.id === f.id
              ? { ...item, id: savedPath, path: savedPath, name: savedName, savedTags, tempTags: null }
              : item
          )
        );
        setSelectedId((prevId) => (prevId === f.id ? savedPath : prevId));
        setAcceptAllProgress({ done: index + 1, total: changedFiles.length });
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      setExtraFields((prev) =>
        prev.filter(({ key }) => files.some((f) => getTagValue(savedById.get(f.id)?.tags ?? f.savedTags, key) !== ""))
      );
    } catch (err) {
      setSaveError(formatSaveError(err));
    } finally {
      setAcceptAllProgress(null);
    }
  }, [files, isFileOperationBusy]);

  const sendChat = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || chatSending || isFileOperationBusy || isScanning) return;
    setChatError(null);

    const userMsg = { role: "user" as const, content: text };
    let command: ChatCommand | null;
    try {
      command = resolveChatCommand(text);
    } catch (error) {
      const message = formatSaveError(error);
      setChatError(message);
      setChatMessages((prev) => [...prev, userMsg, { role: "assistant", content: message }]);
      return;
    }
    if (command) {
      if (files.some((file) => file.tempTags && Object.keys({ ...file.savedTags, ...file.tempTags }).some(
        (key) => getTagValue(file.tempTags, key) !== getTagValue(file.savedTags, key)))) {
        setChatError("请先保存或丢弃待处理修改，再执行命令。");
        return;
      }
      setChatMessages((prev) => [...prev, userMsg]);
      setChatInput("");
      setActiveCommand(command);
      setChatSending(true);
      if (projectSaveTimerRef.current) clearTimeout(projectSaveTimerRef.current);
      try {
        const outcome = await command.execute({
          projectRoot,
          files,
          selectedId,
          chatMessages: [...chatMessages, userMsg],
          openAI,
        });
        setFiles(outcome.files);
        setSelectedId(outcome.selectedId);
        setChatMessages((prev) => [...prev, { role: "assistant", content: outcome.message }]);
      } catch (error) {
        const message = formatSaveError(error);
        setChatError(message);
        setChatMessages((prev) => [...prev, { role: "assistant", content: `${command.name} 执行失败：${message}` }]);
      } finally {
        setActiveCommand(null);
        setChatSending(false);
      }
      return;
    }
    const fileDict: Record<string, AudioTag> = {};
    for (const f of files) fileDict[f.id] = compactTagsForChat(f.savedTags);
    const systemMsg = {
      role: "system" as const,
      content:
        "You are a helpful music assistant. Reply conversationally in the user's language. " +
        "The supplied audio tags are context only. This conversation cannot modify files or metadata. " +
        "For metadata completion suggest /meta, for file organisation /organise, and for artwork downloads /image. " +
        "Do not claim to have executed commands or searched websites without tools.",
    };
    const contextMsg = {
      role: "user" as const,
      content: "Files:\n" + JSON.stringify(fileDict, null, 2),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatSending(true);
    const abortController = new AbortController();
    chatAbortRef.current = abortController;

    try {
      const url = `${openAI.baseURL.replace(/\/$/, "")}/chat/completions`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAI.apiKey}`,
        },
        signal: AbortSignal.any([abortController.signal, AbortSignal.timeout(openAI.timeoutSeconds * 1000)]),
        body: JSON.stringify({
          model: openAI.model,
          messages: [systemMsg, contextMsg, ...chatMessages, userMsg],
        }),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const completion = await res.json();
      const content = completion?.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim()) throw new Error("LLM 未返回对话内容。");
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content },
      ]);
    } catch (err) {
      if (abortController.signal.aborted) {
        setChatMessages((prev) => [...prev, { role: "assistant", content: "对话已停止。" }]);
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      setChatError(msg);
      setChatMessages((prev) => [...prev, { role: "assistant", content: `Error: ${msg}` }]);
    } finally {
      if (chatAbortRef.current === abortController) chatAbortRef.current = null;
      setChatSending(false);
    }
  }, [chatInput, chatSending, chatMessages, files, isFileOperationBusy, isScanning, projectRoot, selectedId, openAI]);

  const goNext = useCallback(() => {
    if (isFileOperationBusy) return;
    if (selectedIndex >= 0 && selectedIndex < files.length - 1) setSelectedId(files[selectedIndex + 1].id);
  }, [files, isFileOperationBusy, selectedIndex]);
  const goPrev = useCallback(() => {
    if (isFileOperationBusy) return;
    if (selectedIndex > 0) setSelectedId(files[selectedIndex - 1].id);
  }, [files, isFileOperationBusy, selectedIndex]);

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
    (key: string) => (language === "zh-CN" ? CHINESE_TAG_LABELS[key] : undefined) ?? extraFields.find((f) => f.key === key)?.label ?? formatTagLabel(key),
    [extraFields, language]
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
    .map(([key, label]) => ({ key: normalizeTagKey(key), label: language === "zh-CN" ? CHINESE_TAG_LABELS[key] ?? label : label }))
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
    const categories: { key: "audio-tag" | "openai" | "language"; label: string }[] = [
      { key: "audio-tag", label: t("Audio Tag", "音频标签") },
      { key: "openai", label: "LLM" },
      { key: "language", label: t("Language", "语言") },
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
            onClick={() => { if (!isFileOperationBusy) setShowSettings(false); }}
            disabled={isFileOperationBusy}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[#656d76] hover:text-[#1f2328] hover:bg-[#f6f8fa] transition-colors"
          >
            <ArrowLeft size={14} /> {t("Back", "返回")}
          </button>
          <span className="text-xs text-[#656d76] uppercase tracking-wider ml-2">{t("Settings", "设置")}</span>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left: category nav */}
          <div className="w-56 flex-shrink-0 bg-white border-r border-[#d0d7de] py-2 overflow-y-auto">
            {categories.map((c) => {
              const active = settingsCategory === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => { if (!isFileOperationBusy) setSettingsCategory(c.key); }}
                  disabled={isFileOperationBusy}
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
            {settingsCategory === "language" && (
              <div className="max-w-2xl space-y-3">
                <h2 className="text-sm">{t("Language", "语言")}</h2>
                <select
                  aria-label={t("Language", "语言")}
                  value={language}
                  onChange={(event) => setLanguage(event.target.value as "en" | "zh-CN")}
                  className="w-full h-9 px-2 text-sm bg-white border border-[#d0d7de] rounded outline-none focus:border-[#0969da]"
                >
                  <option value="en">English</option>
                  <option value="zh-CN">简体中文</option>
                </select>
                <p className="text-xs text-[#656d76]">{t("Changes apply immediately and are saved automatically.", "切换后立即生效并自动保存。")}</p>
              </div>
            )}
            {settingsCategory === "audio-tag" && (
              <div className="max-w-2xl space-y-4">
                <div>
                  <h2 className="text-sm text-[#1f2328]">{t("Default Fields", "默认字段")}</h2>
                  <p className="text-xs text-[#656d76] mt-1">
                    {t("Default fields always appear in this order, even when empty. Other fields appear after them only while they have content; clearing an other field removes it on save.", "默认字段始终按此顺序显示，即使为空。其他字段仅在有内容时显示，清空后将在保存时移除。")}
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
                          onClick={() => { if (!isFileOperationBusy) removeDefault(key); }}
                          title={t("Remove from defaults", "从默认字段移除")}
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
                          <span className="text-[10px] text-[#656d76] uppercase tracking-wider">{t("Choose default field", "选择默认字段")}</span>
                          <button
                            onClick={() => { if (!isFileOperationBusy) setAddingDefault(false); }}
                            className="h-6 w-6 flex items-center justify-center text-[#656d76] hover:text-[#1f2328] transition-colors"
                            title={t("Close", "关闭")}
                          >
                            <X size={13} />
                          </button>
                        </div>
                        <div className="max-h-56 overflow-y-auto thin-scrollbar py-1">
                          {availableDefaultFields.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-[#8c959f] italic">{t("No available fields", "没有可用字段")}</div>
                          ) : (
                            availableDefaultFields.map(({ key, label }) => (
                              <button
                                key={key}
                                onClick={() => { if (!isFileOperationBusy) { addDefault(key); setAddingDefault(false); } }}
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
                      onClick={() => { if (!isFileOperationBusy) setAddingDefault((open) => !open); }}
                      disabled={isFileOperationBusy}
                      className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs border border-dashed rounded transition-colors ${
                        addingDefault
                          ? "border-[#0969da] bg-[#ddf4ff] text-[#0969da]"
                          : "border-[#d0d7de] text-[#656d76] hover:text-[#0969da] hover:border-[#0969da]"
                      }`}
                    >
                      <Plus size={13} /> {t("Add default field", "添加默认字段")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {settingsCategory === "openai" && (
              <div className="max-w-2xl space-y-4">
                <div>
                  <h2 className="text-sm text-[#1f2328]">{t("OpenAI-compatible API", "兼容 OpenAI 的接口")}</h2>
                  <p className="text-xs text-[#656d76] mt-1">
                    {t("Used for conversations and commands. Any OpenAI-compatible endpoint works.", "用于对话和命令，支持兼容 OpenAI 的接口。")}
                  </p>
                </div>
                {[...models, ...(editingModel === "" ? [{ ...DEFAULT_OPENAI, model: "" }] : [])].map((profile) => (
                <div key={profile.model} className="bg-white border border-[#d0d7de] rounded overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <button
                      aria-expanded={editingModel === profile.model}
                      className="flex flex-1 min-w-0 items-center justify-between gap-3 text-left text-xs"
                      onClick={() => {
                        if (editingModel === profile.model) { setEditingModel(null); }
                        else { setEditingModel(profile.model); setModelDraft(profile); }
                        setModelError("");
                      }}
                    >
                      <span className="min-w-0 break-all">{profile.model || t("New model", "新模型")}{profile.model && profile.model === openAI.model ? t(" · Active", " · 当前模型") : ""}</span>
                      <ChevronRight size={16} className={`shrink-0 text-[#656d76] transition-transform ${editingModel === profile.model ? "rotate-90" : ""}`} />
                    </button>
                  </div>
                {editingModel === profile.model && <div className="border-t border-[#d0d7de] p-4 space-y-3">
                  <label className="block">
                    <div className="text-[10px] text-[#8c959f] uppercase tracking-wider mb-1">{t("Model", "模型")}</div>
                    <input
                      autoFocus
                      value={modelDraft.model}
                      onChange={(e) => { setModelError(""); setModelDraft((s) => ({ ...s, model: e.target.value })); }}
                      placeholder="gpt-4o-mini"
                      className="w-full h-8 px-2 text-sm bg-white border border-[#d0d7de] rounded outline-none focus:border-[#0969da]"
                    />
                  </label>
                  <label className="block">
                    <div className="text-[10px] text-[#8c959f] uppercase tracking-wider mb-1">{t("Base URL", "接口地址")}</div>
                    <input
                      value={modelDraft.baseURL}
                      onChange={(e) => setModelDraft((s) => ({ ...s, baseURL: e.target.value }))}
                      placeholder="https://api.openai.com/v1"
                      className="w-full h-8 px-2 text-sm bg-white border border-[#d0d7de] rounded outline-none focus:border-[#0969da]"
                    />
                  </label>
                  <label className="block">
                    <div className="text-[10px] text-[#8c959f] uppercase tracking-wider mb-1">{t("API Key", "API 密钥")}</div>
                    <input
                      type="password"
                      value={modelDraft.apiKey}
                      onChange={(e) => setModelDraft((s) => ({ ...s, apiKey: e.target.value }))}
                      placeholder="sk-..."
                      className="w-full h-8 px-2 text-sm bg-white border border-[#d0d7de] rounded outline-none focus:border-[#0969da]"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <div className="text-[10px] text-[#8c959f] uppercase tracking-wider mb-1">{t("Files per request", "每批文件数")}</div>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={modelDraft.filesPerRequest}
                        onChange={(e) => setModelDraft((s) => ({ ...s, filesPerRequest: clampPositiveInteger(e.target.valueAsNumber, DEFAULT_OPENAI.filesPerRequest) }))}
                        className="w-full h-8 px-2 text-sm bg-white border border-[#d0d7de] rounded outline-none focus:border-[#0969da]"
                      />
                    </label>
                    <label className="block">
                      <div className="text-[10px] text-[#8c959f] uppercase tracking-wider mb-1">{t("Concurrency", "并发数")}</div>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={modelDraft.concurrency}
                        onChange={(e) => setModelDraft((s) => ({ ...s, concurrency: clampPositiveInteger(e.target.valueAsNumber, DEFAULT_OPENAI.concurrency) }))}
                        className="w-full h-8 px-2 text-sm bg-white border border-[#d0d7de] rounded outline-none focus:border-[#0969da]"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-[#656d76]">
                    {t("All LLM commands use the selected model's settings. Batch size counts files for /meta and artist directories for /image. Conversations use one request.", "所有 LLM 命令使用所选模型的配置。/meta 按文件分批，/image 按歌手目录分批；普通对话使用单次请求。")}
                  </p>
                  <label className="block">
                    <div className="text-[10px] text-[#8c959f] tracking-wider mb-1">{t("Maximum wait (seconds)", "最多等待秒数")}</div>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={modelDraft.timeoutSeconds}
                      onChange={(e) => setModelDraft((s) => ({ ...s, timeoutSeconds: clampPositiveInteger(e.target.valueAsNumber, DEFAULT_OPENAI.timeoutSeconds) }))}
                      className="w-full h-8 px-2 text-sm bg-white border border-[#d0d7de] rounded outline-none focus:border-[#0969da]"
                    />
                    <p className="text-xs text-[#656d76] mt-1">{t("Timeout per LLM request, 60 seconds by default. Metadata batches are timed separately.", "单次 LLM 请求的等待上限，默认 60 秒；元数据补齐按每批请求计时。")}</p>
                  </label>
                  {modelError && <p role="alert" className="text-xs text-[#cf222e]">{modelError}</p>}
                  <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      const model = modelDraft.model.trim();
                      if (!model || !modelDraft.baseURL.trim()) { setModelError(t("Base URL and Model are required.", "Base URL 和 Model 不能为空。")); return; }
                      if (models.some((entry) => entry.model === model && entry.model !== profile.model)) { setModelError(t("Model already exists.", "Model 已存在，不能重复。")); return; }
                      const updated = { ...modelDraft, model, baseURL: modelDraft.baseURL.trim() };
                      setModels((entries) => profile.model
                        ? entries.map((entry) => entry.model === profile.model ? updated : entry)
                        : [...entries, updated]);
                      if (!models.length || openAI.model === profile.model) setOpenAI(updated);
                      setModelError("");
                      setEditingModel(null);
                    }}
                    className="px-4 py-2 text-xs rounded bg-[#0969da] text-white hover:bg-[#0860c4]"
                  >{t("Save", "保存")}</button>
                  <button
                    aria-label={`${t("Delete", "删除")} ${profile.model || t("New model", "新模型")}`}
                    className="px-4 py-2 text-xs rounded border border-[#cf222e] text-[#cf222e] hover:bg-[#ffebe9]"
                    onClick={() => {
                      const remaining = models.filter((entry) => entry.model !== profile.model);
                      setModels(remaining);
                      if (profile.model === openAI.model) setOpenAI(remaining[0] ?? { ...DEFAULT_OPENAI, model: "", apiKey: "" });
                      setEditingModel(null);
                      setModelError("");
                    }}
                  >{t("Delete", "删除")}</button>
                  </div>
                </div>}
                </div>
                ))}
                <button
                  disabled={editingModel === ""}
                  onClick={() => { setEditingModel(""); setModelDraft({ ...DEFAULT_OPENAI, model: "", apiKey: "" }); setModelError(""); }}
                  className="flex items-center justify-center gap-1 w-full px-3 py-2 text-xs rounded border border-dashed border-[#d0d7de] text-[#0969da] hover:bg-[#ddf4ff] disabled:opacity-40"
                ><Plus size={13} /> {t("Add", "添加")}</button>
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
          <span className="text-xs text-[#656d76] uppercase tracking-wider">{t("Audio Files", "音频文件")}</span>
          <button
            onClick={handleOpenFolder}
            disabled={isScanning || isFileOperationBusy}
            title={t("Open folder", "打开文件夹")}
            className="ml-auto flex items-center justify-center w-6 h-6 rounded text-[#656d76] hover:text-[#1f2328] hover:bg-[#f6f8fa] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <FolderOpen size={14} />
          </button>
        </div>
        {/* Row 2 — aligns with middle's Original/Modified column header row */}
        <div className={`${HEADER_H} px-4 flex items-center gap-2 border-b border-[#d0d7de] flex-shrink-0 bg-[#f6f8fa]`}>
          <span className="text-[10px] text-[#8c959f] uppercase tracking-wider flex-shrink-0">
            {isScanning ? t("scanning...", "扫描中…") : `${visibleFiles.length}${fileSearch.trim() ? `/${files.length}` : ""} ${t("items", "项")}`}
          </span>
          <input
            value={fileSearch}
            onChange={(e) => setFileSearch(e.target.value)}
            disabled={isScanning || isFileOperationBusy}
            placeholder={t("Search", "搜索")}
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
                onClick={() => { if (!isFileOperationBusy) setSelectedId(f.id); }}
                disabled={isFileOperationBusy}
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
        onClick={() => { if (!isFileOperationBusy) setShowSettings(true); }}
        disabled={isFileOperationBusy}
        title={t("Settings", "设置")}
        className="fixed bottom-3 left-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#d0d7de] text-[#656d76] hover:text-[#1f2328] hover:border-[#8c959f] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors"
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
                <div className="text-xs font-bold text-[#82071e]">{t("Save failed", "保存失败")}</div>
                <div className="mt-0.5 text-xs text-[#82071e] break-words">{saveError}</div>
              </div>
              <button
                onClick={() => setSaveError(null)}
                className="h-6 w-6 flex-shrink-0 flex items-center justify-center rounded text-[#82071e] hover:bg-[#ffd7d5] transition-colors"
                title={t("Close", "关闭")}
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
            <span className="text-xs text-[#656d76] uppercase tracking-wider">{t("Original", "原始值")}</span>
          </div>
          <div className="flex-1 flex items-center justify-between px-4">
            <span className="text-xs text-[#656d76] uppercase tracking-wider">{t("Modified", "修改值")}</span>
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
              const isImageField = key === "image";

              return (
                /* Each row is a horizontal flex — both columns in the same div, so they share the same height */
                <div key={key} className="flex gap-4 items-start">

                  {/* Original column */}
                  <div className="flex-1 flex flex-col">
                    <div className="text-[10px] text-[#8c959f] mb-1 uppercase tracking-wider flex items-center gap-1.5">
                      <span>
                        {label}
                        {defaultFieldKeys.includes(key) && (
                          <span className="text-[#cf222e] ml-1">*</span>
                        )}
                      </span>
                      {isImageField && (
                        <button
                          onClick={exportImage}
                          disabled={isFileOperationBusy || !origVal}
                          title={t("Export image", "导出图片")}
                          className="ml-auto h-5 w-5 flex items-center justify-center rounded text-[#656d76] hover:text-[#0969da] hover:bg-[#ddf4ff] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <Download size={12} />
                        </button>
                      )}
                    </div>
                    <div className="flex-1 px-3 py-2 rounded border border-[#d0d7de] bg-[#f6f8fa] text-sm text-[#656d76] min-h-[36px] whitespace-pre-wrap break-words">
                      {isImageField ? (
                        <CoverPreview image={origVal} muted />
                      ) : (
                        origVal || <span className="text-[#afb8c1] italic">{t("empty", "空")}</span>
                      )}
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
                      {isImageField && (
                        <button
                          onClick={importImage}
                          disabled={isFileOperationBusy}
                          title={t("Import image", "导入图片")}
                          className="ml-auto h-5 w-5 flex items-center justify-center rounded text-[#656d76] hover:text-[#0969da] hover:bg-[#ddf4ff] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <Upload size={12} />
                        </button>
                      )}
                    </div>
                    <div className={`flex-1 flex items-start rounded border transition-colors ${STATUS_INPUT_STYLE[status]}`}>
                      {isImageField ? (
                        <>
                          <div className="flex-1 px-3 py-2">
                            <CoverPreview image={editVal} onClick={isFileOperationBusy ? undefined : importImage} />
                          </div>
                          {!isFileOperationBusy && (
                            <div className="self-stretch flex items-center flex-shrink-0">
                              {status !== "unchanged" && (
                                <button
                                  onClick={() => updateTempField(key, origVal)}
                                  title={t("Revert field", "还原字段")}
                                  className="h-full w-8 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
                                >
                                  <Undo2 size={14} />
                                </button>
                              )}
                              <button
                                onClick={() => deleteField(key)}
                                title={t("Clear image", "清除图片")}
                                className="h-full px-2 opacity-50 hover:opacity-100 hover:text-[#cf222e] transition-opacity"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <AutoTextarea
                            value={editVal}
                            onChange={(v) => updateTempField(key, v)}
                            onFocus={() => setFocusedField(key)}
                            onBlur={() => setTimeout(() => setFocusedField((f) => f === key ? null : f), 150)}
                            placeholder={t("empty", "空")}
                            className="flex-1 min-h-[36px] w-full"
                            disabled={isFileOperationBusy}
                          />
                          {!isFileOperationBusy && focusedField === key && (
                            <div className="self-stretch flex items-center flex-shrink-0">
                              {status !== "unchanged" && (
                                <button
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => updateTempField(key, origVal)}
                                  title={t("Revert field", "还原字段")}
                                  className="h-full w-8 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
                                >
                                  <Undo2 size={14} />
                                </button>
                              )}
                              <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => deleteField(key)}
                                title={t("Clear field", "清空字段")}
                                className="h-full px-2 opacity-50 hover:opacity-100 hover:text-[#cf222e] transition-opacity"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </>
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
                    <span className="text-[10px] text-[#656d76] uppercase tracking-wider">{t("Choose field", "选择字段")}</span>
                    <button
                      onClick={() => setIsAdding(false)}
                      className="h-6 w-6 flex items-center justify-center text-[#656d76] hover:text-[#1f2328] transition-colors"
                      title={t("Close", "关闭")}
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto thin-scrollbar py-1">
                    {availableAddFields.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-[#8c959f] italic">{t("No available fields", "没有可用字段")}</div>
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
                onClick={() => { if (!isFileOperationBusy) setIsAdding((open) => !open); }}
                disabled={isFileOperationBusy}
                className={`w-full h-11 flex items-center justify-center gap-1.5 px-3 text-xs rounded border border-dashed transition-colors ${
                  isAdding
                    ? "border-[#0969da] bg-[#ddf4ff] text-[#0969da]"
                    : "border-[#d0d7de] text-[#656d76] hover:text-[#0969da] hover:border-[#0969da] hover:bg-[#ddf4ff]"
                }`}
              >
                <Plus size={14} /> {t("Add field", "添加字段")}
              </button>
            </div>
          </div>
          ) : (
            <div className="h-full flex items-center justify-center p-6 text-center">
              <div>
                <div className="text-sm text-[#656d76]">{t("No audio files found", "未找到音频文件")}</div>
                <div className="mt-1 text-xs text-[#8c959f]">{t("Choose another folder or add supported audio files within 5 folder levels.", "请选择其他文件夹，或在 5 层目录范围内添加支持的音频文件。")}</div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom action bar */}
        <div className="p-2 border-t border-[#d0d7de] grid grid-cols-3 items-center flex-shrink-0 bg-white">
          <div className="justify-self-start">
            <button
              onClick={goPrev}
              disabled={isScanning || isFileOperationBusy || !hasSelectedFile || selectedIndex === 0}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded border border-[#d0d7de] bg-white text-[#656d76] hover:text-[#1f2328] hover:border-[#8c959f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={13} /> {t("Prev", "上一个")}
            </button>
          </div>
          <div className="justify-self-center">
            <button
              onClick={saveFile}
              disabled={isScanning || isFileOperationBusy || !hasAnyChange}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs rounded border border-[#1a7f37] bg-[#1f883d] text-white hover:bg-[#1a7f37] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={13} /> {t("Save", "保存")}
            </button>
          </div>
          <div className="justify-self-end">
            <button
              onClick={goNext}
              disabled={isScanning || isFileOperationBusy || !hasSelectedFile || selectedIndex === files.length - 1}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded border border-[#d0d7de] bg-white text-[#656d76] hover:text-[#1f2328] hover:border-[#8c959f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t("Next", "下一个")} <ChevronRight size={13} />
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
              onClick={() => { if (!isFileOperationBusy) setRightTab(t); }}
              disabled={isFileOperationBusy}
              className={`flex-1 text-xs uppercase tracking-wider transition-colors ${
                rightTab === t
                  ? "text-[#1f2328] border-b-2 border-[#0969da] -mb-px"
                  : "text-[#656d76] hover:text-[#1f2328]"
              }`}
            >
              {language === "zh-CN" ? (t === "pending" ? "待保存" : "对话") : t}
            </button>
          ))}
        </div>

        {rightTab === "pending" ? (
          <>
            <div className={`${HEADER_H} px-4 flex items-center border-b border-[#d0d7de] flex-shrink-0 bg-[#f6f8fa]`}>
              <span className="text-[10px] text-[#8c959f] uppercase tracking-wider">{dirtyFiles.length} {t("changed", "个已修改")}</span>
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
                <div className="px-4 py-3 text-[10px] text-[#8c959f] italic">{t("No pending changes", "没有待保存的修改")}</div>
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
                    onClick={() => { if (!isFileOperationBusy) setSelectedId(f.id); }}
                    disabled={isFileOperationBusy}
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
                disabled={dirtyFiles.length === 0 || isFileOperationBusy}
                className="flex-1 px-2 py-1.5 text-xs rounded bg-[#1f883d] text-white hover:bg-[#1a7f37] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {acceptAllProgress ? `${t("Saving", "保存中")} ${acceptAllProgress.done}/${acceptAllProgress.total}` : t("Accept all", "全部保存")}
              </button>
              <button
                onClick={discardAll}
                disabled={dirtyFiles.length === 0 || isFileOperationBusy}
                className="flex-1 px-2 py-1.5 text-xs rounded border border-[#d0d7de] text-[#656d76] hover:text-[#cf222e] hover:border-[#cf222e] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-[#656d76] disabled:hover:border-[#d0d7de] transition-colors bg-white"
              >
                {t("Discard all", "全部放弃")}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={`${HEADER_H} px-4 flex items-center border-b border-[#d0d7de] flex-shrink-0 bg-[#f6f8fa]`}>
              <span className="text-[10px] text-[#8c959f] uppercase tracking-wider">{files.length} {t("files", "个文件")} · {clampPositiveInteger(openAI.filesPerRequest, DEFAULT_OPENAI.filesPerRequest)}/{t("request", "批")} · {clampPositiveInteger(openAI.concurrency, DEFAULT_OPENAI.concurrency)} {t("concurrent", "并发")}</span>
            </div>
            <div className="flex-1 overflow-y-auto thin-scrollbar p-3 space-y-2">
              {chatMessages.length === 0 && (
                <div className="text-[10px] text-[#8c959f] italic">
                  {t("Chat normally, or send /meta to complete metadata, /organise to organise files, and /image to download artwork.", "可以直接对话，或发送 /meta 补齐元数据、/organise 整理文件、/image 下载图片。")}
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
                  <div className="text-[10px] text-[#8c959f] uppercase tracking-wider mb-0.5">{t(m.role, m.role === "user" ? "用户" : m.role === "assistant" ? "助手" : "系统")}</div>
                  {m.content}
                </div>
              ))}
              {chatSending && (
                <div className="text-[10px] text-[#8c959f] italic">{activeCommand ? t("Running command…", activeCommand.progressMessage) : t("Sending…", "发送中…")}</div>
              )}
            </div>
            <div className="border-t border-[#d0d7de] p-2 flex-shrink-0 space-y-1.5">
              {chatError && (
                <div className="text-[10px] text-[#cf222e] px-1 truncate" title={chatError}>{chatError}</div>
              )}
              <div className="flex items-center gap-2">
                {isFileOperationBusy ? (
                  <div className="min-w-0 flex-1 text-[10px] leading-4 text-[#9a6700] px-1 whitespace-normal break-words">
                    {activeCommand ? t("Running command…", activeCommand.progressMessage) : t("Saving pending changes one by one. Other actions are disabled.", "正在逐个保存修改，其他操作暂不可用。")}
                  </div>
                ) : dirtyFiles.length > 0 && (
                  <div className="min-w-0 flex-1 text-[10px] leading-4 text-[#9a6700] px-1 whitespace-normal break-words">
                    {t("Save or discard pending changes before running commands. You can still chat.", "运行命令前请保存或放弃待确认修改，仍可继续对话。")}
                  </div>
                )}
                <button
                  onClick={() => {
                    if (chatSending) chatAbortRef.current?.abort();
                    else setChatMessages([]);
                  }}
                  disabled={isFileOperationBusy || (!chatSending && !canClearChat)}
                  className={`ml-auto flex-shrink-0 px-2 py-1 text-[10px] rounded border bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
                    chatSending
                      ? "border-[#cf222e] text-[#cf222e] hover:bg-[#ffebe9]"
                      : "border-[#d0d7de] text-[#656d76] hover:text-[#cf222e] hover:border-[#cf222e] disabled:hover:text-[#656d76] disabled:hover:border-[#d0d7de]"
                  }`}
                >
                  {chatSending ? t("Stop", "停止") : t("Clear", "清空")}
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {CHAT_COMMANDS.map((command) => (
                  <button
                    key={command.name}
                    onClick={() => { setChatInput(command.name); chatInputRef.current?.focus(); }}
                    disabled={dirtyFiles.length > 0 || chatSending || isFileOperationBusy || isScanning}
                    title={t(command.name === "/meta" ? "Complete missing metadata" : command.name === "/image" ? "Download missing artwork" : "Organise audio files", command.description)}
                    className="px-2 py-1 text-[10px] rounded border border-[#d0d7de] text-[#0969da] hover:bg-[#ddf4ff] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {command.name}
                  </button>
                ))}
              </div>
              <div className="relative">
              <textarea
                ref={chatInputRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendChat();
                  }
                }}
                disabled={chatSending || isFileOperationBusy || isScanning}
                placeholder={activeCommand ? t("Running command…", activeCommand.progressMessage) : (isFileOperationBusy ? t("Saving changes...", "正在保存修改…") : t("Send a message or choose a /command…", "输入消息或选择 /命令…"))}
                rows={5}
                className="block w-full px-2 pt-1.5 pb-10 text-xs bg-white border border-[#d0d7de] rounded outline-none focus:border-[#0969da] resize-none disabled:bg-[#f6f8fa] disabled:cursor-not-allowed"
              />
              <div
                className="absolute bottom-2 left-2 right-2 flex justify-start"
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) setModelMenuOpen(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setModelMenuOpen(false);
                    event.currentTarget.querySelector<HTMLButtonElement>("button")?.focus();
                  }
                }}
              >
                <button
                  type="button"
                  aria-label={t("Select model", "选择模型")}
                  aria-expanded={modelMenuOpen && !chatSending && !isFileOperationBusy}
                  aria-controls="chat-model-menu"
                  disabled={chatSending || isFileOperationBusy || !models.length}
                  onClick={() => setModelMenuOpen((open) => !open)}
                  className="flex items-center gap-2 max-w-full rounded border border-[#d0d7de] bg-white px-2 py-1 text-xs text-[#656d76] outline-none focus:border-[#0969da] disabled:opacity-40"
                >
                  <span className="truncate">{openAI.model || t("Add a model in LLM settings", "请在 LLM 设置中添加模型")}</span>
                  <ChevronRight size={12} className={`shrink-0 transition-transform ${modelMenuOpen ? "-rotate-90" : ""}`} />
                </button>
                {modelMenuOpen && !chatSending && !isFileOperationBusy && (
                  <div id="chat-model-menu" aria-label="模型列表" className="absolute bottom-full left-0 z-20 mb-1 max-h-48 w-full overflow-y-auto rounded border border-[#d0d7de] bg-white p-1 shadow-lg">
                    {models.map((profile) => (
                      <button
                        key={profile.model}
                        type="button"
                        aria-pressed={profile.model === openAI.model}
                        onClick={(event) => {
                          setOpenAI(profile);
                          setModelMenuOpen(false);
                          event.currentTarget.parentElement?.parentElement?.querySelector<HTMLButtonElement>("button")?.focus();
                        }}
                        className={`block w-full rounded px-2 py-1.5 text-left text-xs break-all hover:bg-[#ddf4ff] focus:bg-[#ddf4ff] outline-none ${profile.model === openAI.model ? "bg-[#ddf4ff] text-[#0969da]" : "text-[#656d76]"}`}
                      >{profile.model}</button>
                    ))}
                  </div>
                )}
              </div>
              </div>
              <button
                onClick={sendChat}
                disabled={chatSending || isFileOperationBusy || isScanning || !chatInput.trim()}
                className="w-full px-2 py-1.5 text-xs rounded bg-[#0969da] text-white hover:bg-[#0860c4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                  {activeCommand ? `${activeCommand.name}…` : chatSending ? t("Sending…", "发送中…") : t("Send", "发送")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

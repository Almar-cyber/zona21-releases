import {
  Folder,
  FolderOpen,
  FolderPlus,
  File,
  Image,
  Video,
  Search,
  Filter,
  Settings,
  X,
  Check,
  CheckCircle,
  Plus,
  Minus,
  Trash2,
  Copy,
  Move,
  Download,
  Upload,
  Share,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Menu,
  MoreHorizontal,
  MoreVertical,
  Calendar,
  Clock,
  Star,
  Heart,
  Flag,
  Tag,
  Bookmark,
  Archive,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Lightbulb,
  Info,
  AlertCircle,
  AlertTriangle,
  HardDrive,
  Database,
  Layers,
  Grid3X3,
  List,
  LayoutGrid,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ExternalLink,
  Link,
  Unlink,
  Scissors,
  Clipboard,
  ClipboardCheck,
  FileText,
  FileImage,
  FileVideo,
  FilePlus,
  FolderInput,
  FolderOutput,
  Home,
  User,
  Users,
  Lock,
  Unlock,
  Key,
  Shield,
  Zap,
  Activity,
  TrendingUp,
  BarChart2,
  PieChart,
  ArrowUp,
  ArrowLeft,
  RefreshCcw,
  GraduationCap,
  Sparkles,
  Crop,
  ZoomIn,
  ZoomOut,
  Sliders,
  ArrowLeftRight,
  FlipHorizontal2,
  Flame,
  Rocket,
  PartyPopper,
  Package,
  Target,
  Trophy,
  Crown,
  Palette,
  Camera,
  MousePointer2,
  Hand,
  type LucideIcon,
} from 'lucide-react';

export type IconName =
  | 'folder' | 'folder_open' | 'folder_plus' | 'create_new_folder'
  | 'file' | 'image' | 'video' | 'videocam'
  | 'search' | 'filter' | 'filter_list' | 'settings'
  | 'close' | 'check' | 'check_circle'
  | 'add' | 'remove' | 'delete' | 'trash'
  | 'content_copy' | 'drive_file_move' | 'move'
  | 'download' | 'upload' | 'ios_share' | 'share'
  | 'visibility' | 'visibility_off'
  | 'chevron_left' | 'chevron_right' | 'expand_less' | 'expand_more'
  | 'menu' | 'more_horiz' | 'more_vert'
  | 'calendar_month' | 'schedule' | 'access_time'
  | 'star' | 'favorite' | 'flag' | 'label' | 'bookmark' | 'archive'
  | 'refresh' | 'undo' | 'lightbulb' | 'info' | 'error' | 'warning'
  | 'storage' | 'database' | 'layers' | 'grid_view' | 'view_list'
  | 'play_arrow' | 'pause' | 'stop' | 'volume_up' | 'volume_off'
  | 'fullscreen' | 'fullscreen_exit' | 'open_in_new' | 'link' | 'link_off'
  | 'content_cut' | 'content_paste' | 'assignment_turned_in'
  | 'description' | 'photo' | 'movie' | 'note_add'
  | 'folder_special' | 'drive_folder_upload'
  | 'home' | 'person' | 'group' | 'lock' | 'lock_open' | 'key' | 'security'
  | 'bolt' | 'trending_up' | 'bar_chart' | 'pie_chart'
  | 'playlist_remove' | 'select_all'
  | 'arrow_upward' | 'arrow_back' | 'system_update' | 'downloading'
  | 'delete_forever' | 'school' | 'zoom_in' | 'zoom_out'
  | 'face' | 'image_search' | 'auto_awesome'
  | 'crop' | 'rotate_right' | 'rotate_left' | 'tune' | 'swap_horiz' | 'flip'
  | 'flame' | 'rocket' | 'party' | 'package' | 'target' | 'trophy' | 'crown' | 'palette' | 'camera' | 'mouse_pointer' | 'hand';

const iconMap: Record<IconName, LucideIcon> = {
  folder: Folder,
  folder_open: FolderOpen,
  folder_plus: FolderPlus,
  create_new_folder: FolderPlus,
  file: File,
  image: Image,
  photo: Image,
  video: Video,
  videocam: Video,
  movie: Video,
  search: Search,
  filter: Filter,
  filter_list: Filter,
  settings: Settings,
  close: X,
  check: Check,
  check_circle: CheckCircle,
  add: Plus,
  remove: Minus,
  delete: Trash2,
  trash: Trash2,
  content_copy: Copy,
  drive_file_move: Move,
  move: Move,
  download: Download,
  upload: Upload,
  ios_share: Share,
  share: Share,
  visibility: Eye,
  visibility_off: EyeOff,
  chevron_left: ChevronLeft,
  chevron_right: ChevronRight,
  expand_less: ChevronUp,
  expand_more: ChevronDown,
  menu: Menu,
  more_horiz: MoreHorizontal,
  more_vert: MoreVertical,
  calendar_month: Calendar,
  schedule: Clock,
  access_time: Clock,
  star: Star,
  favorite: Heart,
  flag: Flag,
  label: Tag,
  bookmark: Bookmark,
  archive: Archive,
  refresh: RefreshCw,
  undo: RotateCcw,
  lightbulb: Lightbulb,
  info: Info,
  error: AlertCircle,
  warning: AlertTriangle,
  storage: HardDrive,
  database: Database,
  layers: Layers,
  grid_view: Grid3X3,
  view_list: List,
  play_arrow: Play,
  pause: Pause,
  stop: Square,
  volume_up: Volume2,
  volume_off: VolumeX,
  fullscreen: Maximize,
  fullscreen_exit: Minimize,
  open_in_new: ExternalLink,
  link: Link,
  link_off: Unlink,
  content_cut: Scissors,
  content_paste: Clipboard,
  assignment_turned_in: ClipboardCheck,
  description: FileText,
  note_add: FilePlus,
  folder_special: FolderInput,
  drive_folder_upload: FolderOutput,
  home: Home,
  person: User,
  group: Users,
  lock: Lock,
  lock_open: Unlock,
  key: Key,
  security: Shield,
  bolt: Zap,
  trending_up: TrendingUp,
  bar_chart: BarChart2,
  pie_chart: PieChart,
  playlist_remove: Trash2,
  select_all: LayoutGrid,
  arrow_upward: ArrowUp,
  arrow_back: ArrowLeft,
  system_update: RefreshCcw,
  downloading: RefreshCcw,
  delete_forever: Trash2,
  school: GraduationCap,
  zoom_in: ZoomIn,
  zoom_out: ZoomOut,
  face: User,
  image_search: Image,
  auto_awesome: Sparkles,
  crop: Crop,
  rotate_right: RotateCw,
  rotate_left: RotateCcw,
  tune: Sliders,
  swap_horiz: ArrowLeftRight,
  flip: FlipHorizontal2,
  flame: Flame,
  rocket: Rocket,
  party: PartyPopper,
  package: Package,
  target: Target,
  trophy: Trophy,
  crown: Crown,
  palette: Palette,
  camera: Camera,
  mouse_pointer: MousePointer2,
  hand: Hand,
};

interface IconProps {
  name: IconName | string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export default function Icon({ name, size = 20, className = '', strokeWidth = 2 }: IconProps) {
  const LucideIcon = iconMap[name as IconName];
  
  if (!LucideIcon) {
    // Icon não encontrado - silenciar em produção
    return null;
  }
  
  return (
    <LucideIcon 
      size={size} 
      className={className}
      strokeWidth={strokeWidth}
    />
  );
}

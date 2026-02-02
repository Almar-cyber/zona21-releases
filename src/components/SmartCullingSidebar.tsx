import { Asset } from '../shared/types';

interface SmartCullingSidebarProps {
  asset: Asset;
  isVisible: boolean;
  onToggle: () => void;
  onApprove?: (assetId: string) => void;
  onReject?: (assetId: string) => void;
}

const SmartCullingSidebar = (_props: SmartCullingSidebarProps) => null;

export default SmartCullingSidebar;

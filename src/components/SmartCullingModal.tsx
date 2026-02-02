interface SmartCullingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAssets: (assetIds: string[]) => void;
  onApproveAssets: (assetIds: string[]) => void;
  onRejectAssets: (assetIds: string[]) => void;
  onOpenCompare?: (assetIds: string[]) => void;
}

const SmartCullingModal = (_props: SmartCullingModalProps) => null;

export default SmartCullingModal;

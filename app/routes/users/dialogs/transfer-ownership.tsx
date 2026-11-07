import Dialog, { DialogPanel } from "~/components/dialog";
import Notice from "~/components/notice";
import Text from "~/components/text";
import Title from "~/components/title";

interface TransferOwnershipProps {
  targetHeadplaneUserId: string;
  targetDisplayName: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function TransferOwnership({
  targetHeadplaneUserId,
  targetDisplayName,
  isOpen,
  setIsOpen,
}: TransferOwnershipProps) {
  return (
    <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
      <DialogPanel variant="destructive">
        <Title>將擁有權移轉給 {targetDisplayName}？</Title>
        <Text className="mb-6">
          此操作會將 {targetDisplayName} 設為此 Headplane
          的新擁有者，你的角色會降為管理員。此操作不易復原。
        </Text>
        <Notice variant="warning">只有擁有者可以移轉擁有權。移轉後，你將無法再管理擁有權。</Notice>
        <input name="action_id" type="hidden" value="transfer_ownership" />
        <input name="headplane_user_id" type="hidden" value={targetHeadplaneUserId} />
      </DialogPanel>
    </Dialog>
  );
}

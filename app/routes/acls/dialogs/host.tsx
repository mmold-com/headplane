import { useEffect, useState } from "react";

import Dialog, { DialogPanel } from "~/components/dialog";
import Input from "~/components/input";
import Text from "~/components/text";
import Title from "~/components/title";
import { isValidHostName } from "~/utils/acl-policy";

interface HostDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  name?: string;
  value?: string;
  existingNames: string[];
  onSave: (name: string, value: string) => void;
}

export default function HostDialog({
  isOpen,
  setIsOpen,
  name,
  value,
  existingNames,
  onSave,
}: HostDialogProps) {
  const [draftName, setDraftName] = useState(name ?? "");
  const [draftValue, setDraftValue] = useState(value ?? "");

  useEffect(() => {
    if (isOpen) {
      setDraftName(name ?? "");
      setDraftValue(value ?? "");
    }
  }, [isOpen, name, value]);

  const isDuplicate = draftName !== name && existingNames.includes(draftName);
  const nameIsInvalid = !isValidHostName(draftName) || isDuplicate;
  const valueIsInvalid = draftValue.trim().length === 0;

  return (
    <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
      <DialogPanel
        isDisabled={nameIsInvalid || valueIsInvalid}
        onSubmit={(event) => {
          event.preventDefault();
          onSave(draftName, draftValue.trim());
          setIsOpen(false);
        }}
      >
        <Title>{name ? `編輯主機 ${name}` : "新增主機"}</Title>
        <Text>為 IP 位址或 CIDR 網段設定主機別名，供規則引用。</Text>
        <Input
          errorMessage={
            isDuplicate
              ? "A host with this name 的紀錄已存在。"
              : "主機名稱只能包含小寫英文字母、數字與連字號。"
          }
          invalid={nameIsInvalid}
          label="名稱"
          onChange={setDraftName}
          placeholder="office"
          value={draftName}
        />
        <Input
          invalid={draftValue.length > 0 && valueIsInvalid}
          label="位址"
          onChange={setDraftValue}
          placeholder="100.64.0.0/24"
          value={draftValue}
        />
      </DialogPanel>
    </Dialog>
  );
}

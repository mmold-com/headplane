import { useEffect, useState } from "react";

import Dialog, { DialogPanel } from "~/components/dialog";
import Input from "~/components/input";
import Text from "~/components/text";
import Title from "~/components/title";
import TokenList from "~/components/token-list";
import { isValidGroupName, isValidTagName } from "~/utils/acl-policy";

export type NamedListKind = "group" | "tag";

interface NamedListDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  kind: NamedListKind;
  // Present when editing, absent when creating a new entry.
  name?: string;
  members?: string[];
  existingNames: string[];
  suggestions: string[];
  onSave: (name: string, members: string[]) => void;
}

const COPY = {
  group: {
    title: "群組",
    prefix: "group:",
    field: "成員",
    fieldDescription: "此群組包含的 Headscale 使用者。",
    empty: "尚無成員",
    placeholder: "alice@",
    validate: isValidGroupName,
    hint: "群組名稱必須以 group: 開頭，且只能包含小寫英文字母、數字與連字號。",
  },
  tag: {
    title: "標籤",
    prefix: "tag:",
    field: "標籤擁有者",
    fieldDescription: "可將此標籤指派給節點的使用者與群組。",
    empty: "尚無擁有者",
    placeholder: "group:ops",
    validate: isValidTagName,
    hint: "標籤名稱必須以 tag: 開頭，且只能包含小寫英文字母、數字與連字號。",
  },
} as const;

export default function NamedListDialog({
  isOpen,
  setIsOpen,
  kind,
  name,
  members,
  existingNames,
  suggestions,
  onSave,
}: NamedListDialogProps) {
  const copy = COPY[kind];
  const [draftName, setDraftName] = useState(name ?? copy.prefix);
  const [draftMembers, setDraftMembers] = useState<string[]>(members ?? []);

  useEffect(() => {
    if (isOpen) {
      setDraftName(name ?? copy.prefix);
      setDraftMembers(members ? [...members] : []);
    }
  }, [isOpen, name, members, copy.prefix]);

  const trimmedName = draftName.trim();
  const isDuplicate = trimmedName !== name && existingNames.includes(trimmedName);
  const nameIsInvalid = !copy.validate(trimmedName) || isDuplicate;
  // The field opens pre-filled with the `group:`/`tag:` prefix, which is not a
  // valid name yet. Saving stays blocked, but nothing is flagged until it is edited.
  const isPristine = trimmedName.length === 0 || trimmedName === copy.prefix;
  const showNameError = !isPristine && nameIsInvalid;

  return (
    <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
      <DialogPanel
        isDisabled={nameIsInvalid}
        onSubmit={(event) => {
          event.preventDefault();
          onSave(trimmedName, draftMembers);
          setIsOpen(false);
        }}
      >
        <Title>{name ? `編輯${copy.title} ${name}` : `新增${copy.title}`}</Title>
        <Text>{copy.hint}</Text>
        <Input
          errorMessage={isDuplicate ? `A ${copy.title} with this name 的紀錄已存在。` : copy.hint}
          invalid={showNameError}
          label="名稱"
          onChange={setDraftName}
          placeholder={`${copy.prefix}example`}
          value={draftName}
        />
        <TokenList
          description={copy.fieldDescription}
          emptyText={copy.empty}
          label={copy.field}
          onChange={setDraftMembers}
          placeholder={copy.placeholder}
          suggestions={suggestions}
          values={draftMembers}
        />
      </DialogPanel>
    </Dialog>
  );
}

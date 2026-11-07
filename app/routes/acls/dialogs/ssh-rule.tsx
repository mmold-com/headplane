import { useEffect, useState } from "react";

import Dialog, { DialogPanel } from "~/components/dialog";
import Input from "~/components/input";
import Link from "~/components/link";
import Select from "~/components/select";
import Text from "~/components/text";
import Title from "~/components/title";
import TokenList from "~/components/token-list";
import { KNOWN_SSH_ACTIONS, type SshRule } from "~/utils/acl-policy";

interface SshRuleDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  rule?: SshRule;
  sources: string[];
  destinations: string[];
  onSave: (rule: SshRule) => void;
}

const EMPTY: SshRule = { action: "accept", src: [], dst: [], users: [], extra: {} };
const SSH_USERS = ["root", "autogroup:nonroot"];

export default function SshRuleDialog({
  isOpen,
  setIsOpen,
  rule,
  sources,
  destinations,
  onSave,
}: SshRuleDialogProps) {
  const [draft, setDraft] = useState<SshRule>(rule ?? EMPTY);

  useEffect(() => {
    if (isOpen) {
      setDraft(rule ? structuredClone(rule) : structuredClone(EMPTY));
    }
  }, [isOpen, rule]);

  const isInvalid = draft.src.length === 0 || draft.dst.length === 0 || draft.users.length === 0;

  return (
    <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
      <DialogPanel
        isDisabled={isInvalid}
        onSubmit={(event) => {
          event.preventDefault();
          onSave(draft);
          setIsOpen(false);
        }}
      >
        <Title>{rule ? "編輯 SSH 規則" : "新增 SSH 規則"}</Title>
        <Text>
          SSH 規則控制節點之間的 Tailscale SSH 存取。請參閱{" "}
          <Link external styled to="https://tailscale.com/kb/1193/tailscale-ssh">
            Tailscale SSH 文件
          </Link>{" "}
          以了解定期重新驗證模式。
        </Text>
        <Select
          items={[
            { value: "accept", label: "允許：立即建立工作階段" },
            { value: "check", label: "驗證：要求定期重新驗證" },
            // An action we do not know is listed as-is so it survives an edit.
            ...(KNOWN_SSH_ACTIONS.includes(draft.action)
              ? []
              : [{ value: draft.action, label: `${draft.action}：Headplane 無法辨識的操作` }]),
          ]}
          label="操作"
          onValueChange={(value) => setDraft({ ...draft, action: value ?? draft.action })}
          value={draft.action}
        />
        <TokenList
          description="允許建立 SSH 工作階段的對象。"
          emptyText="尚無來源"
          label="來源"
          onChange={(src) => setDraft({ ...draft, src })}
          placeholder="group:ops"
          suggestions={sources}
          values={draft.src}
        />
        <TokenList
          description="允許接受 SSH 連線的節點。"
          emptyText="尚無目的地"
          label="目的地"
          onChange={(dst) => setDraft({ ...draft, dst })}
          placeholder="tag:server"
          suggestions={destinations}
          values={draft.dst}
        />
        <TokenList
          description="允許登入的本機 Unix 使用者。"
          emptyText="尚無 SSH 使用者"
          label="SSH 使用者"
          onChange={(users) => setDraft({ ...draft, users })}
          placeholder="autogroup:nonroot"
          suggestions={SSH_USERS}
          values={draft.users}
        />
        {draft.action === "check" ? (
          <Input
            description="定期重新驗證模式的工作階段有效時間，例如 12h。"
            label="重新驗證週期"
            onChange={(checkPeriod) =>
              setDraft({ ...draft, checkPeriod: checkPeriod.length > 0 ? checkPeriod : undefined })
            }
            placeholder="12h"
            value={draft.checkPeriod ?? ""}
          />
        ) : null}
      </DialogPanel>
    </Dialog>
  );
}

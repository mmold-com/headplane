import { useEffect, useState } from "react";

import Dialog, { DialogPanel } from "~/components/dialog";
import Input from "~/components/input";
import Link from "~/components/link";
import Text from "~/components/text";
import Title from "~/components/title";
import TokenList from "~/components/token-list";
import { withDefaultPort, type AclRule } from "~/utils/acl-policy";

interface AclRuleDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  rule?: AclRule;
  sources: string[];
  destinations: string[];
  onSave: (rule: AclRule) => void;
}

const EMPTY: AclRule = { action: "accept", src: [], dst: [], extra: {} };

export default function AclRuleDialog({
  isOpen,
  setIsOpen,
  rule,
  sources,
  destinations,
  onSave,
}: AclRuleDialogProps) {
  const [draft, setDraft] = useState<AclRule>(rule ?? EMPTY);

  useEffect(() => {
    if (isOpen) {
      setDraft(rule ? structuredClone(rule) : structuredClone(EMPTY));
    }
  }, [isOpen, rule]);

  const isInvalid = draft.src.length === 0 || draft.dst.length === 0;

  return (
    <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
      <DialogPanel
        isDisabled={isInvalid}
        onSubmit={(event) => {
          event.preventDefault();
          // A hand-written policy may be missing the port spec Headscale wants.
          onSave({ ...draft, dst: draft.dst.map(withDefaultPort) });
          setIsOpen(false);
        }}
      >
        <Title>{rule ? "編輯存取規則" : "新增存取規則"}</Title>
        <Text>
          存取規則允許流量從指定來源前往指定目的地。目的地必須包含連接埠，例如{" "}
          <code className="font-mono">tag:web:80,443</code>。若未指定連接埠，系統會自動補上{" "}
          <code className="font-mono">:*</code> 。完整語法請參閱{" "}
          <Link external styled to="https://tailscale.com/kb/1018/acls">
            Tailscale ACL 指南
          </Link>{" "}
          。
        </Text>
        <TokenList
          description="允許發起連線的群組、標籤、主機、使用者或自動群組。"
          emptyText="尚無來源"
          label="來源"
          onChange={(src) => setDraft({ ...draft, src })}
          placeholder="group:eng"
          suggestions={sources}
          values={draft.src}
        />
        <TokenList
          description="允許流量前往的目的地。未指定連接埠時，會補上 :*（所有連接埠）。"
          emptyText="尚無目的地"
          label="目的地"
          normalize={withDefaultPort}
          onChange={(dst) => setDraft({ ...draft, dst })}
          placeholder="tag:web:80,443"
          suggestions={destinations}
          values={draft.dst}
        />
        <Input
          description="選填。將規則限制為單一通訊協定，例如 tcp、udp 或 icmp。"
          label="通訊協定"
          onChange={(proto) => setDraft({ ...draft, proto: proto.length > 0 ? proto : undefined })}
          placeholder="tcp"
          value={draft.proto ?? ""}
        />
      </DialogPanel>
    </Dialog>
  );
}

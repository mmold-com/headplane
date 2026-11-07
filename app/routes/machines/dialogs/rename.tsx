import { type } from "arktype";

import Code from "~/components/code";
import Dialog, { DialogPanel } from "~/components/dialog";
import Input from "~/components/input";
import Text from "~/components/text";
import Title from "~/components/title";
import { useForm } from "~/hooks/use-form";
import type { Machine } from "~/types";

const renameSchema = type({
  name: "string > 0",
});

const dnsLabelPattern = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

function validateMachineName(values: Record<string, unknown>) {
  const name = String(values.name ?? "").toLowerCase();
  if (!dnsLabelPattern.test(name)) {
    return {
      name: "請使用有效的 DNS 名稱，只能包含小寫英文字母、數字與連字號，開頭與結尾必須為字母或數字。",
    };
  }
}

interface RenameProps {
  machine: Machine;
  isOpen: boolean;
  magic?: string;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Rename({ machine, magic, isOpen, setIsOpen }: RenameProps) {
  const form = useForm({
    schema: renameSchema,
    defaultValues: { name: machine.givenName },
    validate: validateMachineName,
  });
  const name = form.values.name as string;

  return (
    <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
      <DialogPanel isDisabled={!form.canSubmit}>
        <Title>編輯 {machine.givenName} 的裝置名稱</Title>
        <Text className="mb-6">
          此名稱會顯示於管理介面與 Tailscale 用戶端，並用於產生 Magic DNS 名稱。
        </Text>
        <input name="action_id" type="hidden" value="rename" />
        <input name="node_id" type="hidden" value={machine.id} />
        <Input {...form.field("name")} required label="裝置名稱" placeholder="裝置名稱" />
        {magic ? (
          name.length > 0 && name !== machine.givenName ? (
            <p className="mt-2 text-sm leading-tight text-mist-600 dark:text-mist-300">
              此裝置將可透過下列主機名稱存取：{" "}
              <Code className="text-sm">{name.toLowerCase().replaceAll(/\s+/g, "-")}</Code>
              {". "}
              原主機名稱 <Code className="text-sm">{machine.givenName}</Code> 將不再指向此裝置。
            </p>
          ) : (
            <p className="mt-2 text-sm leading-tight text-mist-600 dark:text-mist-300">
              此裝置可透過下列主機名稱存取： <Code className="text-sm">{machine.givenName}</Code>.
            </p>
          )
        ) : undefined}
      </DialogPanel>
    </Dialog>
  );
}

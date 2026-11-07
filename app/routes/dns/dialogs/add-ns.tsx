import { type } from "arktype";
import { Split } from "lucide-react";

import Button from "~/components/button";
import Chip from "~/components/chip";
import Dialog, { DialogPanel } from "~/components/dialog";
import Input from "~/components/input";
import Switch from "~/components/switch";
import Text from "~/components/text";
import Title from "~/components/title";
import Tooltip from "~/components/tooltip";
import { useForm } from "~/hooks/use-form";
import cn from "~/utils/cn";

const nsSchema = type({
  ns: "string.ip",
  split_name: "string > 0",
});

interface Props {
  nameservers: Record<string, string[]>;
}

export default function AddNameserver({ nameservers }: Props) {
  const form = useForm({
    schema: nsSchema,
    defaultValues: { split_name: "global" },
    validate: (values) => {
      const ns = values.ns as string;
      const domain = values.split_name as string;
      if (!ns) return undefined;

      const isSplit = domain !== "global";
      const isDuplicate = isSplit
        ? nameservers[domain]?.includes(ns)
        : Object.values(nameservers).some((nsList) => nsList.includes(ns));

      if (isDuplicate) {
        return { ns: "This nameserver already exists." };
      }

      return undefined;
    },
  });
  const split = (form.values.split_name as string) !== "global";

  return (
    <Dialog onOpenChange={(isOpen) => !isOpen && form.reset()}>
      <Button>新增名稱伺服器</Button>
      <DialogPanel>
        <Title className="mb-4">新增名稱伺服器</Title>
        <input name="action_id" type="hidden" value="add_ns" />
        <Input
          {...form.field("ns")}
          description="Use this IPv4 or IPv6 address to resolve names."
          required
          label="名稱伺服器"
          placeholder="1.2.3.4"
        />
        <div className="mt-8 flex items-center justify-between">
          <div className="block">
            <div className="inline-flex items-center gap-2">
              <Text className="font-semibold">限定網域</Text>
              <Tooltip content="Only clients that support split DNS (Tailscale v1.8 or later for most platforms) will use this nameserver. Older clients will ignore it.">
                <Chip
                  className={cn("inline-flex items-center")}
                  leftIcon={<Split className="mr-0.5 h-3 w-3" />}
                  text="Split DNS"
                />
              </Tooltip>
            </div>
            <Text className="text-sm">此名稱伺服器只用於指定網域。</Text>
          </div>
          <Switch
            label="分割 DNS"
            checked={split}
            onCheckedChange={(checked) => {
              form.setValue("split_name", checked ? "" : "global");
            }}
          />
        </div>
        {split ? (
          <>
            <Text className="mt-8 font-semibold">網域</Text>
            <Input {...form.field("split_name")} required label="網域" placeholder="example.com" />
            <Text className="text-sm">
              Only single-label or fully-qualified queries matching this suffix should use the
              nameserver.
            </Text>
          </>
        ) : (
          <input name="split_name" type="hidden" value="global" />
        )}
      </DialogPanel>
    </Dialog>
  );
}

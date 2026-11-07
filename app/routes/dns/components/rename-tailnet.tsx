import Button from "~/components/button";
import Code from "~/components/code";
import Dialog, { DialogPanel } from "~/components/dialog";
import Input from "~/components/input";
import Text from "~/components/text";
import Title from "~/components/title";

interface Props {
  name: string;
  isDisabled: boolean;
}

export default function RenameTailnet({ name, isDisabled }: Props) {
  return (
    <div className="flex w-full flex-col gap-y-4 sm:w-2/3">
      <h1 className="mb-2 text-2xl font-medium">Tailnet 名稱</h1>
      <p>
        這是 Tailnet 的基礎網域名稱。啟用 Magic DNS 後，可透過下列網址存取裝置：{" "}
        <Code>[device].{name}</Code> （需啟用 Magic DNS）。
      </p>
      <Input
        className="w-3/5 text-sm font-medium"
        readOnly
        label="Tailnet 名稱"
        labelHidden
        onFocus={(event) => {
          (event.target as HTMLInputElement).select();
        }}
        value={name}
      />
      <Dialog>
        <Button disabled={isDisabled}>重新命名 Tailnet</Button>
        <DialogPanel isDisabled={isDisabled}>
          <Title>重新命名 Tailnet</Title>
          <Text className="mb-8">
            變更網域名稱可能影響 Tailnet 中既有裝置的名稱解析與連線，請先確認相關設定。
          </Text>
          <input name="action_id" type="hidden" value="rename_tailnet" />
          <Input
            defaultValue={name}
            required
            label="Tailnet 名稱"
            name="new_name"
            placeholder="ts.net"
          />
        </DialogPanel>
      </Dialog>
    </div>
  );
}

import Button from "~/components/button";
import Dialog, { DialogPanel } from "~/components/dialog";
import Text from "~/components/text";
import Title from "~/components/title";

interface Props {
  isEnabled: boolean;
  isDisabled: boolean;
}

export default function Modal({ isEnabled, isDisabled }: Props) {
  return (
    <Dialog>
      <Button disabled={isDisabled}>{isEnabled ? "停用" : "啟用"} Magic DNS</Button>
      <DialogPanel isDisabled={isDisabled}>
        <Title>{isEnabled ? "停用" : "啟用"} Magic DNS</Title>
        <Text>停用後，將無法透過 Tailnet 網域名稱存取裝置，搜尋網域也會一併停用。</Text>
        <input type="hidden" name="action_id" value="toggle_magic" />
        <input type="hidden" name="new_state" value={isEnabled ? "disabled" : "enabled"} />
      </DialogPanel>
    </Dialog>
  );
}

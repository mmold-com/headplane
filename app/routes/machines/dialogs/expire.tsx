import Dialog, { DialogPanel } from "~/components/dialog";
import Text from "~/components/text";
import Title from "~/components/title";
import type { Machine } from "~/types";

interface ExpireProps {
  machine: Machine;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Expire({ machine, isOpen, setIsOpen }: ExpireProps) {
  return (
    <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
      <DialogPanel variant="destructive">
        <Title>使 {machine.givenName} 到期</Title>
        <Text>此操作會使裝置到期並中斷 Tailnet 連線。若要重新連線，必須在裝置上重新驗證。</Text>
        <input name="action_id" type="hidden" value="expire" />
        <input name="node_id" type="hidden" value={machine.id} />
      </DialogPanel>
    </Dialog>
  );
}

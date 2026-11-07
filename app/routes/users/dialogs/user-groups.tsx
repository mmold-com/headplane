import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";

import Dialog, { DialogPanel } from "~/components/dialog";
import Link from "~/components/link";
import Text from "~/components/text";
import Title from "~/components/title";
import TokenList from "~/components/token-list";
import { isValidGroupName } from "~/utils/acl-policy";

interface UserGroupsProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  // The Headscale username, which is what the ACL policy references.
  userName: string;
  displayName: string;
  groups: string[];
  availableGroups: string[];
  // Whether the stored policy contains HuJSON comments, which saving drops.
  policyHasComments?: boolean;
}

export default function UserGroups({
  isOpen,
  setIsOpen,
  userName,
  displayName,
  groups,
  availableGroups,
  policyHasComments,
}: UserGroupsProps) {
  const fetcher = useFetcher<{ message?: string; error?: string }>();
  const submittingRef = useRef(false);
  const [selected, setSelected] = useState([...groups]);

  const error = fetcher.data?.error;
  const isSubmitting = fetcher.state !== "idle";

  useEffect(() => {
    if (isOpen) {
      setSelected([...groups]);
    }
  }, [isOpen, groups]);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      submittingRef.current = false;
      if (!fetcher.data.error) {
        setIsOpen(false);
      }
    }
  }, [fetcher.data, fetcher.state]);

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && submittingRef.current) {
          return;
        }
        setIsOpen(open);
      }}
    >
      <DialogPanel
        isDisabled={isSubmitting}
        onSubmit={(event) => {
          event.preventDefault();
          submittingRef.current = true;
          const form = new FormData();
          form.set("action_id", "update_user_groups");
          form.set("user_name", userName);
          form.set("groups", selected.join(","));
          fetcher.submit(form, { method: "POST" });
        }}
      >
        <Title>編輯 {displayName} 的 ACL 群組</Title>
        <Text>
          群組儲存於 ACL 原則中，而非 Headscale 使用者資料。此處變更會重寫原則的{" "}
          <code className="font-mono">groups</code> 區段，詳見{" "}
          <Link external styled to="https://tailscale.com/kb/1018/acls">
            Tailscale ACL 指南
          </Link>{" "}
          以了解詳細內容。
        </Text>
        {policyHasComments ? (
          <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
            目前原則含有註解。從此處儲存會重寫原則並移除註解。
          </p>
        ) : null}
        {error ? (
          <p className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </p>
        ) : null}
        <TokenList
          emptyText="此使用者尚未加入任何群組"
          isDisabled={isSubmitting}
          label="群組"
          onChange={setSelected}
          placeholder="group:example"
          suggestions={availableGroups}
          validate={isValidGroupName}
          values={selected}
        />
      </DialogPanel>
    </Dialog>
  );
}

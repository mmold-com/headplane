import Dialog, { DialogPanel } from "~/components/dialog";
import Link from "~/components/link";
import Notice from "~/components/notice";
import RadioGroup from "~/components/radio-group";
import Text from "~/components/text";
import Title from "~/components/title";
import { Roles } from "~/server/web/roles";
import type { Role } from "~/server/web/roles";

interface ReassignProps {
  headplaneUserId: string;
  displayName: string;
  role: Role;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function ReassignUser({
  headplaneUserId,
  displayName,
  role,
  isOpen,
  setIsOpen,
}: ReassignProps) {
  return (
    <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
      <DialogPanel variant={role === "owner" ? "unactionable" : "normal"}>
        <Title>變更 {displayName} 的角色？</Title>
        <Text className="mb-6">
          角色決定使用者在 Headplane 中的存取範圍，每個角色有不同的操作權限。{" "}
          <Link external styled to="https://tailscale.com/kb/1138/user-roles">
            了解更多
          </Link>
        </Text>
        {role === "owner" ? (
          <Notice>無法重新指派 Tailnet 擁有者。</Notice>
        ) : (
          <>
            <input name="action_id" type="hidden" value="reassign_user" />
            <input name="headplane_user_id" type="hidden" value={headplaneUserId} />
            <RadioGroup className="gap-4" defaultValue={role} label="角色" name="new_role">
              {Object.keys(Roles)
                .filter((r) => r !== "owner")
                .map((r) => {
                  const { name, desc } = mapRoleToName(r);
                  return (
                    <RadioGroup.Radio key={r} label={name} value={r}>
                      <div className="block">
                        <p className="font-bold">{name}</p>
                        <p className="opacity-70">{desc}</p>
                      </div>
                    </RadioGroup.Radio>
                  );
                })}
            </RadioGroup>
          </>
        )}
      </DialogPanel>
    </Dialog>
  );
}

function mapRoleToName(role: string) {
  switch (role) {
    case "admin":
      return {
        name: "管理員",
        desc: "可檢視管理介面，並管理網路、裝置與使用者設定。",
      };
    case "network_admin":
      return {
        name: "網路管理員",
        desc: "可檢視管理介面並管理 ACL 與網路設定，無法管理裝置或使用者。",
      };
    case "it_admin":
      return {
        name: "資訊管理員",
        desc: "可檢視管理介面並管理裝置與使用者，無法管理 ACL 或網路設定。",
      };
    case "auditor":
      return {
        name: "稽核員",
        desc: "可檢視管理介面。",
      };
    case "viewer":
      return {
        name: "檢視者",
        desc: "可檢視裝置、使用者，並產生自己的驗證金鑰。",
      };
    case "member":
      return {
        name: "成員",
        desc: "無法檢視管理介面。",
      };
    default:
      return {
        name: role,
        desc: "尚無說明。",
      };
  }
}

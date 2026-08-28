import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth/session";
import { getVendorByOwner } from "@/server/repositories/vendors";
import { ProfileForm } from "./profile-form";

export default async function VendorProfilePage() {
  const user = await requireUser();
  const vendor = await getVendorByOwner(user.uid);
  if (!vendor) redirect("/fornecedor/cadastro");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Editar perfil</h1>
      <ProfileForm vendorId={vendor.id} vendor={vendor} />
    </div>
  );
}

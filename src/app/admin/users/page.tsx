import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getEmailForUserId } from "@/lib/email";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("user_profiles")
    .select("user_id, free_conversions_remaining, paid_credits, updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);

  const users = await Promise.all(
    (data ?? []).map(async (row) => ({
      ...row,
      email: await getEmailForUserId(row.user_id),
    })),
  );

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Customers / users</h1>
        <p className="text-sm text-muted-foreground">
          Support view of user profiles and credit balances.
        </p>
      </header>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="p-2">User ID</th>
              <th className="p-2">Email</th>
              <th className="p-2">Free credits</th>
              <th className="p-2">Paid credits</th>
              <th className="p-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {users.map((row) => (
              <tr key={row.user_id} className="border-t">
                <td className="p-2 font-mono text-xs">
                  <Link className="underline" href={`/admin/users/${row.user_id}`}>
                    {row.user_id}
                  </Link>
                </td>
                <td className="p-2">
                  <Link className="underline" href={`/admin/users/${row.user_id}`}>
                    {row.email ?? "-"}
                  </Link>
                </td>
                <td className="p-2">{row.free_conversions_remaining}</td>
                <td className="p-2">{row.paid_credits}</td>
                <td className="p-2">{new Date(row.updated_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DATA_TABLES, type DataTableName } from "./tableConfig";

export async function toggleRowArchive(table: DataTableName, id: string, restore: boolean) {
  const supabase = await createClient();
  const config = DATA_TABLES[table];

  const patch =
    config.archiveColumn === "is_active"
      ? { is_active: restore }
      : { archived_at: restore ? null : new Date().toISOString() };

  const { error } = await supabase.from(table).update(patch as never).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/data");
  return { error: null };
}

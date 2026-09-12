"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createBudget(projectId: string, approvedBudget: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("budgets").insert({ project_id: projectId, approved_budget: approvedBudget });
  if (error) return { error: error.message };
  revalidatePath(`/finance/${projectId}`);
  revalidatePath("/finance");
  return { error: null };
}

export async function createBudgetLine(formData: FormData) {
  const supabase = await createClient();
  const budgetId = String(formData.get("budget_id"));
  const projectId = String(formData.get("project_id"));

  const { error } = await supabase.from("budget_lines").insert({
    budget_id: budgetId,
    line_name: String(formData.get("line_name")),
    category: (formData.get("category") as string) || null,
    amount: Number(formData.get("amount")),
  });

  if (error) return { error: error.message };
  revalidatePath(`/finance/${projectId}`);
  return { error: null };
}

export async function recordExpenditure(formData: FormData) {
  const supabase = await createClient();
  const budgetLineId = String(formData.get("budget_line_id"));
  const projectId = String(formData.get("project_id"));

  const { error } = await supabase.from("expenditures").insert({
    budget_line_id: budgetLineId,
    amount: Number(formData.get("amount")),
    expense_date: String(formData.get("expense_date")),
    description: (formData.get("description") as string) || null,
  });

  if (error) return { error: error.message };
  revalidatePath(`/finance/${projectId}`);
  return { error: null };
}

export async function recordCommitment(formData: FormData) {
  const supabase = await createClient();
  const budgetLineId = String(formData.get("budget_line_id"));
  const projectId = String(formData.get("project_id"));

  const { error } = await supabase.from("commitments").insert({
    budget_line_id: budgetLineId,
    amount: Number(formData.get("amount")),
    commitment_date: String(formData.get("commitment_date")),
    description: (formData.get("description") as string) || null,
  });

  if (error) return { error: error.message };
  revalidatePath(`/finance/${projectId}`);
  return { error: null };
}

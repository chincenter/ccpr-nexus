"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return typeof v === "string" && v.length > 0 ? v : null;
}

function num(formData: FormData, key: string): number | null {
  const v = str(formData, key);
  return v == null ? null : Number(v);
}

function friendlyError(error: { code?: string; message: string }): string {
  if (error.code === "23505") return "A budget already exists for this project.";
  if (error.code === "23514") return "Amounts cannot be negative.";
  if (error.code === "42501") return "You do not have permission to make this change.";
  return error.message;
}

function revalidateFinance(projectId: string) {
  revalidatePath(`/finance/${projectId}`);
  revalidatePath("/finance");
  revalidatePath(`/projects/${projectId}`);
}

/** Confirms a budget line's budget really belongs to the claimed project — refuses a
 * Project A expenditure/commitment silently landing against Project B's budget line. */
async function budgetLineBelongsToProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  budgetLineId: string,
  projectId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("budget_lines")
    .select("budget:budgets(project_id)")
    .eq("id", budgetLineId)
    .maybeSingle();
  const budget = data?.budget as { project_id: string } | null;
  return budget?.project_id === projectId;
}

// ---------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------

export async function createBudget(projectId: string, formData: FormData) {
  const approvedBudget = num(formData, "approved_budget");
  if (approvedBudget == null || approvedBudget <= 0) {
    return { error: "Enter an approved budget greater than zero." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("budgets").insert({
    project_id: projectId,
    approved_budget: approvedBudget,
    currency: str(formData, "currency") ?? "USD",
    notes: str(formData, "notes"),
  });

  if (error) return { error: friendlyError(error) };
  revalidateFinance(projectId);
  return { error: null };
}

export async function updateBudget(budgetId: string, projectId: string, formData: FormData) {
  const approvedBudget = num(formData, "approved_budget");
  if (approvedBudget == null || approvedBudget <= 0) {
    return { error: "Enter an approved budget greater than zero." };
  }
  const revisedBudget = num(formData, "revised_budget");
  if (revisedBudget != null && revisedBudget < 0) {
    return { error: "Revised budget cannot be negative." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("budgets")
    .update({
      approved_budget: approvedBudget,
      revised_budget: revisedBudget,
      currency: str(formData, "currency") ?? "USD",
      notes: str(formData, "notes"),
    })
    .eq("id", budgetId);

  if (error) return { error: friendlyError(error) };
  revalidateFinance(projectId);
  return { error: null };
}

export async function archiveBudget(budgetId: string, projectId: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("budgets")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", budgetId);

  if (error) return { error: friendlyError(error) };
  revalidateFinance(projectId);
  return { error: null };
}

// ---------------------------------------------------------------------
// Budget Lines
// ---------------------------------------------------------------------

export async function createBudgetLine(formData: FormData) {
  const budgetId = String(formData.get("budget_id"));
  const projectId = String(formData.get("project_id"));
  const amount = num(formData, "amount");
  const lineName = str(formData, "line_name");

  if (!lineName) return { error: "Enter a name for this budget line." };
  if (amount == null || amount <= 0) return { error: "Enter an amount greater than zero." };

  const supabase = await createClient();
  const { error } = await supabase.from("budget_lines").insert({
    budget_id: budgetId,
    line_name: lineName,
    category: str(formData, "category"),
    amount,
  });

  if (error) return { error: friendlyError(error) };
  revalidateFinance(projectId);
  return { error: null };
}

export async function updateBudgetLine(lineId: string, projectId: string, formData: FormData) {
  const amount = num(formData, "amount");
  const lineName = str(formData, "line_name");

  if (!lineName) return { error: "Enter a name for this budget line." };
  if (amount == null || amount <= 0) return { error: "Enter an amount greater than zero." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("budget_lines")
    .update({ line_name: lineName, category: str(formData, "category"), amount })
    .eq("id", lineId);

  if (error) return { error: friendlyError(error) };
  revalidateFinance(projectId);
  return { error: null };
}

export async function archiveBudgetLine(lineId: string, projectId: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("budget_lines")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", lineId);

  if (error) return { error: friendlyError(error) };
  revalidateFinance(projectId);
  return { error: null };
}

// ---------------------------------------------------------------------
// Expenditure
// ---------------------------------------------------------------------

export async function recordExpenditure(formData: FormData) {
  const budgetLineId = String(formData.get("budget_line_id"));
  const projectId = String(formData.get("project_id"));
  const amount = num(formData, "amount");
  const expenseDate = str(formData, "expense_date");

  if (amount == null || amount <= 0) return { error: "Enter an amount greater than zero." };
  if (!expenseDate) return { error: "Enter the expense date." };

  const supabase = await createClient();
  if (!(await budgetLineBelongsToProject(supabase, budgetLineId, projectId))) {
    return { error: "This budget line does not belong to this project." };
  }

  const { error } = await supabase.from("expenditures").insert({
    budget_line_id: budgetLineId,
    amount,
    expense_date: expenseDate,
    description: str(formData, "description"),
  });

  if (error) return { error: friendlyError(error) };
  revalidateFinance(projectId);
  return { error: null };
}

export async function updateExpenditure(expenditureId: string, projectId: string, formData: FormData) {
  const amount = num(formData, "amount");
  const expenseDate = str(formData, "expense_date");

  if (amount == null || amount <= 0) return { error: "Enter an amount greater than zero." };
  if (!expenseDate) return { error: "Enter the expense date." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("expenditures")
    .update({ amount, expense_date: expenseDate, description: str(formData, "description") })
    .eq("id", expenditureId);

  if (error) return { error: friendlyError(error) };
  revalidateFinance(projectId);
  return { error: null };
}

export async function archiveExpenditure(expenditureId: string, projectId: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("expenditures")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", expenditureId);

  if (error) return { error: friendlyError(error) };
  revalidateFinance(projectId);
  return { error: null };
}

// ---------------------------------------------------------------------
// Commitments
// ---------------------------------------------------------------------

export async function recordCommitment(formData: FormData) {
  const budgetLineId = String(formData.get("budget_line_id"));
  const projectId = String(formData.get("project_id"));
  const amount = num(formData, "amount");
  const commitmentDate = str(formData, "commitment_date");

  if (amount == null || amount <= 0) return { error: "Enter an amount greater than zero." };
  if (!commitmentDate) return { error: "Enter the commitment date." };

  const supabase = await createClient();
  if (!(await budgetLineBelongsToProject(supabase, budgetLineId, projectId))) {
    return { error: "This budget line does not belong to this project." };
  }

  const { error } = await supabase.from("commitments").insert({
    budget_line_id: budgetLineId,
    amount,
    commitment_date: commitmentDate,
    description: str(formData, "description"),
  });

  if (error) return { error: friendlyError(error) };
  revalidateFinance(projectId);
  return { error: null };
}

export async function updateCommitment(commitmentId: string, projectId: string, formData: FormData) {
  const amount = num(formData, "amount");
  const commitmentDate = str(formData, "commitment_date");

  if (amount == null || amount <= 0) return { error: "Enter an amount greater than zero." };
  if (!commitmentDate) return { error: "Enter the commitment date." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("commitments")
    .update({ amount, commitment_date: commitmentDate, description: str(formData, "description") })
    .eq("id", commitmentId);

  if (error) return { error: friendlyError(error) };
  revalidateFinance(projectId);
  return { error: null };
}

export async function archiveCommitment(commitmentId: string, projectId: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("commitments")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", commitmentId);

  if (error) return { error: friendlyError(error) };
  revalidateFinance(projectId);
  return { error: null };
}

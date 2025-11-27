import { useLiveQuery } from "dexie-react-hooks";
import { db, Transaction } from "../lib/db";
import { syncManager } from "../lib/sync";
import { v4 as uuidv4 } from "uuid";
import {
  TransactionInputSchema,
  TransactionUpdateSchema,
  validate,
} from "../lib/validation";

/**
 * Hook for managing transactions with optional filtering.
 * 
 * @param limit - Maximum number of transactions to return (optional)
 * @param yearMonth - Filter by year-month "YYYY-MM" or year "YYYY" (optional)
 * @param groupId - Filter by group: undefined = all, null = personal only, string = specific group
 */
export function useTransactions(
  limit?: number,
  yearMonth?: string,
  groupId?: string | null
) {
  // Single unified query that handles all filtering in one operation
  // This eliminates the race condition from the previous nested useLiveQuery pattern
  const transactions = useLiveQuery(async () => {
    let results: Transaction[];

    if (yearMonth) {
      // If yearMonth is just a year (e.g. "2024"), filter by date range
      if (yearMonth.length === 4) {
        results = await db.transactions
          .where("date")
          .between(`${yearMonth}-01-01`, `${yearMonth}-12-31\uffff`)
          .toArray();
      } else {
        // Filter by specific month
        results = await db.transactions
          .where("year_month")
          .equals(yearMonth)
          .toArray();
      }
    } else if (limit) {
      // Get limited results without month filter
      results = await db.transactions
        .orderBy("date")
        .reverse()
        .limit(limit)
        .toArray();
    } else {
      // Get all transactions
      results = await db.transactions.toArray();
    }

    // Apply group filter inline to avoid separate query
    if (groupId !== undefined) {
      if (groupId === null) {
        // Return only personal transactions
        results = results.filter((t) => !t.group_id);
      } else {
        // Return only transactions for specific group
        results = results.filter((t) => t.group_id === groupId);
      }
    }

    // Sort by date descending (most recent first)
    // We sort here because some query paths don't guarantee order
    results.sort((a, b) => b.date.localeCompare(a.date));

    return results;
  }, [limit, yearMonth, groupId]);

  const addTransaction = async (
    transaction: Omit<
      Transaction,
      "id" | "sync_token" | "pendingSync" | "deleted_at"
    >
  ) => {
    // Validate input data
    const validatedData = validate(TransactionInputSchema, transaction);
    
    const id = uuidv4();
    await db.transactions.add({
      ...validatedData,
      id,
      pendingSync: 1,
      deleted_at: null,
    });
    syncManager.sync();
  };

  const updateTransaction = async (
    id: string,
    updates: Partial<Omit<Transaction, "id" | "sync_token" | "pendingSync">>
  ) => {
    // Validate update data (partial validation)
    const validatedUpdates = validate(TransactionUpdateSchema, updates);
    
    await db.transactions.update(id, {
      ...validatedUpdates,
      pendingSync: 1,
    });
    syncManager.sync();
  };

  const deleteTransaction = async (id: string) => {
    // Soft delete
    await db.transactions.update(id, {
      deleted_at: new Date().toISOString(),
      pendingSync: 1,
    });
    syncManager.sync();
  };

  return {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}

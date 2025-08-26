import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export interface TransactionContext {
  supabase: any;
  rollback: () => Promise<void>;
  commit: () => Promise<void>;
}

/**
 * Execute operations within a database transaction
 * Note: Supabase doesn't support traditional transactions,
 * so we implement a pattern for atomic operations
 */
export async function withTransaction<T>(
  operations: (ctx: TransactionContext) => Promise<T>
): Promise<T> {
  const supabase = createServiceRoleClient();

  // Track operations for potential rollback
  const operationLog: Array<{
    table: string;
    operation: "insert" | "update" | "delete";
    data: any;
    condition?: any;
  }> = [];

  const context: TransactionContext = {
    supabase,

    // Custom rollback implementation
    rollback: async () => {
      console.warn("Rolling back operations...");

      // Attempt to reverse operations in reverse order
      for (let i = operationLog.length - 1; i >= 0; i--) {
        const op = operationLog[i];
        try {
          switch (op.operation) {
            case "insert":
              // Delete the inserted records
              if (op.data.id) {
                await supabase.from(op.table).delete().eq("id", op.data.id);
              }
              break;

            case "update":
              // This is complex - would need to store original values
              console.warn(`Cannot rollback update to ${op.table}`);
              break;

            case "delete":
              // Re-insert deleted records (if we stored them)
              console.warn(`Cannot rollback delete from ${op.table}`);
              break;
          }
        } catch (rollbackError) {
          console.error(`Rollback failed for ${op.table}:`, rollbackError);
        }
      }
    },

    // Commit is a no-op since we don't have real transactions
    commit: async () => {
      console.log(`Transaction completed with ${operationLog.length} operations`);
    },
  };

  // Wrap Supabase operations to log them
  const originalFrom = supabase.from.bind(supabase);
  supabase.from = (table: string) => {
    const tableOps = originalFrom(table);

    const originalInsert = tableOps.insert.bind(tableOps);
    const originalUpdate = tableOps.update.bind(tableOps);
    const originalDelete = tableOps.delete.bind(tableOps);

    tableOps.insert = (data: any) => {
      operationLog.push({ table, operation: "insert", data });
      return originalInsert(data);
    };

    tableOps.update = (data: any) => {
      const updateOp = originalUpdate(data);
      const originalEq = updateOp.eq?.bind(updateOp);

      if (originalEq) {
        updateOp.eq = (column: string, value: any) => {
          operationLog.push({
            table,
            operation: "update",
            data,
            condition: { column, value },
          });
          return originalEq(column, value);
        };
      }

      return updateOp;
    };

    tableOps.delete = () => {
      const deleteOp = originalDelete();
      const originalEq = deleteOp.eq?.bind(deleteOp);

      if (originalEq) {
        deleteOp.eq = (column: string, value: any) => {
          operationLog.push({
            table,
            operation: "delete",
            data: null,
            condition: { column, value },
          });
          return originalEq(column, value);
        };
      }

      return deleteOp;
    };

    return tableOps;
  };

  try {
    const result = await operations(context);
    await context.commit();
    return result;
  } catch (error) {
    console.error("Transaction failed:", error);
    await context.rollback();
    throw error;
  }
}

/**
 * Helper for critical payment operations that need consistency
 */
export async function withPaymentTransaction<T>(
  paymentReference: string,
  operations: (ctx: TransactionContext) => Promise<T>
): Promise<T> {
  return withTransaction(async (ctx) => {
    // Add payment-specific logging
    console.log(`Starting payment transaction for reference: ${paymentReference}`);

    // Execute the operations
    const result = await operations(ctx);

    // Log completion
    console.log(`Payment transaction completed for reference: ${paymentReference}`);

    return result;
  });
}

/**
 * Helper for user registration operations
 */
export async function withRegistrationTransaction<T>(
  userEmail: string,
  operations: (ctx: TransactionContext) => Promise<T>
): Promise<T> {
  return withTransaction(async (ctx) => {
    console.log(`Starting registration transaction for user: ${userEmail}`);

    const result = await operations(ctx);

    console.log(`Registration transaction completed for user: ${userEmail}`);

    return result;
  });
}

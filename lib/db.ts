"use server"

import { createClient } from "@/lib/supabase/server"

// Custom SQL template tag function that uses Supabase's postgres connection
function createSqlTag() {
  async function sql(strings: TemplateStringsArray, ...values: any[]) {
    const supabase = await createClient()

    // Build the SQL query by interleaving strings and values
    let query = strings[0]
    const params: any[] = []

    for (let i = 0; i < values.length; i++) {
      const value = values[i]

      // Handle nested sql fragments
      if (value && typeof value === "object" && value._isSqlFragment) {
        query += value.text
        params.push(...value.values)
      } else {
        params.push(value)
        query += `$${params.length}`
      }

      query += strings[i + 1]
    }

    // Execute the query using Supabase's RPC or direct postgres connection
    // Since Supabase client doesn't support raw SQL directly, we'll use the postgres connection
    const { data, error } = await supabase.rpc("exec_sql", {
      query_text: query,
      query_params: params,
    })

    if (error) {
      console.error("[v0] SQL error:", error)
      throw new Error(`Database error: ${error.message}`)
    }

    return data || []
  }

  // Support for parameterized queries
  sql.query = async (query: string, values: any[]) => {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc("exec_sql", {
      query_text: query,
      query_params: values,
    })

    if (error) {
      console.error("[v0] SQL query error:", error)
      throw new Error(`Database error: ${error.message}`)
    }

    return data || []
  }

  // Create empty SQL fragment for conditional queries
  const emptyFragment = { _isSqlFragment: true, text: "", values: [] }

  // Allow sql`` to create fragments
  const originalSql = sql
  const wrappedSql: any = (strings: TemplateStringsArray, ...values: any[]) => {
    // If called with no values and empty string, return empty fragment
    if (strings.length === 1 && strings[0] === "" && values.length === 0) {
      return emptyFragment
    }

    // If this is being used as a fragment (not awaited), return a fragment object
    if (strings.length > 0) {
      let text = strings[0]
      const fragmentValues: any[] = []

      for (let i = 0; i < values.length; i++) {
        const value = values[i]

        if (value && typeof value === "object" && value._isSqlFragment) {
          text += value.text
          fragmentValues.push(...value.values)
        } else {
          fragmentValues.push(value)
          text += `$${fragmentValues.length}`
        }

        text += strings[i + 1]
      }

      // Return a fragment that can be nested
      return {
        _isSqlFragment: true,
        text,
        values: fragmentValues,
        then: (resolve: any) => {
          // If someone awaits this, execute it as a full query
          return originalSql(strings, ...values).then(resolve)
        },
      }
    }

    return originalSql(strings, ...values)
  }

  wrappedSql.query = sql.query

  return wrappedSql
}

export const sql = createSqlTag()

export type { Task, TaskLabel } from "./db-types"

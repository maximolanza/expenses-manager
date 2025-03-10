"use client"

import { useEffect, useState } from "react"
import { useExpenses } from "@/hooks/use-expenses"
import { useCategories } from "@/hooks/use-categories"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ExpenseForm } from "@/components/expenses/expense-form"
import { ExpensesTable } from "@/components/expenses/expenses-table"
import { useSupabase } from "@/components/providers/supabase-provider"
import { formatCurrency } from "@/lib/utils"
import type { Database } from "@/types/supabase"

type Expense = Database["public"]["Tables"]["expenses"]["Row"] & {
  categories: Database["public"]["Tables"]["categories"]["Row"]
}

type ExpenseFormData = {
  amount: number
  description: string
  category_id: number
  date: string
  currency: "UYU" | "USD"
  metadata?: Record<string, any>
}

export default function ExpensesPage() {
  const { user } = useSupabase()
  const { loading, error, getExpenses, addExpense, updateExpense, deleteExpense } =
    useExpenses()
  const { categories, loading: loadingCategories } = useCategories()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (user) {
      loadExpenses()
    }
  }, [user, getExpenses])

  const loadExpenses = async () => {
    const data = await getExpenses()
    if (data) {
      setExpenses(data)
    }
  }

  const handleAddExpense = async (data: ExpenseFormData) => {
    if (!user) return

    const expense = await addExpense({
      ...data,
      user_id: user.id,
      metadata: {}
    })

    if (expense) {
      await loadExpenses()
      setShowForm(false)
    }
  }

  const handleUpdateExpense = async (data: ExpenseFormData) => {
    if (!selectedExpense) return

    const expense = await updateExpense(selectedExpense.id, data)

    if (expense) {
      await loadExpenses()
      setSelectedExpense(null)
      setShowForm(false)
    }
  }

  const handleDeleteExpense = async (expense: Expense) => {
    const success = await deleteExpense(expense.id)

    if (success) {
      await loadExpenses()
    }
  }

  const getTotalAmount = (currency: "UYU" | "USD") => {
    return expenses
      .filter(expense => expense.currency === currency)
      .reduce((total, expense) => total + expense.amount, 0)
  }

  const getRecentExpenses = () => {
    return expenses.slice(0, 5)
  }

  const getTopCategories = () => {
    const categoryTotals = expenses.reduce((acc, expense) => {
      const categoryId = expense.category_id
      if (!acc[categoryId]) {
        acc[categoryId] = {
          name: expense.categories.name,
          color: expense.categories.color,
          total: 0,
          count: 0
        }
      }
      acc[categoryId].total += expense.amount
      acc[categoryId].count += 1
      return acc
    }, {} as Record<number, { name: string; color: string; total: number; count: number }>)

    return Object.values(categoryTotals)
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)
  }

  if (loading || loadingCategories) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando gastos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          {error}
        </div>
      </div>
    )
  }

  const totalUYU = getTotalAmount("UYU")
  const totalUSD = getTotalAmount("USD")
  const topCategories = getTopCategories()

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Gastos</h1>
        <Button onClick={() => setShowForm(true)}>Nuevo gasto</Button>
      </div>

      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-2">Total en UYU</h3>
          <p className="text-3xl font-bold">{formatCurrency(totalUYU, "UYU")}</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-2">Total en USD</h3>
          <p className="text-3xl font-bold">{formatCurrency(totalUSD, "USD")}</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-2">Top Categorías</h3>
          <div className="space-y-2">
            {topCategories.map(category => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                  <span>{category.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">{category.count} gastos</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedExpense ? "Editar gasto" : "Nuevo gasto"}
            </DialogTitle>
          </DialogHeader>
          <ExpenseForm
            expense={selectedExpense || undefined}
            categories={categories}
            onSubmit={selectedExpense ? handleUpdateExpense : handleAddExpense}
            onClose={() => {
              setShowForm(false)
              setSelectedExpense(null)
            }}
          />
        </DialogContent>
      </Dialog>

      <div className="mt-8">
        {expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-card py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <svg
                className="h-10 w-10 text-muted-foreground"
                fill="none"
                height="24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2v20" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">No hay gastos</h3>
              <p className="text-sm text-muted-foreground">
                Comienza agregando tu primer gasto
              </p>
            </div>
          </div>
        ) : (
          <ExpensesTable
            expenses={expenses}
            onEdit={(expense) => {
              setSelectedExpense(expense)
              setShowForm(true)
            }}
            onDelete={handleDeleteExpense}
          />
        )}
      </div>
    </div>
  )
} 
"use client"

import { useState } from "react"
import { createCategory, updateCategory, deleteCategory, type CategoryData } from "@/actions/categories"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Kanagawa-inspired color palette for categories
const COLORS = [
  { name: "Crystal Blue", value: "#7E9CD8" },
  { name: "Spring Green", value: "#98BB6C" },
  { name: "Oni Violet", value: "#957FB8" },
  { name: "Surimi Orange", value: "#FFA066" },
  { name: "Sakura Pink", value: "#D27E99" },
  { name: "Spring Blue", value: "#7FB4CA" },
  { name: "Autumn Red", value: "#C34043" },
  { name: "Carp Yellow", value: "#E6C384" },
]

interface CategoryManagerProps {
  categories: CategoryData[]
}

export function CategoryManager({ categories: initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = useState(initialCategories)
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState(COLORS[0].value)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return

    setLoading(true)
    setError("")

    const result = await createCategory({ name: newName.trim(), color: newColor })

    if (result.success) {
      setCategories([...categories, { ...result.data, _count: { subscriptions: 0 } }])
      setNewName("")
      setNewColor(COLORS[0].value)
    } else {
      setError(result.error)
    }

    setLoading(false)
  }

  async function handleUpdate(id: number) {
    if (!editName.trim()) return

    setLoading(true)
    const result = await updateCategory(id, { name: editName.trim(), color: editColor })

    if (result.success) {
      setCategories(categories.map(c =>
        c.id === id ? { ...c, name: editName.trim(), color: editColor } : c
      ))
      setEditingId(null)
    } else {
      setError(result.error)
    }

    setLoading(false)
  }

  async function handleDelete(id: number) {
    setLoading(true)
    const result = await deleteCategory(id)

    if (result.success) {
      setCategories(categories.filter(c => c.id !== id))
    }

    setLoading(false)
    setConfirmDeleteId(null)
  }

  function startEditing(category: CategoryData) {
    setEditingId(category.id)
    setEditName(category.name)
    setEditColor(category.color || COLORS[0].value)
  }

  return (
    <div className="space-y-4">
      {/* Create new category */}
      <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name..."
          className="flex-1 px-3 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={loading}
        />
        <div className="flex gap-2">
          <select
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-ring"
            style={{ borderLeftColor: newColor, borderLeftWidth: 4 }}
            disabled={loading}
          >
            {COLORS.map(color => (
              <option key={color.value} value={color.value}>
                {color.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading || !newName.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
          >
            Add
          </button>
        </div>
      </form>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Categories list */}
      {categories.length === 0 ? (
        <p className="text-muted-foreground text-sm py-4">
          No categories yet. Create one to organize your subscriptions.
        </p>
      ) : (
        <div className="space-y-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-3 p-3 border border-border rounded-lg"
              style={{ borderLeftColor: category.color || "#7a8382", borderLeftWidth: 4 }}
            >
              {editingId === category.id ? (
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-2 py-1 border border-border rounded bg-card"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <select
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="flex-1 sm:flex-none px-2 py-1 border border-border rounded bg-card"
                    >
                      {COLORS.map(color => (
                        <option key={color.value} value={color.value}>
                          {color.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleUpdate(category.id)}
                      disabled={loading}
                      className="px-3 py-1 text-sm bg-success text-success-foreground rounded hover:opacity-90"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:opacity-90"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="flex-1 font-medium">{category.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {category._count?.subscriptions || 0} channel{(category._count?.subscriptions || 0) !== 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={() => startEditing(category)}
                    className="p-1 text-muted-foreground hover:text-foreground"
                    title="Edit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(category.id)}
                    className="p-1 text-muted-foreground hover:text-destructive"
                    title="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={confirmDeleteId !== null} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              Subscriptions in this category will be moved to uncategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

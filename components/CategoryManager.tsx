"use client"

import { useState } from "react"
import { createCategory, updateCategory, deleteCategory, type CategoryData } from "@/actions/categories"

const COLORS = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#22C55E" },
  { name: "Purple", value: "#A855F7" },
  { name: "Orange", value: "#F97316" },
  { name: "Pink", value: "#EC4899" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Red", value: "#EF4444" },
  { name: "Yellow", value: "#EAB308" },
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
    if (!confirm("Delete this category? Subscriptions will be moved to uncategorized.")) {
      return
    }

    setLoading(true)
    const result = await deleteCategory(id)

    if (result.success) {
      setCategories(categories.filter(c => c.id !== id))
    }

    setLoading(false)
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
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <div className="flex gap-2">
          <select
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
          >
            Add
          </button>
        </div>
      </form>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Categories list */}
      {categories.length === 0 ? (
        <p className="text-gray-500 text-sm py-4">
          No categories yet. Create one to organize your subscriptions.
        </p>
      ) : (
        <div className="space-y-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
              style={{ borderLeftColor: category.color || "#6B7280", borderLeftWidth: 4 }}
            >
              {editingId === category.id ? (
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <select
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="flex-1 sm:flex-none px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
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
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="flex-1 font-medium">{category.name}</span>
                  <span className="text-sm text-gray-500">
                    {category._count?.subscriptions || 0} channel{(category._count?.subscriptions || 0) !== 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={() => startEditing(category)}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    title="Edit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-1 text-gray-500 hover:text-red-600"
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
    </div>
  )
}

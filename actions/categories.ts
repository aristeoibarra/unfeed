"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export interface CategoryData {
  id: number
  name: string
  color: string | null
  createdAt: Date
  _count?: {
    subscriptions: number
  }
}

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// Obtener todas las categorías con conteo de suscripciones
export async function getCategories(): Promise<CategoryData[]> {
  return prisma.category.findMany({
    include: {
      _count: {
        select: { subscriptions: { where: { deletedAt: null } } }
      }
    },
    orderBy: { name: "asc" }
  })
}

// Obtener una categoría por ID
export async function getCategory(id: number): Promise<CategoryData | null> {
  return prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { subscriptions: { where: { deletedAt: null } } }
      }
    }
  })
}

// Crear categoría
export async function createCategory(data: {
  name: string
  color?: string
}): Promise<ActionResult<CategoryData>> {
  try {
    const existing = await prisma.category.findUnique({
      where: { name: data.name }
    })

    if (existing) {
      return { success: false, error: "Category already exists" }
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        color: data.color || null
      }
    })

    revalidatePath("/subscriptions")

    return { success: true, data: category }
  } catch (error) {
    console.error("Error creating category:", error)
    return { success: false, error: "Failed to create category" }
  }
}

// Actualizar categoría
export async function updateCategory(
  id: number,
  data: { name?: string; color?: string }
): Promise<ActionResult<CategoryData>> {
  try {
    if (data.name) {
      const existing = await prisma.category.findFirst({
        where: { name: data.name, id: { not: id } }
      })

      if (existing) {
        return { success: false, error: "Category name already exists" }
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data
    })

    revalidatePath("/subscriptions")

    return { success: true, data: category }
  } catch (error) {
    console.error("Error updating category:", error)
    return { success: false, error: "Failed to update category" }
  }
}

// Eliminar categoría
export async function deleteCategory(id: number): Promise<ActionResult<null>> {
  try {
    // Primero quitar la categoría de todas las suscripciones
    await prisma.subscription.updateMany({
      where: { categoryId: id },
      data: { categoryId: null }
    })

    await prisma.category.delete({ where: { id } })

    revalidatePath("/subscriptions")

    return { success: true, data: null }
  } catch (error) {
    console.error("Error deleting category:", error)
    return { success: false, error: "Failed to delete category" }
  }
}

// Asignar categoría a una suscripción
export async function assignCategory(
  subscriptionId: number,
  categoryId: number | null
): Promise<ActionResult<null>> {
  try {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { categoryId }
    })

    revalidatePath("/subscriptions")
    revalidatePath("/")

    return { success: true, data: null }
  } catch (error) {
    console.error("Error assigning category:", error)
    return { success: false, error: "Failed to assign category" }
  }
}

// Obtener suscripciones agrupadas por categoría
export async function getSubscriptionsByCategory() {
  const categories = await prisma.category.findMany({
    include: {
      subscriptions: {
        where: { deletedAt: null },
        orderBy: { name: "asc" }
      }
    },
    orderBy: { name: "asc" }
  })

  const uncategorized = await prisma.subscription.findMany({
    where: { deletedAt: null, categoryId: null },
    orderBy: { name: "asc" }
  })

  return { categories, uncategorized }
}

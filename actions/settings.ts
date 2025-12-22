"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export interface AppSettings {
  hideDislikedFromFeed: boolean
}

const DEFAULT_SETTINGS: AppSettings = {
  hideDislikedFromFeed: true
}

async function getOrCreateSettings() {
  let settings = await prisma.settings.findFirst()

  if (!settings) {
    settings = await prisma.settings.create({
      data: DEFAULT_SETTINGS
    })
  }

  return settings
}

export async function getSettings(): Promise<AppSettings> {
  const settings = await getOrCreateSettings()
  return {
    hideDislikedFromFeed: settings.hideDislikedFromFeed
  }
}

export async function updateSettings(data: Partial<AppSettings>): Promise<AppSettings> {
  const settings = await getOrCreateSettings()

  const updated = await prisma.settings.update({
    where: { id: settings.id },
    data
  })

  revalidatePath("/")

  return {
    hideDislikedFromFeed: updated.hideDislikedFromFeed
  }
}

export async function toggleHideDislikedFromFeed(): Promise<boolean> {
  const settings = await getOrCreateSettings()

  const updated = await prisma.settings.update({
    where: { id: settings.id },
    data: { hideDislikedFromFeed: !settings.hideDislikedFromFeed }
  })

  revalidatePath("/")

  return updated.hideDislikedFromFeed
}

import { vi } from "vitest";

function createModelMock() {
  return {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    upsert: vi.fn(),
    count: vi.fn(),
  };
}

export const prismaMock = {
  user: createModelMock(),
  watchHistory: createModelMock(),
  videoReaction: createModelMock(),
  subscription: createModelMock(),
  syncStatus: createModelMock(),
  video: createModelMock(),
  playlist: createModelMock(),
  playlistVideo: createModelMock(),
  watchLater: createModelMock(),
  note: createModelMock(),
  notification: createModelMock(),
  category: createModelMock(),
  $transaction: vi.fn((fn) => fn(prismaMock)),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
};

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

# Unfeed - Sistema de Caché y Sincronización

## Resumen

Sistema de caché local para reducir llamadas a la YouTube API de ~7,000 unidades/día a ~300-1,500 unidades/día.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                           VPS                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │   Next.js   │────▶│   SQLite    │◀────│    Cron     │       │
│  │    (App)    │     │    (DB)     │     │  (cada 12h) │       │
│  └─────────────┘     └─────────────┘     └──────┬──────┘       │
│         │                                       │               │
│         │                                       ▼               │
│         │                              ┌─────────────┐          │
│         │                              │ /api/cron/  │          │
│         │                              │    sync     │          │
│         │                              └──────┬──────┘          │
│         │                                     │                 │
│         └─────────────────────────────────────┼─────────────────┤
│                                               │                 │
│                                               ▼                 │
│                                     ┌─────────────────┐         │
│                                     │  YouTube API    │         │
│                                     │  (solo en sync) │         │
│                                     └─────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Modelo de Datos

### Video (Expandido)

```prisma
model Video {
  id          Int      @id @default(autoincrement())
  videoId     String   @unique

  // Datos básicos
  title       String
  thumbnail   String
  channelId   String
  channelName String
  publishedAt DateTime

  // Datos expandidos
  duration    Int?     // Duración en segundos (ej: 933 = 15:33)
  description String?  // Descripción del video (para búsqueda)
  tags        String?  // Tags separados por coma
  category    String?  // Categoría (Education, Gaming, etc.)
  viewCount   Int?     // Vistas al momento del sync
  likeCount   Int?     // Likes al momento del sync

  cachedAt    DateTime @default(now())

  @@index([channelId])
  @@index([publishedAt(sort: Desc)])
  @@index([duration])
}
```

### SyncStatus

```prisma
model SyncStatus {
  id           Int      @id @default(autoincrement())
  channelId    String   @unique
  lastSyncedAt DateTime @default(now())
  status       String   @default("pending") // "ok" | "error" | "pending" | "syncing"
  errorMessage String?
  videoCount   Int      @default(0)         // Videos cacheados de este canal

  subscription Subscription @relation(fields: [channelId], references: [channelId], onDelete: Cascade)
}
```

### Subscription (Actualizado)

```prisma
model Subscription {
  id        Int      @id @default(autoincrement())
  channelId String   @unique
  name      String
  thumbnail String?
  createdAt DateTime @default(now())

  syncStatus SyncStatus?
}
```

---

## Tipos de Sincronización

### Deep Sync (Canal Nuevo)

| Aspecto | Valor |
|---------|-------|
| **Cuándo se ejecuta** | Al agregar un canal nuevo |
| **Videos por canal** | 250 (5 páginas × 50) |
| **Costo por canal** | 500 unidades |
| **Propósito** | Llenar el caché con historial |

```
Usuario agrega canal
        │
        ▼
┌───────────────────┐
│ Crear Subscription │
│ Crear SyncStatus   │
│ status: "pending"  │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   DEEP SYNC       │
│   5 páginas       │
│   250 videos      │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ status: "ok"      │
│ videoCount: 250   │
└───────────────────┘
```

### Sync Normal (Cron)

| Aspecto | Valor |
|---------|-------|
| **Cuándo se ejecuta** | Cron cada 12 horas |
| **Videos por canal** | 50 (1 página) |
| **Costo por canal** | 100 unidades |
| **Propósito** | Traer videos nuevos |

```
Cron cada 12h
        │
        ▼
┌───────────────────┐
│ Obtener canales   │
│ con status != err │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Por cada canal:   │
│ 1 página (50 vid) │
│ Upsert en DB      │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Actualizar        │
│ SyncStatus        │
└───────────────────┘
```

---

## Costos de API

### YouTube Data API v3 - Cuotas

| Operación | Costo |
|-----------|-------|
| search.list (buscar videos) | 100 unidades |
| videos.list (detalles) | 1 unidad |
| Cuota diaria gratis | 10,000 unidades |

### Costo por Tipo de Sync

| Tipo | Videos | Páginas | Costo/canal | Con 10 canales |
|------|--------|---------|-------------|----------------|
| Deep Sync | 250 | 5 | 500 units | 5,000 units |
| Normal Sync | 50 | 1 | 100 units | 1,000 units |

### Estimación de Uso Diario

| Escenario | Canales | Syncs/día | Costo diario | % de cuota |
|-----------|---------|-----------|--------------|------------|
| Mínimo | 25 | 1 | 2,500 | 25% |
| Normal | 50 | 1 | 5,000 | 50% |
| Máximo | 100 | 1 | 10,000 | 100% |

**Decisión final:** Sync 1x al día (cada 24h) = hasta **100 canales**.

---

## Capacidad del Sistema

| Métrica | Límite | Notas |
|---------|--------|-------|
| Canales máximos | **100** | Con sync 1x/día |
| Videos en caché | Ilimitado | SQLite aguanta millones |
| Retención | Infinita | No borramos videos viejos |
| Frecuencia sync | **Cada 24h** | Una vez al día |

---

## Flujos de Usuario

### 1. Usuario Abre la App

```
GET /
    │
    ├─ Lee videos de SQLite (0 API calls)
    │
    ├─ Muestra feed ordenado por fecha
    │
    └─ Load more → Más videos de SQLite (0 API calls)
```

### 2. Usuario Agrega Canal

```
POST /api/subscriptions
    │
    ├─ Validar URL de YouTube
    │
    ├─ Obtener info del canal (1 API call)
    │
    ├─ Crear Subscription + SyncStatus
    │
    └─ Ejecutar Deep Sync (500 units)
        │
        └─ Canal listo con 250 videos
```

### 3. Cron Automático

```
GET /api/cron/sync (cada 12h)
    │
    ├─ Verificar secret key
    │
    ├─ Obtener todos los canales activos
    │
    ├─ Por cada canal: Normal Sync (100 units)
    │
    └─ Retornar resumen:
       {
         "channelsSynced": 10,
         "newVideos": 23,
         "errors": []
       }
```

---

## Endpoint del Cron

### Request

```
GET /api/cron/sync
Headers:
  Authorization: Bearer <CRON_SECRET>
```

### Response (éxito)

```json
{
  "success": true,
  "timestamp": "2025-12-21T10:00:00Z",
  "channelsSynced": 10,
  "newVideos": 23,
  "totalVideosInCache": 2847,
  "apiUnitsUsed": 1000,
  "errors": []
}
```

### Response (con errores parciales)

```json
{
  "success": true,
  "timestamp": "2025-12-21T10:00:00Z",
  "channelsSynced": 8,
  "newVideos": 18,
  "totalVideosInCache": 2847,
  "apiUnitsUsed": 800,
  "errors": [
    {
      "channelId": "UC...",
      "channelName": "Canal X",
      "error": "Channel not found"
    }
  ]
}
```

---

## Configuración del Cron en VPS

### Opción A: Crontab

```bash
# Editar crontab
crontab -e

# Agregar línea (cada 24 horas a las 6am)
0 6 * * * curl -H "Authorization: Bearer $CRON_SECRET" https://tu-dominio.com/api/cron/sync
```

### Opción B: Systemd Timer

```ini
# /etc/systemd/system/unfeed-sync.service
[Unit]
Description=Unfeed Video Sync

[Service]
Type=oneshot
ExecStart=/usr/bin/curl -H "Authorization: Bearer SECRET" http://localhost:3000/api/cron/sync
```

```ini
# /etc/systemd/system/unfeed-sync.timer
[Unit]
Description=Run Unfeed sync every 24 hours

[Timer]
OnCalendar=*-*-* 06:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

---

## Variables de Entorno

```env
# .env
DATABASE_URL="file:./dev.db"
YOUTUBE_API_KEY=tu_api_key_aqui

# Nuevo: Secret para proteger el endpoint de cron
CRON_SECRET=tu_secret_aleatorio_aqui
```

---

## UI - Cambios Planeados

### VideoCard - Mostrar Duración

```
┌─────────────────────────────┐
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │      THUMBNAIL          │ │
│ │                    15:33│ │  ← Duración en esquina
│ └─────────────────────────┘ │
│ Título del Video            │
│ Canal Name · 2 days ago     │
└─────────────────────────────┘
```

### Feed - Filtros por Duración (Futuro)

```
┌─────────────────────────────────────────┐
│ [Todos] [< 10 min] [10-30 min] [> 30 min]│
└─────────────────────────────────────────┘
```

---

## Comparación: Antes vs Después

| Métrica | Sin Caché | Con Caché |
|---------|-----------|-----------|
| API calls por carga de página | 3-10 | 0 |
| API calls por "Load more" | 3-10 | 0 |
| Uso diario típico | ~7,000 units | ~300-1,000 units |
| Días que dura la cuota | 1-2 | 10-33 |
| Tiempo de carga | 1-3 seg | < 100ms |

---

## Tareas de Implementación

### Fase 1: Sistema de Caché

- [ ] Actualizar schema de Prisma con modelo expandido
- [ ] Modificar YouTube API para traer campos extra (duration, description, etc.)
- [ ] Implementar Deep Sync para canales nuevos
- [ ] Implementar Normal Sync para cron
- [ ] Crear endpoint `/api/cron/sync`
- [ ] Mostrar duración en VideoCard
- [ ] Agregar variable CRON_SECRET
- [ ] Documentar configuración de cron en VPS
- [ ] Implementar soft delete en Subscription (deletedAt)
- [ ] Actualizar addSubscription con lógica de reactivación
- [ ] Detectar y actualizar cambios de nombre/foto del canal en sync

### Fase 2: Sistema de Notificaciones

- [ ] Agregar modelo Notification al schema de Prisma
- [ ] Crear notificación al insertar video nuevo en sync
- [ ] Crear componente NotificationBell (campanita)
- [ ] Crear componente NotificationDropdown
- [ ] Crear página `/notifications`
- [ ] Implementar server actions (getNotifications, markAsRead, etc.)
- [ ] Implementar actualización de contador al focus
- [ ] Agregar limpieza automática de notificaciones > 30 días al cron

### Fase 3: Categorías y Tags

- [ ] Crear modelo Category
- [ ] Agregar categoryId a Subscription
- [ ] Crear UI para gestionar categorías (CRUD)
- [ ] Agregar selector de categoría al agregar/editar canal
- [ ] Filtro por categoría en el feed
- [ ] Implementar búsqueda/filtro por tags de videos

### Fase 4: Likes/Dislikes

- [ ] Crear modelo VideoReaction
- [ ] Crear componente LikeDislikeButton
- [ ] Agregar botones en página de video
- [ ] Crear página `/liked` (videos con like)
- [ ] Crear modelo Settings para preferencias
- [ ] Agregar setting "Ocultar videos con dislike"
- [ ] Implementar filtro en feed según setting
- [ ] Mostrar indicador de like/dislike en VideoCard

### Fase 5: Historial de Videos

- [ ] Mejorar modelo WatchedVideo → WatchHistory
- [ ] Registrar cada visualización (no solo marcar visto)
- [ ] Guardar progreso del video (opcional)
- [ ] Crear página `/history`
- [ ] Agrupar por día (Hoy, Ayer, Esta semana, etc.)
- [ ] Búsqueda en historial
- [ ] Opción de limpiar historial

### Fase 6: Playlists

- [ ] Crear modelo Playlist y PlaylistVideo
- [ ] CRUD de playlists
- [ ] Agregar/quitar videos de playlist
- [ ] Reordenar videos en playlist (drag & drop)
- [ ] Crear página `/playlists`
- [ ] Crear página `/playlist/[id]`
- [ ] Botón "Agregar a playlist" en video
- [ ] Reproducción continua de playlist

### Fase 7: PWA y Reproducción en Background

- [ ] Configurar next-pwa
- [ ] Crear manifest.json
- [ ] Configurar Service Worker
- [ ] Implementar reproducción en background
- [ ] Integrar Media Session API (controles del sistema)
- [ ] Agregar iconos para instalación
- [ ] Modo "Solo audio" para ahorrar datos
- [ ] Pantalla de bloqueo con controles

### Fase 8: UI con shadcn y Sidebar

- [ ] Instalar y configurar shadcn/ui
- [ ] Crear layout con Sidebar colapsable
- [ ] Migrar navegación al Sidebar
- [ ] Agregar componentes shadcn (Button, Card, Dialog, etc.)
- [ ] Implementar tema claro/oscuro con shadcn
- [ ] Diseño responsive (sidebar → bottom nav en móvil)
- [ ] Mejorar VideoCard con componentes shadcn

---

## Sistema de Notificaciones

### Resumen

Sistema de notificaciones para alertar al usuario sobre videos nuevos de sus canales suscritos.

### Decisiones de Diseño

| Aspecto | Decisión | Razón |
|---------|----------|-------|
| **Retención** | 30 días | Balance entre historial y limpieza de DB |
| **Agrupación** | Individual (una por video) | Ver títulos ayuda a decidir qué ver (TDA) |
| **Actualización contador** | Al hacer focus en la pestaña | Eficiente, patrón estándar (Gmail, Twitter) |

### Modelo de Datos

```prisma
model Notification {
  id          Int       @id @default(autoincrement())

  // Referencia al video
  videoId     String
  title       String
  thumbnail   String
  channelId   String
  channelName String

  // Estado
  isRead      Boolean   @default(false)

  // Timestamps
  createdAt   DateTime  @default(now())
  readAt      DateTime?

  @@index([isRead])
  @@index([createdAt(sort: Desc)])
}
```

### Flujo de Creación de Notificaciones

```
Durante el Sync:
│
├─ Por cada video del API:
│   │
│   ├─ ¿Existe en Video table?
│   │   ├─ Sí → Actualizar (NO crear notificación)
│   │   └─ No → Insertar video + Crear Notificación
│   │
│   └─ Notificación SOLO para videos NUEVOS
```

### UI - Campanita Flotante

```
┌──────────────────────────────────────────────────────┐
│  Unfeed                              🔔 (12)   ...   │
│                                       │              │
│                        Click ─────────┘              │
│                                       ▼              │
│                    ┌────────────────────────────────┐│
│                    │ Nuevos Videos      [✓ Todas]  ││
│                    ├────────────────────────────────┤│
│                    │ ┌────┐                         ││
│                    │ │ 📷 │ Next.js 15 is here      ││
│                    │ └────┘ Theo · hace 2h      ●   ││
│                    ├────────────────────────────────┤│
│                    │ ┌────┐                         ││
│                    │ │ 📷 │ TypeScript tips         ││
│                    │ └────┘ Fireship · hace 3h  ●   ││
│                    ├────────────────────────────────┤│
│                    │ ┌────┐                         ││
│                    │ │ 📷 │ React Server...         ││
│                    │ └────┘ Midudev · hace 5h   ○   ││
│                    ├────────────────────────────────┤│
│                    │        [Ver todas (24)]        ││
│                    └────────────────────────────────┘│
└──────────────────────────────────────────────────────┘

● = No leída (punto azul/rojo)
○ = Leída
```

### UI - Página de Notificaciones (/notifications)

```
┌──────────────────────────────────────────────────────┐
│  Notificaciones (24)              [Marcar todas ✓]   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Hoy                                                 │
│  ┌────────────────────────────────────────────────┐  │
│  │ 📷 │ Next.js 15 is here              ●  [✓]   │  │
│  │     │ Theo - t3.gg · hace 2 horas              │  │
│  └────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────┐  │
│  │ 📷 │ TypeScript tips you need        ●  [✓]   │  │
│  │     │ Fireship · hace 3 horas                  │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Ayer                                                │
│  ┌────────────────────────────────────────────────┐  │
│  │ 📷 │ React Server Components         ○        │  │
│  │     │ Midudev · hace 1 día                     │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│              [Cargar más notificaciones]             │
└──────────────────────────────────────────────────────┘
```

### Acciones Disponibles

| Acción | Trigger | Resultado |
|--------|---------|-----------|
| **Ver video** | Click en notificación | Navega a `/watch/[id]` + marca como leída |
| **Marcar como leída** | Click en checkbox [✓] | Solo marca, no navega |
| **Marcar todas** | Click en "Marcar todas ✓" | Marca todas como leídas |

### Componentes a Crear

| Componente | Ubicación | Función |
|------------|-----------|---------|
| `NotificationBell` | Header | Icono + contador + dropdown |
| `NotificationDropdown` | Flotante | Lista últimas 5 notificaciones |
| `NotificationList` | `/notifications` | Lista completa paginada |
| `NotificationItem` | Reutilizable | Card de cada notificación |

### Server Actions

```typescript
// actions/notifications.ts

// Obtener notificaciones con paginación
getNotifications(page: number): Promise<{
  notifications: Notification[]
  hasMore: boolean
  unreadCount: number
}>

// Obtener solo el contador (para la campanita)
getUnreadCount(): Promise<number>

// Marcar una como leída
markAsRead(notificationId: number): Promise<void>

// Marcar todas como leídas
markAllAsRead(): Promise<void>
```

### Actualización del Contador (Focus)

```typescript
// hooks/useNotificationCount.ts

useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      refreshCount()
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
}, [])
```

### Limpieza Automática (30 días)

```typescript
// Ejecutar en el cron de sync o separado

async function cleanOldNotifications() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  await prisma.notification.deleteMany({
    where: {
      createdAt: { lt: thirtyDaysAgo }
    }
  })
}
```

### Estimación de Almacenamiento

```
100 canales × ~2 videos/día = 200 notificaciones/día
200 × 30 días = 6,000 notificaciones máximo
~0.5KB por notificación = ~3MB total

SQLite maneja esto sin problema.
```

---

## Soft Delete de Suscripciones

### Decisión

Cuando se elimina un canal, NO se borra físicamente. Se marca con `deletedAt`.

### Razones

| Beneficio | Explicación |
|-----------|-------------|
| **Ahorro de API** | Re-suscribirse no requiere Deep Sync |
| **Historial intacto** | Videos, notas, watched status se mantienen |
| **Recuperación fácil** | Solo reactivar el canal |

### Modelo Actualizado

```prisma
model Subscription {
  id        Int       @id @default(autoincrement())
  channelId String    @unique
  name      String
  thumbnail String?
  createdAt DateTime  @default(now())
  deletedAt DateTime? // null = activo, timestamp = eliminado

  syncStatus SyncStatus?
}
```

### Flujo: Eliminar Canal

```
Usuario elimina canal
         │
         ▼
UPDATE Subscription
SET deletedAt = NOW()
         │
         ▼
- Videos: Se mantienen (no aparecen en feed)
- Notas: Se mantienen
- Watched: Se mantienen
- No se incluye en syncs futuros
```

### Flujo: Agregar Canal

```
Usuario agrega canal (URL)
         │
         ▼
Buscar en DB por channelId
(incluyendo eliminados)
         │
    ┌────┴────┐
    │         │
    ▼         ▼
 Existe    No existe
    │         │
    ▼         ▼
┌─────────┐ ┌─────────────┐
│deletedAt│ │ INSERT      │
│ != null │ │ + Deep Sync │
│    ?    │ │ (500 units) │
└────┬────┘ └─────────────┘
     │
  ┌──┴──┐
  │     │
  ▼     ▼
 Sí    No
  │     │
  ▼     ▼
Reactivar   Error:
(deletedAt  "Ya estás
 = null)    suscrito"
(0 units)
```

### Queries Actualizadas

```typescript
// Solo canales activos (para feed, sync, etc.)
const activeSubscriptions = await prisma.subscription.findMany({
  where: { deletedAt: null }
})

// Agregar canal (con reactivación automática)
async function addSubscription(url: string) {
  const channelInfo = await getChannelInfo(url)

  // Buscar si existe (incluyendo eliminados)
  const existing = await prisma.subscription.findUnique({
    where: { channelId: channelInfo.channelId }
  })

  if (existing) {
    if (existing.deletedAt) {
      // Reactivar canal eliminado
      await prisma.subscription.update({
        where: { channelId: channelInfo.channelId },
        data: { deletedAt: null }
      })
      return { reactivated: true }
    } else {
      // Ya está activo
      throw new Error("Ya estás suscrito a este canal")
    }
  }

  // Crear nuevo + Deep Sync
  await prisma.subscription.create({ ... })
  await deepSync(channelInfo.channelId)
  return { created: true }
}
```

### Videos de Canales Eliminados

```typescript
// Feed: solo videos de canales activos
const videos = await prisma.video.findMany({
  where: {
    channelId: {
      in: await getActiveChannelIds() // Solo donde deletedAt = null
    }
  }
})
```

**Nota:** Los videos permanecen en la DB pero no aparecen en el feed ni en búsquedas.

---

## Actualización de Datos del Canal

### Problema

Los canales de YouTube pueden cambiar su nombre o foto de perfil en cualquier momento.

```
Canal cambia de "Theo - t3.gg" a "Theo Browne"
         │
         ▼
En tu DB quedan datos desactualizados:
- Subscription.name
- Video.channelName (todos los videos)
- Notification.channelName
- WatchLater.channelName
```

### Solución

Detectar y actualizar cambios durante el Sync Normal (cada 24h).

```
Sync Normal
    │
    ▼
Por cada canal:
    │
    ├─ Obtener datos actuales de YouTube API
    │
    ├─ ¿Cambió nombre o thumbnail?
    │   │
    │   ├─ Sí → Actualizar:
    │   │       - Subscription
    │   │       - Video (batch update)
    │   │       - Notification (batch update)
    │   │       - WatchLater (batch update)
    │   │
    │   └─ No → Continuar
    │
    └─ Sync de videos...
```

### Implementación

```typescript
async function syncChannel(channelId: string) {
  // Datos actuales de YouTube
  const channelData = await getChannelFromYouTube(channelId)

  // Datos guardados
  const subscription = await prisma.subscription.findUnique({
    where: { channelId }
  })

  // Detectar cambios
  const nameChanged = subscription.name !== channelData.name
  const thumbChanged = subscription.thumbnail !== channelData.thumbnail

  if (nameChanged || thumbChanged) {
    // Actualizar Subscription
    await prisma.subscription.update({
      where: { channelId },
      data: {
        name: channelData.name,
        thumbnail: channelData.thumbnail
      }
    })

    // Batch update si cambió el nombre
    if (nameChanged) {
      await prisma.video.updateMany({
        where: { channelId },
        data: { channelName: channelData.name }
      })

      await prisma.notification.updateMany({
        where: { channelId },
        data: { channelName: channelData.name }
      })

      await prisma.watchLater.updateMany({
        where: { channelId },
        data: { channelName: channelData.name }
      })
    }
  }

  // Continuar con sync de videos...
}
```

### Tablas Afectadas

| Tabla | Campo | Actualiza |
|-------|-------|-----------|
| Subscription | name, thumbnail | Siempre si hay cambio |
| Video | channelName | Solo si nombre cambió |
| Notification | channelName | Solo si nombre cambió |
| WatchLater | channelName | Solo si nombre cambió |

### Costo Extra

**0 unidades** - Ya obtenemos los datos del canal en el sync.

### Performance

```
Batch update de 1,000 videos: ~50ms
SQLite maneja esto sin problema.
```

---

## Notas Adicionales

### Manejo de Errores

- Si un canal falla durante sync, se marca con `status: "error"`
- Los canales con error se saltan en el siguiente sync
- El usuario puede ver qué canales tienen problemas

### Datos de YouTube que NO guardamos

- Comentarios (no los necesitamos)
- Subtítulos (muy pesados)
- Información del uploader más allá del nombre

### Consideraciones de Almacenamiento

- ~1KB por video en promedio
- 10,000 videos ≈ 10MB
- SQLite maneja esto sin problemas

---

## Fase 3: Categorías y Tags

### Categorías de Canales

Permite al usuario organizar sus canales en categorías personalizadas.

#### Reglas

- Un canal solo puede tener **una categoría** (o ninguna)
- Las categorías son creadas por el usuario
- Se puede filtrar el feed por categoría

#### Modelo

```prisma
model Category {
  id        Int            @id @default(autoincrement())
  name      String         @unique
  color     String?        // Color hex para UI (ej: "#3B82F6")
  createdAt DateTime       @default(now())

  subscriptions Subscription[]
}

model Subscription {
  // ... campos existentes ...

  // Categoría (opcional)
  categoryId Int?
  category   Category? @relation(fields: [categoryId], references: [id])
}
```

#### Ejemplo de Uso

```
Categorías del usuario:
├─ Programación (azul)
│   ├─ Theo - t3.gg
│   ├─ Fireship
│   └─ Midudev
├─ Productividad (verde)
│   └─ Ali Abdaal
└─ Sin categoría
    └─ Canal Random
```

#### UI - Filtro en Feed

```
┌─────────────────────────────────────────────────────────┐
│  Your Feed                                              │
│                                                         │
│  [Todos] [Programación] [Productividad] [Sin categoría] │
│     ↑         ↑              ↑                          │
│  Activo    Click para     Click para                    │
│            filtrar        filtrar                       │
└─────────────────────────────────────────────────────────┘
```

#### UI - Gestión de Categorías

```
/subscriptions

┌─────────────────────────────────────────────────────────┐
│  Mis Suscripciones                    [+ Nueva Categoría]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Programación (3)                              [Editar] │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📷 Theo - t3.gg              [Cambiar categoría]│   │
│  │ 📷 Fireship                  [Cambiar categoría]│   │
│  │ 📷 Midudev                   [Cambiar categoría]│   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Productividad (1)                             [Editar] │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📷 Ali Abdaal                [Cambiar categoría]│   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Sin categoría (2)                                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📷 Canal X                   [Asignar categoría]│   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

### Tags de Videos

Los videos de YouTube ya incluyen tags. Se guardan durante el sync.

#### Datos de YouTube

```json
{
  "videoId": "abc123",
  "title": "Next.js 15 Tutorial",
  "tags": ["nextjs", "react", "typescript", "tutorial", "web development"]
}
```

#### Almacenamiento

```prisma
model Video {
  // ... otros campos
  tags String?  // Guardado como: "nextjs,react,typescript,tutorial"
}
```

#### Usos Posibles

| Uso | Descripción |
|-----|-------------|
| **Filtrar** | Mostrar videos con tag específico |
| **Buscar** | Buscar "react" encuentra videos con ese tag |
| **Nube de tags** | Mostrar tags más frecuentes |
| **Relacionados** | Videos con tags similares |

#### UI - Búsqueda por Tag

```
┌─────────────────────────────────────────────────────────┐
│  🔍 Buscar: [typescript          ]                      │
│                                                         │
│  Tags populares: [react] [nextjs] [tutorial] [css]      │
│                                                         │
│  Resultados (45 videos con "typescript"):               │
│  ┌─────┐ ┌─────┐ ┌─────┐                               │
│  │Video│ │Video│ │Video│                               │
│  └─────┘ └─────┘ └─────┘                               │
└─────────────────────────────────────────────────────────┘
```

#### Query de Búsqueda

```typescript
// Buscar videos por tag
async function searchByTag(tag: string) {
  return prisma.video.findMany({
    where: {
      tags: { contains: tag },
      channelId: { in: activeChannelIds }
    },
    orderBy: { publishedAt: "desc" }
  })
}

// Tags más usados
async function getPopularTags(limit = 10) {
  const videos = await prisma.video.findMany({
    select: { tags: true },
    where: { tags: { not: null } }
  })

  const tagCount = new Map<string, number>()
  for (const video of videos) {
    const tags = video.tags?.split(",") || []
    for (const tag of tags) {
      tagCount.set(tag, (tagCount.get(tag) || 0) + 1)
    }
  }

  return [...tagCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
}
```

---

### Resumen Fase 3

| Feature | Complejidad | Valor |
|---------|-------------|-------|
| Categorías CRUD | Media | Organización personal |
| Filtro por categoría | Baja | Encontrar contenido rápido |
| Búsqueda por tags | Baja | Descubrir videos relacionados |
| Tags populares | Baja | Explorar tu contenido |

---

## Fase 4: Likes y Dislikes

### Resumen

Sistema de reacciones para calificar videos vistos. Permite al usuario dar like o dislike a videos, filtrarlos, y configurar si ocultar los dislikes del feed.

### Modelos

```prisma
model VideoReaction {
  id        Int      @id @default(autoincrement())
  videoId   String   @unique  // Un video = una reacción
  type      String   // "like" | "dislike"
  createdAt DateTime @default(now())

  @@index([type])
}

model Settings {
  id                    Int     @id @default(autoincrement())
  hideDislikedFromFeed  Boolean @default(true)  // Ocultar videos con dislike del feed
  // Agregar más settings en el futuro aquí
}
```

### Flujo de Reacción

```
Usuario ve video
       │
       ▼
┌─────────────────────────────┐
│  [👍 Like]  [👎 Dislike]    │
└─────────────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Click en Like:              │
│ ├─ No existe → Crear like   │
│ ├─ Ya es like → Quitar      │
│ └─ Es dislike → Cambiar     │
└─────────────────────────────┘
```

### UI - En Video Player

```
┌─────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │              VIDEO PLAYER                       │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Next.js 15 Tutorial                                    │
│  Theo - t3.gg · 15:33 · hace 2 días                    │
│                                                         │
│  [👍 Like]  [👎 Dislike]  [🕐 Watch Later]  [✓ Watched] │
│     ↑           ↑                                       │
│   Activo      Inactivo                                  │
│  (azul)       (gris)                                    │
└─────────────────────────────────────────────────────────┘
```

### UI - Indicador en VideoCard

```
┌─────────────────────────────┐
│ ┌─────────────────────────┐ │
│ │      THUMBNAIL     👍   │ │  ← Indicador si le diste like
│ │                   15:33 │ │
│ └─────────────────────────┘ │
│ Título del Video            │
│ Canal · hace 2 días         │
└─────────────────────────────┘
```

### Página /liked

```
┌─────────────────────────────────────────────────────────┐
│  Videos que te gustaron (47)                            │
│                                                         │
│  ┌─────┐ ┌─────┐ ┌─────┐                               │
│  │Video│ │Video│ │Video│                               │
│  │ 👍  │ │ 👍  │ │ 👍  │                               │
│  └─────┘ └─────┘ └─────┘                               │
│                                                         │
│              [Cargar más]                               │
└─────────────────────────────────────────────────────────┘
```

### Settings - Configuración

```
/settings

┌─────────────────────────────────────────────────────────┐
│  Configuración                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Feed                                                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Ocultar videos con dislike del feed             │   │
│  │                                          [✓ On] │   │
│  │                                                 │   │
│  │ Los videos a los que les diste 👎 no            │   │
│  │ aparecerán en tu feed principal.                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Server Actions

```typescript
// actions/reactions.ts

async function toggleReaction(videoId: string, type: "like" | "dislike") {
  const existing = await prisma.videoReaction.findUnique({
    where: { videoId }
  })

  if (!existing) {
    // Crear nueva reacción
    await prisma.videoReaction.create({
      data: { videoId, type }
    })
    return { action: "created", type }
  }

  if (existing.type === type) {
    // Quitar reacción (toggle off)
    await prisma.videoReaction.delete({
      where: { videoId }
    })
    return { action: "removed" }
  }

  // Cambiar tipo (like → dislike o viceversa)
  await prisma.videoReaction.update({
    where: { videoId },
    data: { type }
  })
  return { action: "changed", type }
}

async function getReaction(videoId: string) {
  return prisma.videoReaction.findUnique({
    where: { videoId }
  })
}

async function getLikedVideoIds(): Promise<string[]> {
  const reactions = await prisma.videoReaction.findMany({
    where: { type: "like" },
    select: { videoId: true }
  })
  return reactions.map(r => r.videoId)
}

async function getDislikedVideoIds(): Promise<string[]> {
  const reactions = await prisma.videoReaction.findMany({
    where: { type: "dislike" },
    select: { videoId: true }
  })
  return reactions.map(r => r.videoId)
}
```

```typescript
// actions/settings.ts

async function getSettings() {
  // Obtener o crear settings por defecto
  let settings = await prisma.settings.findFirst()
  if (!settings) {
    settings = await prisma.settings.create({
      data: { hideDislikedFromFeed: true }
    })
  }
  return settings
}

async function updateSettings(data: { hideDislikedFromFeed?: boolean }) {
  const settings = await getSettings()
  return prisma.settings.update({
    where: { id: settings.id },
    data
  })
}
```

### Filtro en Feed

```typescript
// actions/videos.ts

async function getVideos(filterChannelIds?: string[], page: number = 1) {
  const settings = await getSettings()

  let excludeVideoIds: string[] = []

  if (settings.hideDislikedFromFeed) {
    excludeVideoIds = await getDislikedVideoIds()
  }

  const videos = await prisma.video.findMany({
    where: {
      channelId: { in: activeChannelIds },
      videoId: { notIn: excludeVideoIds }  // Excluir dislikes si está activado
    },
    orderBy: { publishedAt: "desc" },
    skip: (page - 1) * VIDEOS_PER_PAGE,
    take: VIDEOS_PER_PAGE
  })

  // ...
}
```

### Resumen Fase 4

| Feature | Complejidad | Valor |
|---------|-------------|-------|
| Like/Dislike en video | Baja | Calificar contenido |
| Página /liked | Baja | Ver videos favoritos |
| Setting ocultar dislikes | Baja | Personalización |
| Indicador en VideoCard | Baja | Feedback visual |
| Modelo Settings | Baja | Base para más config |

---

## Fase 5: Historial de Videos

### Resumen

Historial completo de videos vistos, similar a YouTube. Registra cada vez que el usuario inicia o ve un video, con timestamp y progreso opcional.

### Diferencia con WatchedVideo Actual

| Actual (WatchedVideo) | Nuevo (WatchHistory) |
|-----------------------|----------------------|
| Solo marca "visto/no visto" | Registra cada visualización |
| Sin timestamp de cuándo | Fecha y hora exacta |
| Sin progreso | Progreso del video (opcional) |
| No permite ver historial | Página de historial |

### Modelo

```prisma
model WatchHistory {
  id          Int      @id @default(autoincrement())
  videoId     String

  // Datos del video (para mostrar sin JOIN)
  title       String
  thumbnail   String
  channelId   String
  channelName String
  duration    Int?     // Duración total en segundos

  // Datos de visualización
  watchedAt   DateTime @default(now())
  progress    Int?     // Segundos vistos (opcional)
  completed   Boolean  @default(false) // Si vio >90%

  @@index([videoId])
  @@index([watchedAt(sort: Desc)])
}
```

**Nota:** Un mismo video puede tener múltiples entradas (cada vez que se ve).

### Flujo

```
Usuario abre video /watch/[id]
         │
         ▼
┌─────────────────────────────┐
│ Crear entrada en WatchHistory │
│ watchedAt: now()              │
│ progress: 0                   │
└─────────────────────────────┘
         │
         ▼
Usuario ve el video...
         │
         ▼
┌─────────────────────────────┐
│ (Opcional) Actualizar progress │
│ cada X segundos               │
└─────────────────────────────┘
         │
         ▼
Usuario cierra/sale
         │
         ▼
┌─────────────────────────────┐
│ Actualizar progress final    │
│ completed: progress > 90%    │
└─────────────────────────────┘
```

### UI - Página /history

```
┌─────────────────────────────────────────────────────────────────┐
│  Historial                        🔍 [Buscar...]  [Limpiar todo]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Hoy                                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📷 │ Next.js 15 Tutorial            │ 15:33 │ hace 2h  │ ✕ │
│  │     │ Theo - t3.gg                  │ ████░░ │          │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📷 │ TypeScript Tips                │ 8:45  │ hace 4h  │ ✕ │
│  │     │ Fireship                      │ ██████ │ Completado│  │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Ayer                                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📷 │ React Server Components        │ 22:10 │ Ayer 8pm │ ✕ │
│  │     │ Midudev                       │ ████░░ │          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Esta semana                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📷 │ CSS Grid Tutorial              │ 18:22 │ Lun 3pm  │ ✕ │
│  │     │ Kevin Powell                  │ ██████ │ Completado│  │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                    [Cargar más]                                 │
└─────────────────────────────────────────────────────────────────┘

████░░ = Barra de progreso (60% visto)
██████ = Completado (100%)
✕ = Eliminar de historial
```

### Agrupación por Tiempo

```typescript
function groupByTime(entries: WatchHistory[]) {
  const now = new Date()
  const today = startOfDay(now)
  const yesterday = subDays(today, 1)
  const weekAgo = subDays(today, 7)
  const monthAgo = subDays(today, 30)

  return {
    today: entries.filter(e => e.watchedAt >= today),
    yesterday: entries.filter(e => e.watchedAt >= yesterday && e.watchedAt < today),
    thisWeek: entries.filter(e => e.watchedAt >= weekAgo && e.watchedAt < yesterday),
    thisMonth: entries.filter(e => e.watchedAt >= monthAgo && e.watchedAt < weekAgo),
    older: entries.filter(e => e.watchedAt < monthAgo)
  }
}
```

### Server Actions

```typescript
// actions/history.ts

// Registrar visualización
async function addToHistory(videoId: string, videoData: {
  title: string
  thumbnail: string
  channelId: string
  channelName: string
  duration?: number
}) {
  return prisma.watchHistory.create({
    data: {
      videoId,
      ...videoData,
      watchedAt: new Date()
    }
  })
}

// Actualizar progreso
async function updateProgress(historyId: number, progress: number, duration: number) {
  const completed = duration > 0 && (progress / duration) >= 0.9

  return prisma.watchHistory.update({
    where: { id: historyId },
    data: { progress, completed }
  })
}

// Obtener historial paginado
async function getHistory(page: number = 1, search?: string) {
  const where = search ? {
    OR: [
      { title: { contains: search } },
      { channelName: { contains: search } }
    ]
  } : {}

  return prisma.watchHistory.findMany({
    where,
    orderBy: { watchedAt: "desc" },
    skip: (page - 1) * 20,
    take: 20
  })
}

// Eliminar entrada específica
async function removeFromHistory(historyId: number) {
  return prisma.watchHistory.delete({
    where: { id: historyId }
  })
}

// Limpiar todo el historial
async function clearHistory() {
  return prisma.watchHistory.deleteMany()
}

// Buscar en historial
async function searchHistory(query: string) {
  return prisma.watchHistory.findMany({
    where: {
      OR: [
        { title: { contains: query } },
        { channelName: { contains: query } }
      ]
    },
    orderBy: { watchedAt: "desc" },
    take: 50
  })
}
```

### Progreso del Video (Opcional)

Si quieres tracking de progreso en tiempo real:

```typescript
// En el componente VideoPlayer
useEffect(() => {
  const interval = setInterval(() => {
    if (videoRef.current && historyId) {
      const progress = Math.floor(videoRef.current.currentTime)
      updateProgress(historyId, progress, duration)
    }
  }, 30000) // Actualizar cada 30 segundos

  return () => clearInterval(interval)
}, [historyId, duration])
```

**Nota:** Esto es opcional. Puedes empezar sin progreso y agregarlo después.

### Relación con WatchedVideo

```
WatchedVideo (existente):
├─ Propósito: Marcar video como "visto" (badge en feed)
├─ Solo 1 entrada por video
└─ Se mantiene para el badge

WatchHistory (nuevo):
├─ Propósito: Historial completo de reproducciones
├─ Múltiples entradas por video (cada vez que se ve)
└─ Para página /history
```

Ambos coexisten. `WatchedVideo` para el badge, `WatchHistory` para el historial.

### Resumen Fase 5

| Feature | Complejidad | Valor |
|---------|-------------|-------|
| Registrar cada visualización | Baja | Historial real |
| Página /history | Media | Ver qué has visto |
| Agrupación por tiempo | Baja | Organización |
| Búsqueda en historial | Baja | Encontrar videos |
| Progreso del video | Media | Continuar donde dejaste |
| Limpiar historial | Baja | Privacidad |

---

## Fase 6: Playlists

### Resumen

Sistema de playlists personalizadas para organizar videos en listas temáticas. Similar a YouTube pero con control total del usuario.

### Modelos

```prisma
model Playlist {
  id          Int             @id @default(autoincrement())
  name        String
  description String?
  thumbnail   String?         // Thumbnail del primer video o personalizado
  isPublic    Boolean         @default(false) // Para futuro: compartir
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  videos      PlaylistVideo[]
}

model PlaylistVideo {
  id          Int      @id @default(autoincrement())
  playlistId  Int
  videoId     String
  position    Int      // Orden en la playlist

  // Datos del video (para mostrar sin JOIN)
  title       String
  thumbnail   String
  channelId   String
  channelName String
  duration    Int?

  addedAt     DateTime @default(now())

  playlist    Playlist @relation(fields: [playlistId], references: [id], onDelete: Cascade)

  @@unique([playlistId, videoId]) // Un video solo una vez por playlist
  @@index([playlistId])
  @@index([position])
}
```

### UI - Página /playlists

```
┌─────────────────────────────────────────────────────────────────┐
│  Mis Playlists                              [+ Nueva Playlist]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ┌──────┐                                                │   │
│  │ │ 📷📷 │  Tutoriales React                   12 videos │   │
│  │ │ 📷📷 │  Actualizado hace 2 días                      │   │
│  │ └──────┘                                         [▶️ ✏️ 🗑]│   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ┌──────┐                                                │   │
│  │ │ 📷📷 │  Productividad                       8 videos │   │
│  │ │ 📷📷 │  Actualizado hace 1 semana                    │   │
│  │ └──────┘                                         [▶️ ✏️ 🗑]│   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ┌──────┐                                                │   │
│  │ │ 📷📷 │  Ver después                         3 videos │   │
│  │ │ 📷📷 │  Actualizado hoy                              │   │
│  │ └──────┘                                         [▶️ ✏️ 🗑]│   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

▶️ = Reproducir playlist
✏️ = Editar nombre/descripción
🗑 = Eliminar playlist
```

### UI - Página /playlist/[id]

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Volver                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Tutoriales React                                        │  │
│  │  12 videos · 4h 32m total · Actualizado hace 2 días      │  │
│  │                                                          │  │
│  │  [▶️ Reproducir todo]  [🔀 Aleatorio]  [✏️ Editar]        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. │ 📷 │ React Server Components    │ 22:10 │  ≡  ✕   │  │
│  │     │    │ Midudev                    │       │         │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  2. │ 📷 │ Next.js 15 Tutorial        │ 15:33 │  ≡  ✕   │  │
│  │     │    │ Theo - t3.gg               │       │         │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  3. │ 📷 │ React Hooks Deep Dive      │ 45:20 │  ≡  ✕   │  │
│  │     │    │ Fireship                   │       │         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

≡ = Drag handle para reordenar
✕ = Quitar de playlist
```

### UI - Agregar a Playlist (Modal)

```
Desde la página del video o VideoCard:

┌─────────────────────────────────────────┐
│  Agregar a playlist                  ✕  │
├─────────────────────────────────────────┤
│                                         │
│  ☑ Tutoriales React                     │
│  ☐ Productividad                        │
│  ☐ Ver después                          │
│                                         │
│  ─────────────────────────────────────  │
│  [+ Crear nueva playlist]               │
│                                         │
└─────────────────────────────────────────┘

☑ = Ya está en esta playlist
☐ = No está, click para agregar
```

### UI - Botón en Video

```
┌─────────────────────────────────────────────────────────┐
│  [👍 Like]  [👎 Dislike]  [📁 Playlist]  [🕐 Watch Later]│
│                               │                         │
│                               └─ Abre modal            │
└─────────────────────────────────────────────────────────┘
```

### Reproducción de Playlist

```
/watch/[videoId]?playlist=[playlistId]&index=2

┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │                   VIDEO PLAYER                          │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Next.js 15 Tutorial                                            │
│  Theo - t3.gg                                                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Reproduciendo de: Tutoriales React (2/12)              │   │
│  │  [⏮ Anterior]                          [Siguiente ⏭]    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Siguiente en playlist:                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📷 │ React Hooks Deep Dive │ 45:20 │ Fireship          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Server Actions

```typescript
// actions/playlists.ts

// CRUD Playlists
async function createPlaylist(data: { name: string; description?: string }) {
  return prisma.playlist.create({ data })
}

async function updatePlaylist(id: number, data: { name?: string; description?: string }) {
  return prisma.playlist.update({
    where: { id },
    data: { ...data, updatedAt: new Date() }
  })
}

async function deletePlaylist(id: number) {
  return prisma.playlist.delete({ where: { id } })
}

async function getPlaylists() {
  return prisma.playlist.findMany({
    include: {
      videos: {
        orderBy: { position: "asc" },
        take: 4 // Para mostrar thumbnails preview
      },
      _count: { select: { videos: true } }
    },
    orderBy: { updatedAt: "desc" }
  })
}

async function getPlaylist(id: number) {
  return prisma.playlist.findUnique({
    where: { id },
    include: {
      videos: { orderBy: { position: "asc" } }
    }
  })
}

// Gestión de videos en playlist
async function addToPlaylist(playlistId: number, videoData: {
  videoId: string
  title: string
  thumbnail: string
  channelId: string
  channelName: string
  duration?: number
}) {
  // Obtener última posición
  const lastVideo = await prisma.playlistVideo.findFirst({
    where: { playlistId },
    orderBy: { position: "desc" }
  })
  const position = (lastVideo?.position ?? -1) + 1

  await prisma.playlistVideo.create({
    data: { playlistId, position, ...videoData }
  })

  // Actualizar timestamp de playlist
  await prisma.playlist.update({
    where: { id: playlistId },
    data: { updatedAt: new Date() }
  })
}

async function removeFromPlaylist(playlistId: number, videoId: string) {
  await prisma.playlistVideo.delete({
    where: { playlistId_videoId: { playlistId, videoId } }
  })

  // Re-ordenar posiciones
  const remaining = await prisma.playlistVideo.findMany({
    where: { playlistId },
    orderBy: { position: "asc" }
  })

  for (let i = 0; i < remaining.length; i++) {
    await prisma.playlistVideo.update({
      where: { id: remaining[i].id },
      data: { position: i }
    })
  }
}

async function reorderPlaylist(playlistId: number, videoId: string, newPosition: number) {
  const video = await prisma.playlistVideo.findUnique({
    where: { playlistId_videoId: { playlistId, videoId } }
  })

  if (!video) return

  const oldPosition = video.position

  if (newPosition > oldPosition) {
    // Moviendo hacia abajo
    await prisma.playlistVideo.updateMany({
      where: {
        playlistId,
        position: { gt: oldPosition, lte: newPosition }
      },
      data: { position: { decrement: 1 } }
    })
  } else {
    // Moviendo hacia arriba
    await prisma.playlistVideo.updateMany({
      where: {
        playlistId,
        position: { gte: newPosition, lt: oldPosition }
      },
      data: { position: { increment: 1 } }
    })
  }

  await prisma.playlistVideo.update({
    where: { id: video.id },
    data: { position: newPosition }
  })
}

// Verificar en qué playlists está un video
async function getVideoPlaylists(videoId: string) {
  const entries = await prisma.playlistVideo.findMany({
    where: { videoId },
    select: { playlistId: true }
  })
  return entries.map(e => e.playlistId)
}
```

### Playlist Especial: Watch Later

`Watch Later` ya existe como modelo separado. Opciones:

| Opción | Descripción |
|--------|-------------|
| **A) Mantener separado** | WatchLater sigue siendo su propio modelo |
| **B) Convertir a playlist** | WatchLater se convierte en una playlist especial |

**Recomendación:** A) Mantener separado. Es más simple y WatchLater tiene comportamiento diferente (no se reordena, es temporal).

### Resumen Fase 6

| Feature | Complejidad | Valor |
|---------|-------------|-------|
| CRUD Playlists | Media | Organización |
| Agregar/quitar videos | Baja | Gestión básica |
| Reordenar (drag & drop) | Media | Control del orden |
| Modal "Agregar a playlist" | Media | UX fluida |
| Reproducción continua | Media | Ver playlist completa |
| Página /playlists | Baja | Vista general |
| Página /playlist/[id] | Media | Detalle de playlist |

---

## Fase 7: PWA y Reproducción en Background

### Resumen

Convertir Unfeed en una Progressive Web App (PWA) instalable con soporte para reproducción de audio en segundo plano, permitiendo escuchar videos como podcasts sin mantener la pantalla activa.

### ¿Qué es una PWA?

| Característica | Beneficio |
|----------------|-----------|
| **Instalable** | Icono en home screen, se abre como app nativa |
| **Offline** | Service Worker cachea recursos |
| **Background** | Audio sigue reproduciendo con pantalla apagada |
| **Push Notifications** | Notificar nuevos videos (futuro) |

### Configuración Next.js

#### 1. Instalar next-pwa

```bash
bun add next-pwa
```

#### 2. next.config.ts

```typescript
import withPWA from 'next-pwa'

const config = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})({
  // Tu config existente de Next.js
})

export default config
```

#### 3. manifest.json

```json
// public/manifest.json
{
  "name": "Unfeed",
  "short_name": "Unfeed",
  "description": "YouTube sin distracciones",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f0f0f",
  "theme_color": "#0f0f0f",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

#### 4. Meta tags en layout.tsx

```tsx
// app/layout.tsx
export const metadata = {
  manifest: '/manifest.json',
  themeColor: '#0f0f0f',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Unfeed'
  }
}
```

### Reproducción en Background

#### El Problema

```
YouTube iframe embebido:
├─ El iframe pausa cuando la pantalla se apaga
├─ El iframe pausa cuando cambias de app
└─ No hay forma de evitarlo (restricción de YouTube)
```

#### La Solución

```
Extraer audio del video y reproducirlo con <audio>:
├─ <audio> SÍ reproduce en background
├─ Usar servicio para obtener URL de audio
└─ O usar YouTube IFrame API con workarounds
```

#### Opción A: Solo Audio (Recomendada)

```typescript
// Usar un servicio externo para obtener URL de audio
// Ejemplo: youtube-dl, yt-dlp, o API de terceros

// components/BackgroundPlayer.tsx
"use client"

import { useEffect, useRef, useState } from 'react'

interface BackgroundPlayerProps {
  videoId: string
  title: string
  channelName: string
  thumbnail: string
  onEnded?: () => void
}

export function BackgroundPlayer({
  videoId,
  title,
  channelName,
  thumbnail,
  onEnded
}: BackgroundPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  useEffect(() => {
    // Obtener URL de audio (necesita backend)
    fetchAudioUrl(videoId).then(setAudioUrl)
  }, [videoId])

  useEffect(() => {
    // Media Session API - Controles del sistema
    if ('mediaSession' in navigator && audioUrl) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist: channelName,
        album: 'Unfeed',
        artwork: [
          { src: thumbnail, sizes: '512x512', type: 'image/jpeg' }
        ]
      })

      navigator.mediaSession.setActionHandler('play', () => {
        audioRef.current?.play()
        setIsPlaying(true)
      })

      navigator.mediaSession.setActionHandler('pause', () => {
        audioRef.current?.pause()
        setIsPlaying(false)
      })

      navigator.mediaSession.setActionHandler('seekbackward', () => {
        if (audioRef.current) {
          audioRef.current.currentTime -= 10
        }
      })

      navigator.mediaSession.setActionHandler('seekforward', () => {
        if (audioRef.current) {
          audioRef.current.currentTime += 10
        }
      })
    }
  }, [audioUrl, title, channelName, thumbnail])

  if (!audioUrl) return null

  return (
    <audio
      ref={audioRef}
      src={audioUrl}
      onPlay={() => setIsPlaying(true)}
      onPause={() => setIsPlaying(false)}
      onEnded={onEnded}
    />
  )
}
```

#### Opción B: Workaround con Iframe

```typescript
// Menos confiable pero no requiere backend adicional
// Algunos dispositivos lo permiten, otros no

// Usar YouTube IFrame API con:
// - playsinline=1
// - Mantener un <audio> invisible con silencio para "engañar" al navegador
```

### Media Session API

Permite controlar el audio desde:
- Pantalla de bloqueo
- Centro de control (iOS/Android)
- Notificaciones de media
- Auriculares Bluetooth

```
┌─────────────────────────────────────────┐
│         PANTALLA DE BLOQUEO            │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │        🖼️ THUMBNAIL            │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Next.js 15 Tutorial                    │
│  Theo - t3.gg                          │
│                                         │
│  ━━━━━━━━━━━●━━━━━━━━━━  8:32 / 15:33  │
│                                         │
│      ⏮️  10s    ▶️     10s  ⏭️          │
│                                         │
└─────────────────────────────────────────┘
```

### UI - Modo Solo Audio

```
/watch/[id]

┌─────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │              VIDEO PLAYER                       │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Next.js 15 Tutorial                                    │
│  Theo - t3.gg · 15:33                                  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🎧 Modo Solo Audio                     [Activar]│   │
│  │  Escucha en segundo plano ahorrando datos        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘

Al activar:

┌─────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │           🎧 MODO SOLO AUDIO                   │   │
│  │                                                 │   │
│  │        ┌───────────────────┐                   │   │
│  │        │    🖼️ Thumbnail   │                   │   │
│  │        └───────────────────┘                   │   │
│  │                                                 │   │
│  │     ━━━━━━━━●━━━━━━━━━━  8:32 / 15:33         │   │
│  │                                                 │   │
│  │          ⏮️     ▶️     ⏭️                      │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Volver a video]                                       │
│                                                         │
│  Puedes cerrar la pantalla. El audio seguirá.          │
└─────────────────────────────────────────────────────────┘
```

### Mini Player Flotante

Para navegar mientras escuchas:

```
┌─────────────────────────────────────────────────────────┐
│  Unfeed                              🔔 (3)             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Your Feed                                              │
│                                                         │
│  ┌─────┐ ┌─────┐ ┌─────┐                               │
│  │Video│ │Video│ │Video│                               │
│  └─────┘ └─────┘ └─────┘                               │
│                                                         │
│  ┌─────┐ ┌─────┐ ┌─────┐                               │
│  │Video│ │Video│ │Video│                               │
│  └─────┘ └─────┘ └─────┘                               │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🖼️ │ Next.js 15 Tutorial │ ━━━●━━━ │ ▶️ ✕ │  │  │
│  │    │ Theo                 │         │       │  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

Mini player fijo en la parte inferior mientras navegas
```

### Backend para Audio URL (Opcional)

Para el modo "Solo Audio", necesitas un servicio que extraiga la URL de audio:

```typescript
// api/audio/[videoId]/route.ts
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET(
  request: Request,
  { params }: { params: { videoId: string } }
) {
  const { videoId } = params

  try {
    // Usar yt-dlp para obtener URL de audio
    const { stdout } = await execAsync(
      `yt-dlp -f "bestaudio" -g "https://youtube.com/watch?v=${videoId}"`
    )

    const audioUrl = stdout.trim()

    return Response.json({ audioUrl })
  } catch (error) {
    return Response.json(
      { error: 'Failed to get audio URL' },
      { status: 500 }
    )
  }
}
```

**Nota:** `yt-dlp` debe estar instalado en el VPS.

### Instalación como App

```
En móvil:
├─ iOS Safari: Compartir → Agregar a inicio
├─ Android Chrome: Menú → Instalar app
└─ Desktop: Icono en barra de URL → Instalar

Resultado:
├─ Icono en home screen
├─ Se abre sin barra del navegador
├─ Splash screen con logo
└─ Comportamiento de app nativa
```

### Service Worker - Caché Offline

```javascript
// public/sw.js (generado por next-pwa)

// Cachear:
// - Páginas visitadas
// - Assets estáticos
// - Thumbnails de videos

// NO cachear:
// - Streams de video/audio (muy grandes)
// - API de YouTube

const CACHE_NAME = 'unfeed-v1'
const STATIC_ASSETS = [
  '/',
  '/playlists',
  '/history',
  '/liked',
  '/notifications',
  '/subscriptions'
]
```

### Consideraciones Importantes

| Aspecto | Detalle |
|---------|---------|
| **iOS Safari** | Background audio funciona si el usuario interactúa primero |
| **Android Chrome** | Funciona bien con Media Session API |
| **yt-dlp** | Las URLs de audio expiran, renovar periódicamente |
| **Términos de YouTube** | Extraer audio puede violar ToS (uso personal) |
| **Datos móviles** | Solo audio = ~5MB vs video = ~50MB por video |

### Alternativa Sin Backend

Si no quieres usar yt-dlp:

```typescript
// Usar el iframe de YouTube pero:
// 1. Activar Picture-in-Picture
// 2. Minimizar a PiP y cerrar la pantalla
// Limitación: No funciona en todos los dispositivos
```

### Resumen Fase 7

| Feature | Complejidad | Valor |
|---------|-------------|-------|
| Configurar PWA básica | Baja | Instalable |
| manifest.json + iconos | Baja | Apariencia nativa |
| Media Session API | Media | Controles de sistema |
| Modo Solo Audio | Alta | Background playback |
| Mini Player flotante | Media | Multitasking |
| Backend yt-dlp | Alta | Extracción de audio |
| Caché offline | Baja | Velocidad |

---

## Fase 8: UI con shadcn y Sidebar

### Resumen

Rediseño de la interfaz usando shadcn/ui con un sidebar de navegación colapsable, mejorando la experiencia de usuario y la consistencia visual.

### ¿Qué es shadcn/ui?

| Característica | Beneficio |
|----------------|-----------|
| **Componentes copiables** | No es dependencia, código tuyo |
| **Tailwind CSS** | Ya lo usas, integración perfecta |
| **Accesible** | ARIA compliant |
| **Personalizable** | Modificas directamente el código |
| **Tema oscuro/claro** | Built-in |

### Instalación

```bash
# Inicializar shadcn
bunx shadcn@latest init

# Instalar componentes necesarios
bunx shadcn@latest add button card dialog dropdown-menu
bunx shadcn@latest add sidebar sheet avatar badge tooltip
bunx shadcn@latest add input label switch tabs
```

### Layout con Sidebar

#### Desktop (>1024px)

```
┌──────────────────────────────────────────────────────────────────┐
│  ┌────────────┬─────────────────────────────────────────────────┐│
│  │            │                                                 ││
│  │  SIDEBAR   │              MAIN CONTENT                       ││
│  │            │                                                 ││
│  │  ≡ Unfeed  │  Your Feed                                      ││
│  │            │                                                 ││
│  │  🏠 Feed   │  ┌─────┐ ┌─────┐ ┌─────┐                       ││
│  │  🔔 Notif  │  │Video│ │Video│ │Video│                       ││
│  │  📺 Subs   │  └─────┘ └─────┘ └─────┘                       ││
│  │  ─────────│                                                 ││
│  │  👍 Liked  │  ┌─────┐ ┌─────┐ ┌─────┐                       ││
│  │  🕐 Later  │  │Video│ │Video│ │Video│                       ││
│  │  📜 History│  └─────┘ └─────┘ └─────┘                       ││
│  │  📁 Lists  │                                                 ││
│  │  ─────────│                                                 ││
│  │  ⚙️ Config │                                                 ││
│  │            │                                                 ││
│  │  [<< ]    │                                                 ││
│  └────────────┴─────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘

[<< ] = Botón para colapsar sidebar
```

#### Sidebar Colapsado

```
┌──────────────────────────────────────────────────────────────────┐
│ ┌───┬───────────────────────────────────────────────────────────┐│
│ │   │                                                           ││
│ │ ≡ │              MAIN CONTENT                                 ││
│ │   │                                                           ││
│ │🏠│  Your Feed                                                ││
│ │🔔│                                                           ││
│ │📺│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                         ││
│ │───│  │Video│ │Video│ │Video│ │Video│                         ││
│ │👍│  └─────┘ └─────┘ └─────┘ └─────┘                         ││
│ │🕐│                                                           ││
│ │📜│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                         ││
│ │📁│  │Video│ │Video│ │Video│ │Video│                         ││
│ │───│  └─────┘ └─────┘ └─────┘ └─────┘                         ││
│ │⚙️│                                                           ││
│ │   │                                                           ││
│ │[>>│                                                           ││
│ └───┴───────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘

Solo iconos, más espacio para contenido
```

#### Mobile (<768px)

```
┌─────────────────────────────────────┐
│  ≡  Unfeed               🔔 (3)     │
├─────────────────────────────────────┤
│                                     │
│  Your Feed                          │
│                                     │
│  ┌─────────┐ ┌─────────┐           │
│  │  Video  │ │  Video  │           │
│  └─────────┘ └─────────┘           │
│                                     │
│  ┌─────────┐ ┌─────────┐           │
│  │  Video  │ │  Video  │           │
│  └─────────┘ └─────────┘           │
│                                     │
├─────────────────────────────────────┤
│  🏠    📺    👍    📁    ⚙️        │
│ Feed  Subs  Liked Lists Settings    │
└─────────────────────────────────────┘

≡ = Abre sidebar como Sheet (overlay)
Bottom nav = Navegación principal en móvil
```

### Estructura de Componentes

```
app/
├── layout.tsx          # Root layout con SidebarProvider
├── (main)/
│   ├── layout.tsx      # Layout con Sidebar
│   ├── page.tsx        # Feed
│   ├── notifications/
│   ├── subscriptions/
│   ├── liked/
│   ├── watch-later/
│   ├── history/
│   ├── playlists/
│   └── settings/
└── watch/
    └── [id]/
        └── page.tsx    # Sin sidebar (pantalla completa)

components/
├── ui/                 # Componentes shadcn
│   ├── button.tsx
│   ├── card.tsx
│   ├── sidebar.tsx
│   └── ...
├── app-sidebar.tsx     # Sidebar de la app
├── nav-main.tsx        # Navegación principal
├── nav-secondary.tsx   # Navegación secundaria
├── mobile-nav.tsx      # Bottom nav para móvil
└── ...
```

### Componente AppSidebar

```tsx
// components/app-sidebar.tsx
"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Home,
  Bell,
  Tv,
  ThumbsUp,
  Clock,
  History,
  FolderOpen,
  Settings,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const mainNav = [
  { title: "Feed", url: "/", icon: Home },
  { title: "Notifications", url: "/notifications", icon: Bell, badge: true },
  { title: "Subscriptions", url: "/subscriptions", icon: Tv },
]

const libraryNav = [
  { title: "Liked", url: "/liked", icon: ThumbsUp },
  { title: "Watch Later", url: "/watch-later", icon: Clock },
  { title: "History", url: "/history", icon: History },
  { title: "Playlists", url: "/playlists", icon: FolderOpen },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <span className="font-bold text-xl">Unfeed</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Library</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {libraryNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
```

### Layout Principal

```tsx
// app/(main)/layout.tsx
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileNav } from "@/components/mobile-nav"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header móvil */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 lg:hidden">
          <SidebarTrigger />
          <span className="font-bold">Unfeed</span>
        </header>

        {/* Contenido principal */}
        <main className="flex-1 p-4 pb-20 lg:pb-4">
          {children}
        </main>

        {/* Bottom nav móvil */}
        <MobileNav />
      </SidebarInset>
    </SidebarProvider>
  )
}
```

### Bottom Nav Móvil

```tsx
// components/mobile-nav.tsx
"use client"

import { Home, Tv, ThumbsUp, FolderOpen, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const items = [
  { title: "Feed", url: "/", icon: Home },
  { title: "Subs", url: "/subscriptions", icon: Tv },
  { title: "Liked", url: "/liked", icon: ThumbsUp },
  { title: "Lists", url: "/playlists", icon: FolderOpen },
  { title: "Settings", url: "/settings", icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background lg:hidden">
      <div className="flex h-16 items-center justify-around">
        {items.map((item) => {
          const isActive = pathname === item.url
          return (
            <Link
              key={item.title}
              href={item.url}
              className={cn(
                "flex flex-col items-center gap-1 p-2",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.title}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

### VideoCard con shadcn

```tsx
// components/video-card.tsx
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreVertical, Clock, ThumbsUp, ListPlus } from "lucide-react"

interface VideoCardProps {
  video: {
    videoId: string
    title: string
    thumbnail: string
    channelName: string
    duration: number
    publishedAt: string
  }
  isWatched?: boolean
  hasNote?: boolean
  isLiked?: boolean
}

export function VideoCard({ video, isWatched, hasNote, isLiked }: VideoCardProps) {
  return (
    <Card className="overflow-hidden group">
      <div className="relative aspect-video">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="object-cover w-full h-full"
        />

        {/* Duración */}
        <Badge
          variant="secondary"
          className="absolute bottom-2 right-2 bg-black/80"
        >
          {formatDuration(video.duration)}
        </Badge>

        {/* Indicadores */}
        <div className="absolute top-2 right-2 flex gap-1">
          {isWatched && (
            <Badge variant="secondary" className="bg-green-600">
              Watched
            </Badge>
          )}
          {hasNote && (
            <Badge variant="secondary" className="bg-blue-600">
              📝
            </Badge>
          )}
          {isLiked && (
            <Badge variant="secondary" className="bg-red-600">
              👍
            </Badge>
          )}
        </div>

        {/* Hover overlay con acciones */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="icon" variant="secondary">
            <Clock className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary">
            <ListPlus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CardContent className="p-3">
        <div className="flex gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium line-clamp-2 text-sm">
              {video.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {video.channelName}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatTimeAgo(video.publishedAt)}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Clock className="mr-2 h-4 w-4" />
                Watch Later
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ListPlus className="mr-2 h-4 w-4" />
                Add to Playlist
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ThumbsUp className="mr-2 h-4 w-4" />
                Like
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Tema Claro/Oscuro

```tsx
// components/theme-toggle.tsx
"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
```

### Componentes shadcn a Usar

| Componente | Uso en Unfeed |
|------------|---------------|
| **Sidebar** | Navegación principal |
| **Sheet** | Sidebar en móvil (overlay) |
| **Button** | Todas las acciones |
| **Card** | VideoCard, PlaylistCard |
| **Badge** | Duración, estados, contadores |
| **Dialog** | Modales (agregar a playlist, crear playlist) |
| **DropdownMenu** | Menú de opciones en videos |
| **Avatar** | Thumbnail de canales |
| **Tooltip** | Iconos en sidebar colapsado |
| **Switch** | Settings (toggles) |
| **Input** | Búsqueda, formularios |
| **Tabs** | Filtros en feed |
| **Skeleton** | Loading states |

### Resumen Fase 8

| Feature | Complejidad | Valor |
|---------|-------------|-------|
| Instalar shadcn/ui | Baja | Base de componentes |
| Sidebar colapsable | Media | Navegación mejorada |
| Bottom nav móvil | Baja | UX móvil |
| VideoCard mejorado | Baja | Consistencia visual |
| Tema claro/oscuro | Baja | Preferencias usuario |
| Componentes reutilizables | Media | Mantenibilidad |

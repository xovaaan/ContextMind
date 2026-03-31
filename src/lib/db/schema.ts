import { pgTable, text, integer, boolean, timestamp, jsonb, customType } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Custom vector type for pgvector
const vector = customType<{ data: number[]; driverData: string; config?: { dimensions?: number } }>({
  dataType(config) {
    const dims = config?.dimensions ?? 1536
    return `vector(${dims})`
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`
  },
  fromDriver(value: string): number[] {
    return value.replace(/[\[\]]/g, '').split(',').map(Number)
  },
})

export const workspaces = pgTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ownerId: text('owner_id').notNull(),
  apiKey: text('api_key').notNull().unique(),
  plan: text('plan').notNull().default('free'),
  usageTokens: integer('usage_tokens').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const peers = pgTable('peers', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  peerId: text('peer_id').notNull().references(() => peers.id, { onDelete: 'cascade' }),
  name: text('name'),
  metadata: jsonb('metadata').notNull().default({}),
  isActive: boolean('is_active').notNull().default(true),
  messageCount: integer('message_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  peerId: text('peer_id').notNull().references(() => peers.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  role: text('role').notNull(),
  metadata: jsonb('metadata').notNull().default({}),
  tokenCount: integer('token_count').notNull(),
  sequence: integer('sequence').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const summaries = pgTable('summaries', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  content: text('content').notNull(),
  messageRangeStart: integer('message_range_start'),
  messageRangeEnd: integer('message_range_end'),
  tokenCount: integer('token_count'),
  embedding: vector('embedding', { dimensions: 1536 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const representations = pgTable('representations', {
  id: text('id').primaryKey(),
  peerId: text('peer_id').notNull().references(() => peers.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  value: text('value').notNull(),
  confidence: integer('confidence').notNull().default(0),
  sourceMessageIds: text('source_message_ids').array().notNull().default([]), // Ensure this translates to '{}' in SQL
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const documents = pgTable('documents', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  peerId: text('peer_id').references(() => peers.id, { onDelete: 'set null' }),
  sessionId: text('session_id').references(() => sessions.id, { onDelete: 'set null' }),
  title: text('title'),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Relations
export const workspacesRelations = relations(workspaces, ({ many }) => ({
  peers: many(peers),
  sessions: many(sessions),
  documents: many(documents),
}))

export const peersRelations = relations(peers, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [peers.workspaceId], references: [workspaces.id] }),
  sessions: many(sessions),
  messages: many(messages),
  representations: many(representations),
  documents: many(documents),
}))

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [sessions.workspaceId], references: [workspaces.id] }),
  peer: one(peers, { fields: [sessions.peerId], references: [peers.id] }),
  messages: many(messages),
  summaries: many(summaries),
  documents: many(documents),
}))

export const messagesRelations = relations(messages, ({ one }) => ({
  session: one(sessions, { fields: [messages.sessionId], references: [sessions.id] }),
  peer: one(peers, { fields: [messages.peerId], references: [peers.id] }),
}))

export const summariesRelations = relations(summaries, ({ one }) => ({
  session: one(sessions, { fields: [summaries.sessionId], references: [sessions.id] }),
}))

export const representationsRelations = relations(representations, ({ one }) => ({
  peer: one(peers, { fields: [representations.peerId], references: [peers.id] }),
}))

export const documentsRelations = relations(documents, ({ one }) => ({
  workspace: one(workspaces, { fields: [documents.workspaceId], references: [workspaces.id] }),
  peer: one(peers, { fields: [documents.peerId], references: [peers.id] }),
  session: one(sessions, { fields: [documents.sessionId], references: [sessions.id] }),
}))

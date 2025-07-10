import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  date,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - supports both Replit Auth and local auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  password: varchar("password"), // For local auth only
  role: varchar("role").notNull().default("employee"), // admin, manager, employee
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Store/Group management
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  color: varchar("color").notNull(), // hex color code
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User-Group assignments (many-to-many)
export const userGroups = pgTable("user_groups", {
  userId: varchar("user_id").notNull(),
  groupId: integer("group_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Suppliers
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  contact: varchar("contact"),
  phone: varchar("phone"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull(),
  groupId: integer("group_id").notNull(),
  plannedDate: date("planned_date").notNull(),
  quantity: integer("quantity"), // Optional - will be set when delivery is linked
  unit: varchar("unit"), // Optional - 'palettes' or 'colis'
  status: varchar("status").notNull().default("pending"), // pending, planned, delivered
  comments: text("comments"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Deliveries
export const deliveries = pgTable("deliveries", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id"), // optional link to order
  supplierId: integer("supplier_id").notNull(),
  groupId: integer("group_id").notNull(),
  plannedDate: date("planned_date").notNull(),
  deliveredDate: timestamp("delivered_date"),
  quantity: integer("quantity").notNull(),
  unit: varchar("unit").notNull(), // 'palettes' or 'colis'
  status: varchar("status").notNull().default("planned"), // planned, delivered
  comments: text("comments"),
  // Champs pour le rapprochement BL/Factures
  blNumber: varchar("bl_number"), // Numéro de Bon de Livraison
  blAmount: decimal("bl_amount", { precision: 10, scale: 2 }), // Montant BL
  invoiceReference: varchar("invoice_reference"), // Référence facture
  invoiceAmount: decimal("invoice_amount", { precision: 10, scale: 2 }), // Montant facture
  reconciled: boolean("reconciled").default(false), // Rapprochement effectué
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userGroups: many(userGroups),
  createdOrders: many(orders),
  createdDeliveries: many(deliveries),
}));

export const groupsRelations = relations(groups, ({ many }) => ({
  userGroups: many(userGroups),
  orders: many(orders),
  deliveries: many(deliveries),
}));

export const userGroupsRelations = relations(userGroups, ({ one }) => ({
  user: one(users, {
    fields: [userGroups.userId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [userGroups.groupId],
    references: [groups.id],
  }),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  orders: many(orders),
  deliveries: many(deliveries),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [orders.supplierId],
    references: [suppliers.id],
  }),
  group: one(groups, {
    fields: [orders.groupId],
    references: [groups.id],
  }),
  creator: one(users, {
    fields: [orders.createdBy],
    references: [users.id],
  }),
  deliveries: many(deliveries),
}));

export const deliveriesRelations = relations(deliveries, ({ one }) => ({
  order: one(orders, {
    fields: [deliveries.orderId],
    references: [orders.id],
  }),
  supplier: one(suppliers, {
    fields: [deliveries.supplierId],
    references: [suppliers.id],
  }),
  group: one(groups, {
    fields: [deliveries.groupId],
    references: [groups.id],
  }),
  creator: one(users, {
    fields: [deliveries.createdBy],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeliverySchema = createInsertSchema(deliveries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserGroupSchema = createInsertSchema(userGroups).omit({
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;

export type UserGroup = typeof userGroups.$inferSelect;
export type InsertUserGroup = z.infer<typeof insertUserGroupSchema>;

// Extended types with relations
export type OrderWithRelations = Order & {
  supplier: Supplier;
  group: Group;
  creator: User;
  deliveries?: Delivery[];
};

export type DeliveryWithRelations = Delivery & {
  supplier: Supplier;
  group: Group;
  creator: User;
  order?: Order | null;
};

export type UserWithGroups = User & {
  userGroups: (UserGroup & { group: Group })[];
};

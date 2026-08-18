import { defineSchema, defineTable } from "convex/server";
import {
  cajaCierreValidator,
  clientValidator,
  paymentValidator,
  productValidator,
  purchaseValidator,
  returnValidator,
  saleValidator,
  settingsValidator,
} from "./lib";

export default defineSchema({
  products: defineTable(productValidator).index("by_app_id", ["id"]),
  clients: defineTable(clientValidator).index("by_app_id", ["id"]),
  sales: defineTable(saleValidator)
    .index("by_app_id", ["id"])
    .index("by_clientId", ["clientId"]),
  payments: defineTable(paymentValidator)
    .index("by_app_id", ["id"])
    .index("by_clientId", ["clientId"]),
  purchases: defineTable(purchaseValidator).index("by_app_id", ["id"]),
  returns: defineTable(returnValidator).index("by_app_id", ["id"]),
  cajaCierres: defineTable(cajaCierreValidator).index("by_app_id", ["id"]),
  settings: defineTable(settingsValidator),
});

ALTER TABLE `inventory_items` ADD `costPrice` decimal(12,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `inventory_items` ADD `salePrice` decimal(12,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `order_items` ADD `unitPrice` decimal(12,2) DEFAULT '0.00' NOT NULL;
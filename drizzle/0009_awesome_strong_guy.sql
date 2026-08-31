CREATE TABLE `inventory_movements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inventoryItemId` int NOT NULL,
	`productId` varchar(180) NOT NULL,
	`sku` varchar(100) NOT NULL,
	`name` text NOT NULL,
	`movementType` enum('sale') NOT NULL DEFAULT 'sale',
	`quantity` int NOT NULL,
	`source` varchar(40) NOT NULL DEFAULT 'manual',
	`orderId` int,
	`movedBy` varchar(40) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_movements_id` PRIMARY KEY(`id`)
);

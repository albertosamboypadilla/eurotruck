CREATE TABLE `inventory_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` varchar(180) NOT NULL,
	`sku` varchar(100) NOT NULL,
	`name` text NOT NULL,
	`brand` varchar(120),
	`application` varchar(120),
	`image` text,
	`totalQuantity` int NOT NULL DEFAULT 0,
	`lastTramo` varchar(80),
	`lastGondola` varchar(80),
	`countedBy` varchar(40) NOT NULL,
	`lastCountedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_items_productId_unique` UNIQUE(`productId`)
);
--> statement-breakpoint
CREATE TABLE `inventory_scans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inventoryItemId` int NOT NULL,
	`quantity` int NOT NULL,
	`tramo` varchar(80) NOT NULL,
	`gondola` varchar(80) NOT NULL,
	`countedBy` varchar(40) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_scans_id` PRIMARY KEY(`id`)
);

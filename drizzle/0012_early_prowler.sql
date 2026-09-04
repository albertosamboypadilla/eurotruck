CREATE TABLE `inventory_gtins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` varchar(180) NOT NULL,
	`sku` varchar(100) NOT NULL,
	`gtin` varchar(20) NOT NULL,
	`addedBy` varchar(40) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_gtins_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_gtins_gtin_unique` UNIQUE(`gtin`)
);

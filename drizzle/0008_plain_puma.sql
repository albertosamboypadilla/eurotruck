ALTER TABLE `orders` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `deletedBy` varchar(40);
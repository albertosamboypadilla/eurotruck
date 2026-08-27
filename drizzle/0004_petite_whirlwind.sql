ALTER TABLE `orders` MODIFY COLUMN `status` enum('new','taken','closed') NOT NULL DEFAULT 'new';--> statement-breakpoint
ALTER TABLE `orders` ADD `assignedAdmin` varchar(40);--> statement-breakpoint
ALTER TABLE `orders` ADD `assignedAt` timestamp;
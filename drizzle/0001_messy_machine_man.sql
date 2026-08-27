CREATE TABLE `local_admins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(40) NOT NULL,
	`passwordHash` varchar(128) NOT NULL,
	`passwordSalt` varchar(64) NOT NULL,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `local_admins_id` PRIMARY KEY(`id`),
	CONSTRAINT `local_admins_username_unique` UNIQUE(`username`)
);

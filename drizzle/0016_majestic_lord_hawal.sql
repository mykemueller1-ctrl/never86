CREATE TABLE `schedule_weeks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weekStart` timestamp NOT NULL,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`publishedAt` timestamp,
	`publishedBy` int,
	`totalScheduledHours` decimal(8,2),
	`projectedLaborCost` decimal(10,2),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `schedule_weeks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shift_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`dayOfWeek` int NOT NULL,
	`staffId` int NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`position` varchar(50),
	`department` enum('bar','dining_room','kitchen_line','pizza_side','driver','dishwasher','management'),
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shift_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `schedule_shifts` ADD `published` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `staff` ADD `hourlyRate` decimal(6,2);--> statement-breakpoint
ALTER TABLE `staff` ADD `maxHoursPerWeek` int DEFAULT 40;
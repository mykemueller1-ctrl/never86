CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`originalQty` decimal(10,2) DEFAULT '0',
	`suggestedQty` decimal(10,2),
	`finalQty` decimal(10,2),
	`lastWeekQty` decimal(10,2),
	`lineCost` decimal(10,2),
	`priority` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`category` enum('liquor','beer','wine','mixer','soda','other') NOT NULL,
	`subcategory` varchar(100),
	`vendor` varchar(200),
	`unitSize` varchar(50),
	`costPerUnit` decimal(10,2) NOT NULL,
	`parLevel` decimal(10,2),
	`currentStock` decimal(10,2),
	`posNumber` varchar(20),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `order_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weekOf` timestamp NOT NULL,
	`orderType` enum('liquor','beer','combined') NOT NULL,
	`budget` decimal(10,2) NOT NULL,
	`originalTotal` decimal(10,2),
	`optimizedTotal` decimal(10,2),
	`savings` decimal(10,2),
	`status` enum('draft','optimized','submitted','received') NOT NULL DEFAULT 'draft',
	`submittedById` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);

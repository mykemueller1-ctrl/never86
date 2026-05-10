CREATE TABLE `webauthn_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffId` int NOT NULL,
	`credentialId` text NOT NULL,
	`publicKey` text NOT NULL,
	`counter` int NOT NULL DEFAULT 0,
	`deviceName` varchar(100),
	`transports` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastUsedAt` timestamp,
	CONSTRAINT `webauthn_credentials_id` PRIMARY KEY(`id`)
);

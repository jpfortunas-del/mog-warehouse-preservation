CREATE TABLE `unit_plan_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inventory_unit_id` int NOT NULL,
	`plan_id` int NOT NULL,
	`source` enum('auto','manual') NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`changed_by` varchar(255),
	`changed_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `unit_plan_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `unit_plan_assignments` ADD CONSTRAINT `upa_unit_fk` FOREIGN KEY (`inventory_unit_id`) REFERENCES `inventory_units`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `unit_plan_assignments` ADD CONSTRAINT `upa_plan_fk` FOREIGN KEY (`plan_id`) REFERENCES `maintenance_plans`(`id`) ON DELETE no action ON UPDATE no action;
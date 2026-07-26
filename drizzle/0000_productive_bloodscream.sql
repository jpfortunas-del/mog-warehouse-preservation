CREATE TABLE `equipment_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(100) NOT NULL,
	`preservable` boolean NOT NULL DEFAULT false,
	`description` text,
	`active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `equipment_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `equipment_types_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `inventory_units` (
	`id` int AUTO_INCREMENT NOT NULL,
	`material_id` int NOT NULL,
	`serial` varchar(255) NOT NULL,
	`status` enum('available','reserved','consumed') NOT NULL DEFAULT 'available',
	`location` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_units_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_units_serial_unique` UNIQUE(`serial`)
);
--> statement-breakpoint
CREATE TABLE `maintenance_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`equipment_type_id` int NOT NULL,
	`preservation_procedure_id` int NOT NULL,
	`interval` int NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `maintenance_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`material_id` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`quantity` int NOT NULL DEFAULT 0,
	`equipment_type_id` int NOT NULL,
	`preservable` boolean NOT NULL DEFAULT false,
	`active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `materials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `preservation_procedures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`checklist` json,
	`description` text,
	`equipment_type_id` int NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `preservation_procedures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `work_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plan_id` int NOT NULL,
	`inventory_unit_id` int NOT NULL,
	`status` enum('open','in_progress','completed') NOT NULL DEFAULT 'open',
	`checklist_result` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`closed_at` timestamp,
	CONSTRAINT `work_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `inventory_units` ADD CONSTRAINT `inventory_units_material_id_materials_id_fk` FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `maintenance_plans` ADD CONSTRAINT `maintenance_plans_equipment_type_id_equipment_types_id_fk` FOREIGN KEY (`equipment_type_id`) REFERENCES `equipment_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `maintenance_plans` ADD CONSTRAINT `maintenance_plans_procedure_fk` FOREIGN KEY (`preservation_procedure_id`) REFERENCES `preservation_procedures`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materials` ADD CONSTRAINT `materials_equipment_type_id_equipment_types_id_fk` FOREIGN KEY (`equipment_type_id`) REFERENCES `equipment_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `preservation_procedures` ADD CONSTRAINT `preservation_procedures_equipment_type_id_equipment_types_id_fk` FOREIGN KEY (`equipment_type_id`) REFERENCES `equipment_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `work_orders` ADD CONSTRAINT `work_orders_plan_id_maintenance_plans_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `maintenance_plans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `work_orders` ADD CONSTRAINT `work_orders_inventory_unit_id_inventory_units_id_fk` FOREIGN KEY (`inventory_unit_id`) REFERENCES `inventory_units`(`id`) ON DELETE no action ON UPDATE no action;
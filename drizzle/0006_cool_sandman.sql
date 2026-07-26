ALTER TABLE `work_orders` MODIFY COLUMN `status` enum('open','in_progress','completed','cancelled') NOT NULL DEFAULT 'open';--> statement-breakpoint
ALTER TABLE `work_orders` ADD `scheduled_date` date;--> statement-breakpoint
ALTER TABLE `work_orders` ADD `comments` text;--> statement-breakpoint
ALTER TABLE `work_orders` ADD `cancel_reason` text;
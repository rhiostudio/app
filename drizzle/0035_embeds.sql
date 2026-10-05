-- A chat with an agent that its creator places on their own website (lib/embed.ts). Additive only.
--
-- embeds: one embedded chat. The page /embed/<id> shows it inside a frame on the creator's site; visitors need no
--   account, and each answer is a chat message paid from the credits of the account that made the embed.
--   embeds.id      the public id in the frame's address (16 random URL-safe characters)
--   embeds.origin  the one site that may show it (scheme and host, e.g. https://example.com)
--   embeds.daily   answers per UTC day: what the owner spends there at most
--   embeds.day / embeds.used   the day being counted and how many answers it has had
-- embed_hits: answers per visitor and day, so one visitor cannot use up the day's answers. `visitor` is a keyed
--   hash of the embed, the day and the network address; the address itself is not stored.
CREATE TABLE `embeds` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`agent_id` text NOT NULL,
	`origin` text NOT NULL,
	`daily` integer DEFAULT 50 NOT NULL,
	`day` text,
	`used` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `embeds_owner` ON `embeds` (`owner`);
--> statement-breakpoint
CREATE TABLE `embed_hits` (
	`embed_id` text NOT NULL,
	`visitor` text NOT NULL,
	`day` text NOT NULL,
	`used` integer DEFAULT 0 NOT NULL,
	`last` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`embed_id`, `visitor`, `day`)
);

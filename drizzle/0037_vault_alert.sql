-- Reward vault alerts for the team (lib/vault-alert.ts). Additive only.
--
-- notify_channels.vault_alert  1: this delivery channel gets a message when the reward vault runs low, when hourly
--                              periods start waiting for a refill, and when it is fine again. Only an account of the
--                              team can switch it on (lib/creators.ts isCreatorAdmin). What was last told is kept in
--                              notify_state under 'vault:alert'.
ALTER TABLE `notify_channels` ADD `vault_alert` integer DEFAULT 0 NOT NULL;

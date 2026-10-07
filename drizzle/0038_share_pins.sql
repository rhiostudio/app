-- Pinned answers on an agent's page (lib/share.ts). Additive only.
--
-- run_shares.pinned  1: this shared answer is shown on the public page of the agent that gave it, under "How it
--                    answers". Only a creator's own chat message to their own agent can be pinned, at most three per
--                    agent. Unpinning sets it back to 0 and leaves the shared page; taking the share down removes both.
ALTER TABLE `run_shares` ADD `pinned` integer DEFAULT 0 NOT NULL;

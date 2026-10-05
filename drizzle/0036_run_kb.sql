-- What a run did with its agent's sources (lib/knowledge.ts, lib/insights.ts). Additive only.
--
-- runs.kb: NULL  the agent had no sources, or the run does not read them (a workflow sample, a web search, the check)
--          1     passages were given and the AI said it used at least one
--          2     passages were given and the AI said it used none
--          3     the agent has sources, and none of their passages shared words with the message
-- The creator's insights count 2 and 3 as "not covered by the sources". Runs made before this column stay NULL.
ALTER TABLE `runs` ADD `kb` integer;

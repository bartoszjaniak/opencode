/**
 * Per-Agent Cache Key Plugin
 *
 * Ustawia `x-prompt-cache-key` dla każdego subagenta, dzięki czemu prompt caching
 * nie jest tracony przy przełączaniu między agentami (np. gandalf → legolas → gimli).
 *
 * Klucz: `agent-{name}-{hash}` — hash liczy się z plików promptu agenta, więc
 * EDYCJA PROMPTU AUTOMATYCZNIE UNIEWAŻNIA CACHE. Bez tego składnika provider
 * potrafi serwować zcache'owaną, nieaktualną wersję system promptu (agent
 * zachowuje się zgodnie ze starą instrukcją, mimo że plik został zmieniony).
 *
 * Wymaga: włączenia `setCacheKey: true` w konfiguracji providera OpenRouter.
 *
 * @see https://opencode.ai/docs/plugins
 */

import { createHash } from 'crypto';
import { readFileSync, statSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const configDir = join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'opencode');

/** Ścieżki, w których może leżeć prompt agenta (globalne i projektowe). */
function promptPaths(agent) {
  return [
    join(configDir, 'agents', `${agent}.md`),
    join(configDir, 'agent', `${agent}.md`),
    join(configDir, 'prompts', `${agent}.md`),
    join(process.cwd(), '.opencode', 'agents', `${agent}.md`),
    join(process.cwd(), '.opencode', 'agent', `${agent}.md`),
  ];
}

// Hash per plik, przeliczany tylko gdy zmieni się mtime lub rozmiar.
const memo = new Map();

function promptHash(agent) {
  const parts = [];
  for (const path of promptPaths(agent)) {
    try {
      const stat = statSync(path);
      const cached = memo.get(path);
      if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) {
        parts.push(cached.hash);
        continue;
      }
      const hash = createHash('sha1').update(readFileSync(path)).digest('hex').slice(0, 8);
      memo.set(path, { mtimeMs: stat.mtimeMs, size: stat.size, hash });
      parts.push(hash);
    } catch (error) {
      // brak pliku w tej lokalizacji — pomijamy
    }
  }
  return parts.length ? parts.join('') : 'nofile';
}

/** @type {import('@opencode-ai/plugin').Plugin} */
export default async function perAgentCachePlugin() {
  return {
    /**
     * Hook wywoływany przed każdym requestem do modelu LLM.
     * Ustawia nagłówek cache key na podstawie nazwy agenta i treści jego promptu.
     */
    'chat.headers': async (input, output) => {
      const agent = input?.agent;

      // Zabezpieczenie: jeśli agent jest undefined, nie psuj requestu
      if (!agent) {
        return;
      }

      output.headers['x-prompt-cache-key'] = `agent-${agent}-${promptHash(agent)}`;
    },
  };
}

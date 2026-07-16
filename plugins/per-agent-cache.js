/**
 * Per-Agent Cache Key Plugin
 *
 * Ustawia unikalny `x-prompt-cache-key` dla każdego subagenta,
 * dzięki czemu prompt caching nie jest tracony przy przełączaniu
 * między agentami (np. gandalf → legolas → gimli).
 *
 * Wymaga: włączenia `setCacheKey: true` w konfiguracji providera OpenRouter.
 *
 * @see https://opencode.ai/docs/plugins
 */

/** @type {import('@opencode-ai/plugin').Plugin} */
export default async function perAgentCachePlugin() {
  return {
    /**
     * Hook wywoływany przed każdym requestem do modelu LLM.
     * Ustawia nagłówek cache key na podstawie nazwy agenta.
     *
     * Klucz: agent-{name}
     * Dzięki stałemu kluczowi na agenta, sekwencyjne wywołania tego samego
     * subagenta (np. najpierw recenzja Gandalfa, potem inna recenzja Gandalfa)
     * trafiają w ten sam cache, bo system prompt agenta jest identyczny.
     */
    "chat.headers": async (input, output) => {
      const agent = input?.agent;

      // Zabezpieczenie: jeśli agent jest undefined, nie psuj requestu
      if (!agent) {
        return;
      }

      // OpenRouter używa nagłówka x-prompt-cache-key do cache'owania promptów
      output.headers["x-prompt-cache-key"] = `agent-${agent}`;
    },
  };
}
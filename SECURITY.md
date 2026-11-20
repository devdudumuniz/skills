# Security Policy

## Versões Suportadas

| Versão | Suporte de Segurança |
| ------ | -------------------- |
| 1.0.x  | Ativo                |

## Modelo de Segurança do Repositório

O **Deda Skills** foi projetado para uso público e local seguro:

1. **Zero Segredos no Repositório**: Nenhuma chave de API, senha, token pessoal ou caminho absoluto privado é versionado. Use `.env` (ignorado pelo Git) baseado em `.env.example`.
2. **Isolamento de Chave no Backend**: A variável `GEMINI_API_KEY` é lida exclusivamente pelo servidor Express (`server.ts`) e nunca é exposta ao bundle client-side do Vite.
3. **Execução Local Segura**:
   - Ao rodar em máquina pessoal fora de containers, configure `HOST=127.0.0.1` no `.env` para evitar exposição da API na rede local (LAN/Wi-Fi).
   - O servidor limita payloads JSON (`256kb`), valida os campos de entrada, remove `X-Powered-By`, aplica rate limiting básico nos endpoints `/api/*` e omite stack traces em erros HTTP.
4. **Skills Somente Leitura / Plan-First**: Todas as skills oficiais priorizam descoberta read-only e aprovação humana antes de qualquer alteração destrutiva.

## Reportando Vulnerabilidades

Caso identifique qualquer falha de segurança, exposição indevida ou comportamento inseguro em alguma skill ou rota da plataforma, **não abra uma issue pública com detalhes exploráveis**. Entre em contato diretamente com o mantenedor **Eduardo Muniz** via [GitHub Security Advisories](https://github.com/devdudumuniz/skills/security/advisories).

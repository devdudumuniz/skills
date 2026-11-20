# Escolha de Modelos & Piloto Local (`model-selection.md`)

**Modelo não é agente.** O modelo fornece raciocínio e chamadas estruturadas de ferramenta; o agente nasce da combinação `modelo + perfil + ferramentas + controles de servidor + ciclo de execução`.

## Piloto Local Inicial (`qwen3.5:4b` no Ollama)

- **Quando usar**: prototipação e piloto de **tarefas simples com tool calling** (triagem, extração estruturada, rascunhos internos).
- **Realidade de memória**: o catálogo oficial do Ollama lista aproximadamente **3,3 a 4,0 GB de arquivos de modelo**, mas isso **não é a RAM/VRAM total exigida**. O consumo real depende de:
  - tamanho da janela de contexto (KV cache cresce com contexto longo);
  - quantização escolhida;
  - overhead do runtime e número de requisições concorrentes.
- **Boa prática**: comece com contexto controlado (ex.: `8192` tokens), meça latência e taxa de acerto em chamadas de ferramenta no hardware real antes de expandir.
- **Quando escalar**: planejamento multi-etapa complexo, refatoração de código extensa ou janelas de contexto longas costumam exigir modelos maiores ou roteamento híbrido.

## "Local" Não Garante Offline

Rodar o modelo localmente reduz dependência de inferência externa, mas **não torna toda a operação offline**:
- Canais como WhatsApp, SMS, telefonia, e-mail e webhooks continuam dependendo de rede, provedores terceiros, custos e políticas próprias.
- APIs de CRM, ERP e serviços SaaS exigem conectividade, autenticação e tratamento de falhas de rede.

## Referências

- Catálogo Qwen 3.5 no Ollama: https://ollama.com/library/qwen3.5
- Padrão Agent Skills: https://agentskills.io/

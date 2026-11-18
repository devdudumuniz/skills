# Especificacao de Layout & Bindings Excalidraw v2

## Contrato Semantico de Nos (`ArchitectureNodeSpec`)
- `client`: entrada de usuario/browser (`ellipse`, destaque terracota no escuro / azul-ardosia no claro).
- `gateway`: API Gateway, WAF, Ingress ou Guardrail (`rectangle`, destaque ambar).
- `service`: microsservico ou worker (`rectangle`, borda neutra de alto contraste).
- `database`: PostgreSQL, Vector DB, S3 (`rectangle`, borda verde-cacto).
- `queue`: Kafka, RabbitMQ, SQS (`rectangle`, destaque eventos).
- `cache`: Redis, Memcached (`rectangle`, destaque ambar suave).
- `decision`: bifurcacao condicional (`diamond`, altura minima `120px`).

## Regras de Geometria
- `gridSize`: `20`
- Coluna horizontal: `startX = 80 + layerIndex * 280`
- Alinhamento vertical centralizado entre nos da mesma camada com `rowSpacing = 180`
- `boundElements`: obrigatorio listar todos os `text` e `arrow` conectados ao no.

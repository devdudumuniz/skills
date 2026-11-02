"""statuskit — painel de acompanhamento de status para qualquer projeto.

Princípio: o plano vem de status/backlog.yaml; o que ACONTECEU vem de status/events.jsonl (encadeado por hash);
o painel só apresenta a derivação. Ninguém edita status à mão.
"""
from .common import VERSION  # noqa: F401

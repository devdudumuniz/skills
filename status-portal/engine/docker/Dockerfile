# Painel de status em MODO DEV: a imagem só tem Python e dependências; o projeto entra por bind mount SOMENTE LEITURA.
# Atualização de status/dados aparece sozinha; mudança em .py do motor reinicia o servidor (dev_reload.py).
# Rebuild só quando mudar dependência.
FROM python:3.13-slim-bookworm
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PYTHONIOENCODING=utf-8 STATUS_CONTAINER=1
RUN pip install --no-cache-dir "PyYAML>=6,<7" "reportlab>=4,<6" \
 && groupadd --system status && useradd --system --gid status --home /project status
WORKDIR /project
USER status
EXPOSE 8766
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8766/healthz', timeout=4).status == 200 else 1)"

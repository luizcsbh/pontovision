# Guia de Implantação e DevOps — PontoVision AI

## 1. Ambientes Suportados
- **Local / Bare Metal:** Node.js 20+ e MongoDB 7.0+.
- **Containers:** Docker e Docker Compose.
- **Nuvem:** Kubernetes ou Docker Swarm com suporte a montagem de volume persistente para imagens (`/app/uploads`).

## 2. Implantação com Docker Compose
```bash
# Iniciar todos os serviços (MongoDB, API e Web)
docker-compose up -d --build

# Verificar logs
docker-compose logs -f api
docker-compose logs -f web

# Parar serviços
docker-compose down
```

## 3. Gestão de Volumes e Backups
- O volume `mongodb_data` armazena as coleções de usuários, marcações e auditoria.
- O volume `uploads_data` armazena os arquivos de imagem processados.
- Backups recomendados:
  - Dump do MongoDB: `mongodump --out /backup/mongo-$(date +%F)`
  - Snapshot de imagens: `rsync -av /app/uploads /backup/uploads-$(date +%F)`

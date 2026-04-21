# Unificar Vagas de Empregos

Agregador de vagas que busca em tempo real nas principais plataformas de emprego do Brasil.

## Fontes

| Plataforma | Tipo | Descrição |
|---|---|---|
| **Gupy** | API oficial | Vagas de centenas de empresas brasileiras |
| **Remotive** | API oficial | Vagas remotas globais |
| **Vagas.com.br** | Scraping | Principal portal de empregos do Brasil |
| **Indeed Brasil** | Scraping | Maior buscador de empregos mundial |
| **Trampos.co** | Scraping | Vagas de tecnologia e criativas |

## Funcionalidades

- Busca simultânea em todas as plataformas
- Filtro por plataforma (checkboxes)
- Filtro por tipo de vaga (Remoto / Híbrido / Presencial)
- Filtro por localização
- Paginação de resultados
- Cache de 10 minutos para evitar sobrecarga nas fontes
- Deduplicação automática de vagas repetidas

## Como rodar

### Com Docker (recomendado)

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

### Desenvolvimento local

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Acesse http://localhost:5173
```

## API

### `GET /api/jobs`

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `keyword` | string (obrigatório) | Termo de busca |
| `location` | string | Cidade ou estado |
| `sources` | string | Fontes separadas por vírgula (ex: `gupy,remotive`) |
| `job_type` | string | `Remoto`, `Híbrido` ou `Presencial` |
| `page` | int | Página (padrão: 1) |
| `limit` | int | Itens por página (padrão: 20, máx: 50) |

### `GET /api/sources`

Retorna a lista de fontes disponíveis com nome e cor.

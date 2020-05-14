# resource-queue

Resource distribution queue system api server, using Koa2, PostgreSQL and Docker, created by III.

## Installation

### Getting Started

- Clone the repository

```
git clone --depth=1 https://github.com/iii-bolinli/resource-queue.git <project_name>
```

- Install dependencies

```
cd <project_name>
npm install
```

### Install Typescript

```
npm install -D typescript
```

### Update Database connection settings

- Update ormconfig.json to your environment's setting

```
{
	"type":  "postgres",
	"host":  "localhost",
	"port":  5432,
	"username":  "postgres",
	"password":  "postgres",
	"database":  "mask-dev",
	...
}
```

### Run Docker command

    docker-compose up --build -d

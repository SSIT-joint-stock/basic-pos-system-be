# Application commands
.PHONY: dev debug prod dev-full test test-watch test-cov test-e2e test-users-dev test-users-test test-users-prod format lint

dev:
	npm run start:dev

debug:
	npm run start:debug

prod:
	npm run start:prod

test:
	npm run test

test-watch:
	npm run test:watch

test-cov:
	npm run test:coverage

test-e2e:
	npm run test:e2e

test-users-dev:
	npm run test:users:dev

test-users-test:
	npm run test:users:test

test-users-prod:
	npm run test:users:prod

format:
	npm run format

lint:
	npm run lint

# Tailwind commands
.PHONY: tw-dev tw-build tw-build-dev tw-clean tw-purge

tw-dev:
	npm run tw:dev

tw-build:
	npm run tw:build

tw-build-dev:
	npm run tw:build:dev

tw-clean:
	npm run tw:clean

tw-purge:
	npm run tw:purge

# Full development (NestJS + Tailwind)
dev-full:
	npm run dev:full

# Full build commands (Tailwind + NestJS)
.PHONY: build-full build-full-dev

build-full:
	npm run build:full

build-full-dev:
	npm run build:full:dev

# Docker commands
.PHONY: docker-dev-up docker-dev-down docker-prod-up docker-prod-down

docker-dev-up:
	docker-compose -f docker-compose.dev.yml --env-file .env.development up -d

docker-dev-down:
	docker-compose -f docker-compose.dev.yml --env-file .env.development down

docker-prod-up:
	docker-compose --env-file .env.production up -d

docker-prod-down:
	docker-compose --env-file .env.production down

# Database commands
.PHONY: db-migrate db-studio db-push-dev db-push-test db-push-prod db-seed-dev db-seed-test db-seed-prod db-reset-dev db-reset-force

db-migrate:
	npm run prisma:migrate

db-studio:
	npm run prisma:studio

db-push-dev:
	npm run db:push:dev

db-push-test:
	npm run db:push:test

db-push-prod:
	npm run db:push:prod

db-seed-dev:
	npm run db:seed:dev

db-seed-test:
	npm run db:seed:test

db-seed-prod:
	npm run db:seed:prod

db-reset-dev:
	npm run prisma:migrate:reset:dev

db-reset-force:
	npm run prisma:migrate:reset:force

# Script commands
.PHONY: script-setup-dev script-setup-test script-setup-prod script-clear-dev

script-setup-dev:
	chmod +x ./scripts/setup_dev_env.sh
	./scripts/setup_dev_env.sh

script-setup-test:
	chmod +x ./scripts/setup_test_env.sh
	./scripts/setup_test_env.sh

script-setup-prod:
	chmod +x ./scripts/setup_prod_env.sh
	./scripts/setup_prod_env.sh

script-clear-dev:
	chmod +x ./scripts/clear_dev_env.sh
	./scripts/clear_dev_env.sh

# Combined commands
.PHONY: setup-dev setup-test setup-prod clear-dev

setup-dev:
	$(MAKE) script-setup-dev

setup-test:
	$(MAKE) script-setup-test

setup-prod:
	$(MAKE) script-setup-prod

clear-dev:
	$(MAKE) script-clear-dev

# Help
.PHONY: help

help:
	@echo "Available commands:"
	@echo "  Application:"
	@echo "    make dev         - Run app in development mode"
	@echo "    make debug       - Run app in debug mode"
	@echo "    make prod        - Run app in production mode"
	@echo "    make test        - Run tests"
	@echo "    make test-watch  - Run tests in watch mode"
	@echo "    make test-cov    - Run tests with coverage"
	@echo "    make test-e2e    - Run e2e tests"
	@echo "    make test-users-dev  - Run users module API test in development"
	@echo "    make test-users-test - Run users module API test in test environment"
	@echo "    make test-users-prod - Run users module API test in production"
	@echo "    make format      - Format code"
	@echo "    make lint        - Lint code"
	@echo "    make dev-full    - Run app + Tailwind in development mode"
	@echo "  Tailwind:"
	@echo "    make tw-dev      - Run Tailwind CSS in watch mode"
	@echo "    make tw-build    - Build Tailwind CSS for production (minified)"
	@echo "    make tw-build-dev - Build Tailwind CSS for development"
	@echo "    make tw-clean    - Remove Tailwind CSS output file"
	@echo "    make tw-purge    - Build Tailwind with content purging"
	@echo "    make build-full  - Build Tailwind + NestJS for production"
	@echo "    make build-full-dev - Build Tailwind + NestJS for development"
	@echo "  Docker:"
	@echo "    make docker-dev-up    - Start dev database container"
	@echo "    make docker-dev-down  - Stop dev database container"
	@echo "    make docker-prod-up   - Start production containers"
	@echo "    make docker-prod-down - Stop production containers"
	@echo "  Database:"
	@echo "    make db-migrate       - Run database migrations"
	@echo "    make db-studio        - Open Prisma Studio"
	@echo "    make db-push-dev      - Push schema to dev database"
	@echo "    make db-push-test     - Push schema to test database"
	@echo "    make db-push-prod     - Push schema to production database"
	@echo "    make db-reset-dev     - Reset and recreate dev database with fresh schema and seed data"
	@echo "    make db-reset-force - Reset dev database with user confirmation prompt"
	@echo "    make db-seed-dev      - Seed dev database with sample data"
	@echo "    make db-seed-test     - Seed test database with sample data"
	@echo "    make db-seed-prod     - Seed production database with sample data"
	@echo "  Script commands:"
	@echo "    make script-setup-dev  - Run development setup script"
	@echo "    make script-setup-test - Run test setup script"
	@echo "    make script-setup-prod - Run production setup script"
	@echo "    make script-clear-dev  - Run development clear script"
	@echo "  Combined:"
	@echo "    make setup-dev        - Setup development environment"
	@echo "    make setup-test       - Setup test environment"
	@echo "    make setup-prod       - Setup production environment"
	@echo "    make clear-dev        - Clear development environment"

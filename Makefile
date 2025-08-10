# LIFF Survey Project - Docker開発環境

.PHONY: help build up down logs shell-frontend shell-backend test test-e2e test-e2e-local test-e2e-prod test-unit clean deploy deploy-functions deploy-frontend

# デフォルトターゲット
help:
	@echo "利用可能なコマンド:"
	@echo "  make build     - Dockerイメージをビルド"
	@echo "  make up        - 開発環境を起動"
	@echo "  make down      - 開発環境を停止"
	@echo "  make logs      - ログを表示"
	@echo "  make test-unit - Vitestユニットテストを実行"
	@echo "  make test-e2e-local  - E2Eテスト（ローカル環境）を実行"
	@echo "  make test-e2e-prod   - E2Eテスト（本番環境）を実行"
	@echo "  make test-e2e  - E2Eテスト（レガシー）を実行"
	@echo "  make shell-frontend  - フロントエンドコンテナにシェル接続"
	@echo "  make shell-backend   - バックエンドコンテナにシェル接続"
	@echo "  make deploy    - 本番環境へ完全デプロイ"
	@echo "  make deploy-functions - Firebase Functionsのみデプロイ"
	@echo "  make deploy-frontend  - Firebase Hostingのみデプロイ"
	@echo "  make clean     - 全てのコンテナとボリュームを削除"

# Dockerイメージをビルド
build:
	docker-compose build

# 開発環境を起動
up:
	docker-compose --env-file .env.docker up -d
	@echo ""
	@echo "開発環境が起動しました！"
	@echo "フロントエンド: http://localhost:3000"
	@echo "バックエンドAPI: http://localhost:8000"
	@echo "Firestore UI: http://localhost:4000"
	@echo ""

# 開発環境を起動（ログ表示）
up-logs:
	docker-compose --env-file .env.docker up

# 開発環境を停止
down:
	docker-compose down

# ログを表示
logs:
	docker-compose logs -f

# フロントエンドログを表示
logs-frontend:
	docker-compose logs -f frontend

# バックエンドログを表示
logs-backend:
	docker-compose logs -f backend

# Vitestユニットテストを実行
test-unit:
	docker-compose run --rm test npm run test:run

# E2Eテスト（ローカル環境）を実行
test-e2e-local:
	@echo "ローカル環境E2Eテストを実行中..."
	@echo "対象: http://localhost:3000 (frontend), http://localhost:8001 (API)"
	cd frontend && TEST_ENV=local npx playwright test

# E2Eテスト（本番環境）を実行
test-e2e-prod:
	@echo "本番環境E2Eテストを実行中..."
	@echo "対象: Firebase Hosting & Cloud Functions"
	cd frontend && TEST_ENV=production npx playwright test

# Playwright E2Eテストを実行（レガシー）
test-e2e:
	docker-compose run --rm test npm run test:e2e

# テストをウォッチモードで実行
test-watch:
	docker-compose run --rm test npm run test

# レガシーエイリアス（後方互換性）
test: test-unit

# フロントエンドコンテナにシェル接続
shell-frontend:
	docker-compose exec frontend sh

# バックエンドコンテナにシェル接続
shell-backend:
	docker-compose exec backend sh

# 依存関係を再インストール
install:
	docker-compose run --rm frontend npm install
	docker-compose run --rm backend npm install

# 全てを削除
clean:
	docker-compose down -v --rmi all
	docker system prune -f

# Firebase Functions をデプロイ
deploy-functions:
	@echo "Firebase Functions をデプロイ中..."
	cd functions && npm install
	firebase deploy --only functions
	@echo "Firebase Functions のデプロイが完了しました！"

# フロントエンドをビルドしてFirebase Hosting にデプロイ
deploy-frontend:
	@echo "フロントエンドをビルド中..."
	cd frontend && npm install && npm run build
	@echo "Firebase Hosting にデプロイ中..."
	cd frontend && firebase deploy --only hosting
	@echo "フロントエンドのデプロイが完了しました！"

# 完全デプロイ（Functions + Frontend）
deploy:
	@echo "完全デプロイを開始します..."
	$(MAKE) deploy-functions
	$(MAKE) deploy-frontend
	@echo "全てのデプロイが完了しました！"
	@echo "Frontend: https://liff-survey-app-20250809-282a6.web.app"
	@echo "API: https://asia-northeast1-liff-survey-app-20250809-282a6.cloudfunctions.net/api"

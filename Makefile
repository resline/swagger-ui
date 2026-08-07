# Swagger UI Security-Enhanced Build System

# Variables
IMAGE_NAME ?= swagger-ui
IMAGE_TAG ?= latest
REGISTRY ?= localhost:5000
DOCKER_BUILDKIT ?= 1
PLATFORM ?= linux/amd64,linux/arm64

# Security scanning tools
TRIVY_VERSION ?= 0.45.0
HADOLINT_VERSION ?= 2.12.0
COSIGN_VERSION ?= 2.2.0

.PHONY: help build build-multi security-scan lint test deploy clean

help: ## Display this help message
	@echo "Swagger UI Security-Enhanced Build System"
	@echo ""
	@echo "Available targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install-tools: ## Install security scanning tools
	@echo "Installing security tools..."
	@if ! command -v trivy >/dev/null 2>&1; then \
		curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin v$(TRIVY_VERSION); \
	fi
	@if ! command -v hadolint >/dev/null 2>&1; then \
		curl -L https://github.com/hadolint/hadolint/releases/download/v$(HADOLINT_VERSION)/hadolint-Linux-x86_64 -o /usr/local/bin/hadolint && chmod +x /usr/local/bin/hadolint; \
	fi
	@if ! command -v cosign >/dev/null 2>&1; then \
		curl -L https://github.com/sigstore/cosign/releases/download/v$(COSIGN_VERSION)/cosign-linux-amd64 -o /usr/local/bin/cosign && chmod +x /usr/local/bin/cosign; \
	fi

lint-dockerfile: ## Lint Dockerfile with hadolint
	@echo "Linting Dockerfile..."
	@hadolint Dockerfile

build: lint-dockerfile ## Build Docker image with security scanning
	@echo "Building Docker image: $(IMAGE_NAME):$(IMAGE_TAG)"
	@DOCKER_BUILDKIT=$(DOCKER_BUILDKIT) docker build \
		--build-arg BUILDKIT_INLINE_CACHE=1 \
		--tag $(IMAGE_NAME):$(IMAGE_TAG) \
		--label org.opencontainers.image.created="$(shell date -u +'%Y-%m-%dT%H:%M:%SZ')" \
		--label org.opencontainers.image.revision="$(shell git rev-parse HEAD)" \
		--label org.opencontainers.image.version="$(IMAGE_TAG)" \
		.
	@echo "Build completed: $(IMAGE_NAME):$(IMAGE_TAG)"

build-multi: lint-dockerfile ## Build multi-platform Docker image
	@echo "Building multi-platform image: $(IMAGE_NAME):$(IMAGE_TAG)"
	@docker buildx create --use --name swagger-builder 2>/dev/null || true
	@docker buildx build \
		--platform $(PLATFORM) \
		--build-arg BUILDKIT_INLINE_CACHE=1 \
		--tag $(IMAGE_NAME):$(IMAGE_TAG) \
		--label org.opencontainers.image.created="$(shell date -u +'%Y-%m-%dT%H:%M:%SZ')" \
		--label org.opencontainers.image.revision="$(shell git rev-parse HEAD)" \
		--label org.opencontainers.image.version="$(IMAGE_TAG)" \
		--push \
		.

security-scan: ## Run comprehensive security scans
	@echo "Running security scans..."
	@echo "1. Scanning for secrets in codebase..."
	@if command -v truffleHog >/dev/null 2>&1; then \
		truffleHog --regex --entropy=False .; \
	else \
		echo "truffleHog not installed, skipping secret scan"; \
	fi
	@echo "2. Scanning Docker image for vulnerabilities..."
	@trivy image --severity HIGH,CRITICAL $(IMAGE_NAME):$(IMAGE_TAG)
	@echo "3. Scanning for misconfigurations..."
	@trivy config .
	@echo "4. Scanning filesystem..."
	@trivy fs --security-checks vuln,secret,config .

vulnerability-report: ## Generate detailed vulnerability report
	@echo "Generating vulnerability reports..."
	@mkdir -p reports
	@trivy image --format json --output reports/trivy-image-report.json $(IMAGE_NAME):$(IMAGE_TAG)
	@trivy image --format table --output reports/trivy-image-report.txt $(IMAGE_NAME):$(IMAGE_TAG)
	@trivy config --format json --output reports/trivy-config-report.json .
	@trivy fs --format json --output reports/trivy-fs-report.json .
	@echo "Reports generated in ./reports/"

sign-image: ## Sign Docker image with cosign
	@echo "Signing image: $(IMAGE_NAME):$(IMAGE_TAG)"
	@cosign sign --yes $(IMAGE_NAME):$(IMAGE_TAG)

verify-image: ## Verify Docker image signature
	@echo "Verifying image signature: $(IMAGE_NAME):$(IMAGE_TAG)"
	@cosign verify $(IMAGE_NAME):$(IMAGE_TAG)

test: build ## Test the built image
	@echo "Testing Docker image..."
	@docker run --rm --detach --name swagger-ui-test -p 8080:8080 $(IMAGE_NAME):$(IMAGE_TAG)
	@sleep 10
	@curl -f http://localhost:8080/health || (docker stop swagger-ui-test && exit 1)
	@curl -f http://localhost:8080/ || (docker stop swagger-ui-test && exit 1)
	@docker stop swagger-ui-test
	@echo "✅ Image tests passed"

compose-security-check: ## Security check for docker-compose files
	@echo "Checking docker-compose configurations..."
	@if command -v docker-compose-security >/dev/null 2>&1; then \
		docker-compose-security docker-compose.yml; \
	else \
		echo "docker-compose-security not installed, skipping"; \
	fi

validate-env: ## Validate environment configuration and security
	@echo "Validating environment configuration..."
	@./scripts/validate-env.sh

credentials-check: ## Check for default/insecure credentials
	@echo "Checking for insecure default credentials..."
	@echo "🔍 Scanning for dangerous default values..."
	@if grep -r "changeme\|admin123\|CHANGE_ME" docker-compose*.yml monitoring/ .env.example 2>/dev/null; then \
		echo "❌ Found potential default credentials - review above results!"; \
		echo "💡 Use './scripts/manage-secrets.sh generate-all' to create secure passwords"; \
		exit 1; \
	else \
		echo "✅ No obvious default credentials found in configuration files"; \
	fi

deploy-staging: build security-scan test ## Deploy to staging environment
	@echo "Deploying to staging..."
	@docker-compose -f docker-compose.yml up -d

deploy-production: build-multi security-scan vulnerability-report sign-image ## Deploy to production
	@echo "Deploying to production..."
	@docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

clean: ## Clean up Docker artifacts
	@echo "Cleaning up..."
	@docker system prune -af --volumes
	@docker builder prune -af
	@rm -rf reports/

monitor: ## Show monitoring dashboard URLs
	@echo "Monitoring Dashboard URLs:"
	@echo "  Grafana:     http://localhost:3000 (admin/YOUR_GRAFANA_PASSWORD)"
	@echo ""
	@echo "⚠️  SECURITY: Replace default credentials before deployment!"
	@echo "💡 Use './scripts/manage-secrets.sh generate-all' to create secure passwords"
	@echo "  Prometheus:  http://localhost:9090"
	@echo "  Kibana:      http://localhost:5601"
	@echo "  Swagger UI:  http://localhost:8080"

dev-setup: ## Setup development environment
	@echo "Setting up development environment..."
	@cp .env.example .env
	@docker-compose up -d swagger-ui
	@echo "Development environment ready!"
	@echo "Swagger UI: http://localhost:8080"

# Default target
all: install-tools build security-scan test
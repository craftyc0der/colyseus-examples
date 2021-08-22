# version (defaults to short git hash)
VERSION ?= $(shell git rev-parse --short HEAD)

IMAGE_REPO=localhost:5000
AWS_IMAGE_REPO=858624437249.dkr.ecr.us-east-2.amazonaws.com
REPO_NAME=colyseus-example
DOCKER_IMAGE_TAG ?= ${IMAGE_REPO}/${REPO_NAME}:${VERSION}

docker:
	docker build -t $(DOCKER_IMAGE_TAG) .

push: docker
	docker push $(DOCKER_IMAGE_TAG)

latest: docker
	docker tag $(DOCKER_IMAGE_TAG) $(IMAGE_REPO)/${REPO_NAME}:latest
	docker push $(IMAGE_REPO)/${REPO_NAME}:latest

release: latest
	aws --profile=org ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin $(AWS_IMAGE_REPO)
	docker tag $(IMAGE_REPO)/${REPO_NAME}:latest $(AWS_IMAGE_REPO)/dev-images:$(REPO_NAME)-latest
	docker push $(AWS_IMAGE_REPO)/dev-images:$(REPO_NAME)-latest
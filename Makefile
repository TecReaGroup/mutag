.DEFAULT_GOAL := run

.PHONY: install run build dist pack preview

install:
	npm ci

run:
	npm run dev

build:
	npm run build

dist:
	npm run dist

pack:
	npm run pack

preview:
	npm run preview

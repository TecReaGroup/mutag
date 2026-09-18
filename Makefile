.DEFAULT_GOAL := run

ifeq ($(OS),Windows_NT)
SHELL := cmd.exe
.SHELLFLAGS := /d /s /c
NPM := chcp 65001 >nul && npm
else
NPM := npm
endif

.PHONY: install run build dist pack preview

install:
	$(NPM) ci

run:
	$(NPM) run dev

build:
	$(NPM) run build

dist:
	$(NPM) run dist

pack:
	$(NPM) run pack

preview:
	$(NPM) run preview

.PHONY: check smoke-check

check: smoke-check

smoke-check:
	./scripts/smoke_check.sh

#!/bin/bash

set -e

# Color output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Bringing down the data engineering stack...${NC}"
docker compose down

echo -e "${GREEN}Stack stopped${NC}"

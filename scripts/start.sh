#!/bin/sh
CONFIG_FILE="game-config.json"
GAME=$(grep '"gameId":' "$CONFIG_FILE" | cut -d ':' -f 2 | tr -d '", \t\n\r')
echo "Game ID is: $GAME"
cat $CONFIG_FILE > apps/$GAME/dist/game-config.json
cd apps/$GAME
node --import='extensionless/register' dist/app.js

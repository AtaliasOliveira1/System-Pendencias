#!bin/bash
GREEN='\033[1;32m'
BLUE='\033[0;34m'
while : 
do
printf "${GREEN}︎SERVIDOR SISTEMA DE PENDÊNCIAS - ${BLUE}@ataliasloami\n"
if [ "$1" = "sim" ]; then
node connect.js sim
elif [ "$1" = "não" ]; then
node server.js não
else 
node server.js
fi
sleep 1 
printf "${BLUE}- O ︎programa fechado! Iniciando o projeto novamente, aguarde...\n"
done

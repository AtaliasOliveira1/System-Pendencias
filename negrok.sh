#!/bin/bash
GREEN='\033[1;32m'
BLUE='\033[0;34m'

# Loop infinito
while : 
do
    # Exibe mensagem de inicialização
    printf "${GREEN}SERVIDOR NGROK - ${BLUE}@ataliasloami\n"
    
    # Verifica o argumento de entrada para iniciar o ngrok
    if [ "$1" = "sim" ]; then
        ngrok http 127.0.0.1:4000
    else 
        printf "${BLUE}Iniciando ngrok com IP padrão (127.0.0.1:4000)...\n"
        ngrok http 127.0.0.1:4000
    fi

    # Aguarda 1 segundo antes de reiniciar
    sleep 1 
    printf "${BLUE}- O programa foi fechado! Reiniciando o ngrok, aguarde...\n"
done

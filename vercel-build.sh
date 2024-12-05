#!/bin/bash

# Imprimir versiones
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Instalar dependencias
npm install

# Construir el proyecto
npm run build

# Verificar el resultado de la construcción
if [ -d "dist" ]; then
    echo "Build successful!"
else
    echo "Build failed!"
    exit 1
fi

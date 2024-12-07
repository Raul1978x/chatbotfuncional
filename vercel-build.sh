#!/bin/bash

# Imprimir versiones
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"

# Instalar dependencias
npm install

# Generar cliente de Prisma
npx prisma generate

# Construir el proyecto
npm run build

# Verificar el resultado de la construcción
if [ -d "dist" ]; then
    echo "Build successful!"
    echo "Contents of dist directory:"
    ls -la dist
else
    echo "Build failed!"
    exit 1
fi

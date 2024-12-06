#!/bin/bash

# Imprimir versiones
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

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
    echo "Build logs:"
    cat npm-debug.log || echo "No npm debug log found"
    exit 1
fi

# Listar archivos de configuración
echo "Vercel configuration:"
cat vercel.json || echo "No vercel.json found"

echo "Package.json:"
cat package.json || echo "No package.json found"

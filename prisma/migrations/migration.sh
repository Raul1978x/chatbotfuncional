#!/bin/bash

# Salir si hay algún error
set -e

# Generar cliente de Prisma
npx prisma generate

# Aplicar migraciones
npx prisma migrate deploy

# Mensaje de éxito
echo "Migración de base de datos completada con éxito"

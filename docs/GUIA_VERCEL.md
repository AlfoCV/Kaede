# Guía de Despliegue en Vercel - Kaede PWA

## Paso 1: Preparar el Repositorio

### Opción A: GitHub (Recomendado)

1. **Crear repositorio en GitHub:**
   - Ve a https://github.com/new
   - Nombre: `kaede-pwa`
   - Privado o público según prefieras
   - NO inicialices con README

2. **Subir el código:**
   ```bash
   # Descomprime el ZIP en tu computadora
   unzip kaede_pwa_v3.zip
   cd kaede_pwa/nextjs_space
   
   # Inicializar git
   git init
   git add .
   git commit -m "Kaede PWA v3.0"
   
   # Conectar con GitHub
   git remote add origin https://github.com/TU_USUARIO/kaede-pwa.git
   git branch -M main
   git push -u origin main
   ```

---

## Paso 2: Configurar Vercel

1. **Crear cuenta o iniciar sesión:**
   - Ve a https://vercel.com
   - Inicia sesión con GitHub (más fácil)

2. **Importar proyecto:**
   - Click en "Add New..." → "Project"
   - Selecciona tu repositorio `kaede-pwa`
   - Click en "Import"

3. **Configurar el proyecto:**
   - **Framework Preset:** Next.js (auto-detectado)
   - **Root Directory:** `nextjs_space` ⚠️ IMPORTANTE
   - **Build Command:** `yarn build` (auto)
   - **Output Directory:** `.next` (auto)

---

## Paso 3: Variables de Entorno

En la pantalla de configuración, ve a "Environment Variables" y agrega:

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://gjdzqqfovrxtwraflwtn.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZHpxcWZvdnJ4dHdyYWZsd3RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4ODIxNjgsImV4cCI6MjA4NzQ1ODE2OH0.ZMrjxm5JTzuD2jguLf_OD7ZGcnctKy_BZpdXaoZr2r0` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZHpxcWZvdnJ4dHdyYWZsd3RuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg4MjE2OCwiZXhwIjoyMDg3NDU4MTY4fQ.ZdbordFwRTcbuE8jjrh_nDJoPeJY7d_YkO7NUUnTyqU` |
| `OPENAI_API_KEY` | `sk-proj-WpaK8y6nb...` (tu API key completa) |

⚠️ **IMPORTANTE:** Copia los valores EXACTOS. Un carácter mal y no funcionará.

---

## Paso 4: Deploy

1. Click en **"Deploy"**
2. Espera ~2-3 minutos
3. Cuando termine, verás tu URL: `https://kaede-pwa.vercel.app`

---

## Paso 5: Instalar la PWA

### En iPhone/iPad:
1. Abre tu URL de Vercel en Safari
2. Toca el botón de compartir (cuadro con flecha)
3. "Añadir a pantalla de inicio"
4. Nombra "Kaede" y confirma

### En Android:
1. Abre en Chrome
2. Menú (tres puntos) → "Instalar app"

### En Mac/PC:
1. Abre en Chrome/Edge
2. Click en el ícono de instalación en la barra de direcciones

---

## Solución de Problemas

### "Module not found"
- Verifica que `Root Directory` sea `nextjs_space`
- Redespliega

### "Invalid API key"
- Revisa que `OPENAI_API_KEY` esté completa
- No debe tener espacios al inicio/final

### "Failed to fetch"
- Verifica las variables de Supabase
- Las keys deben empezar con `eyJ...`

### La app no se instala como PWA
- Usa HTTPS (Vercel ya lo tiene)
- Usa Safari en iOS, Chrome en Android

---

## Actualizar la App

Cuando hagas cambios:

```bash
git add .
git commit -m "Descripción del cambio"
git push
```

Vercel automáticamente redespliegará.

---

## Dominio Personalizado (Opcional)

1. En Vercel, ve a Settings → Domains
2. Agrega tu dominio: `kaede.tudominio.com`
3. Configura DNS según instrucciones de Vercel
4. Espera propagación (~5-10 min)

---

## Modelo de IA

El código está configurado para usar `gpt-4o` por defecto con OpenAI.

Modelos disponibles:
- `gpt-4o` - Mejor calidad
- `gpt-4o-mini` - Más económico
- `gpt-4-turbo` - Rápido
- `gpt-3.5-turbo` - Más barato

Puedes cambiar el modelo por defecto en Ajustes de la app.

---

¡Listo! Tu Kaede personal está en la nube. 🌸

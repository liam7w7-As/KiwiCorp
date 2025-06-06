# Kiwi Exams - Plataforma de Exámenes en Línea

## 🚀 Descripción

Kiwi Exams es una plataforma web simple y eficiente para crear y administrar exámenes en línea. Permite a los docentes crear exámenes personalizados y a los estudiantes tomarlos desde cualquier lugar con acceso a internet.

## ✨ Características

- ✅ **Creación de exámenes**: Interfaz intuitiva para crear exámenes con múltiples preguntas
- ✅ **Acceso remoto**: Los estudiantes pueden tomar exámenes desde cualquier dispositivo
- ✅ **Tiempo controlado**: Configuración de tiempo límite por pregunta
- ✅ **Resultados en tiempo real**: Visualización inmediata de resultados y estadísticas
- ✅ **Exportación de datos**: Descarga de resultados en formato CSV
- ✅ **Modo offline**: Funciona sin conexión usando localStorage como respaldo
- ✅ **Integración Firebase**: Almacenamiento en la nube para acceso remoto

## 🔧 Configuración

### Opción 1: Uso Local (Sin Firebase)

1. Descarga todos los archivos del proyecto
2. Abre `main.html` en tu navegador
3. Los datos se guardarán localmente en el navegador

### Opción 2: Configuración con Firebase (Recomendado para uso remoto)

#### Paso 1: Crear proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Crear un proyecto"
3. Sigue los pasos para crear tu proyecto
4. En el panel de Firebase, ve a "Configuración del proyecto" > "General"
5. En la sección "Tus apps", haz clic en "</>"
6. Registra tu app web y copia la configuración

#### Paso 2: Configurar Firestore

1. En Firebase Console, ve a "Firestore Database"
2. Haz clic en "Crear base de datos"
3. Selecciona "Comenzar en modo de prueba" (para desarrollo)
4. Elige una ubicación para tu base de datos

#### Paso 3: Configurar el proyecto

1. Abre el archivo `js/firebase-config.js`
2. Reemplaza la configuración de ejemplo con tu configuración real:

```javascript
const firebaseConfig = {
    apiKey: "tu-api-key",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto-id",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789",
    appId: "tu-app-id"
};
```

#### Paso 4: Configurar reglas de Firestore

En Firebase Console > Firestore Database > Reglas, usa estas reglas básicas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura y escritura de exámenes
    match /exams/{examId} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ Nota de Seguridad**: Estas reglas son para desarrollo. Para producción, implementa reglas más restrictivas.

#### Paso 5: Desplegar en hosting web

Puedes usar cualquiera de estos servicios gratuitos:

- **Netlify**: Arrastra la carpeta del proyecto a [netlify.com](https://netlify.com)
- **Vercel**: Conecta tu repositorio en [vercel.com](https://vercel.com)
- **Firebase Hosting**: Usa `firebase deploy` después de configurar Firebase CLI
- **GitHub Pages**: Sube el proyecto a GitHub y activa Pages

## 📁 Estructura del Proyecto

```
kiwi/
├── index.html          # Página de demostración del examen
├── main.html           # Página principal para crear exámenes
├── exam.html           # Página para tomar exámenes
├── results.html        # Página para ver resultados
├── style.css           # Estilos principales
├── js/
│   ├── main.js         # Lógica principal y creación de exámenes
│   ├── exam.js         # Lógica para tomar exámenes
│   ├── results.js      # Lógica para mostrar resultados
│   ├── firebase-config.js # Configuración de Firebase
│   ├── script.js       # Script del examen demo
│   └── questions.js    # Preguntas del examen demo
└── README.md           # Este archivo
```

## 🎯 Uso

### Para Docentes

1. Abre `main.html` en tu navegador
2. Haz clic en "Crear Nuevo Examen"
3. Completa la información del examen:
   - Título del examen
   - Descripción (opcional)
   - Tiempo por pregunta
4. Agrega las preguntas y opciones
5. Haz clic en "Crear Examen"
6. Comparte el enlace generado con tus estudiantes
7. Usa el enlace de resultados para ver las calificaciones

### Para Estudiantes

1. Abre el enlace proporcionado por tu docente
2. Ingresa tu nombre completo
3. Lee las instrucciones del examen
4. Haz clic en "Iniciar Examen"
5. Responde las preguntas dentro del tiempo límite
6. Ve tu calificación al finalizar

## 🔍 Características Técnicas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Base de datos**: Firebase Firestore (con fallback a localStorage)
- **Responsive**: Compatible con dispositivos móviles y desktop
- **PWA Ready**: Puede instalarse como aplicación web
- **Sin dependencias**: No requiere frameworks externos

## 🛠️ Personalización

### Cambiar colores del tema

Edita las variables CSS en `style.css`:

```css
:root {
    --primary-color: #fc7d1c;
    --secondary-color: #ff9a3c;
    --success-color: #28a745;
    --danger-color: #dc3545;
}
```

### Modificar tiempo por defecto

En `js/exam.js`, cambia la variable `timeValue`:

```javascript
let timeValue = 15; // segundos por pregunta
```

## 🔒 Seguridad

- Los datos se almacenan de forma segura en Firebase Firestore
- Las reglas de Firestore controlan el acceso a los datos
- No se almacenan datos sensibles en el cliente
- Funciona con HTTPS cuando se despliega correctamente

## 🐛 Solución de Problemas

### El examen no carga
- Verifica que el ID del examen en la URL sea correcto
- Comprueba la conexión a internet
- Revisa la consola del navegador para errores

### Firebase no conecta
- Verifica la configuración en `firebase-config.js`
- Asegúrate de que las reglas de Firestore permitan acceso
- Comprueba que el proyecto de Firebase esté activo

### Los resultados no se guardan
- El sistema automáticamente usa localStorage como respaldo
- Verifica la configuración de Firebase si quieres sincronización

## 📞 Soporte

Si tienes problemas o sugerencias:

1. Revisa este README
2. Verifica la consola del navegador para errores
3. Asegúrate de que todos los archivos estén en su lugar

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

**¡Disfruta creando exámenes con Kiwi Exams! 🥝**
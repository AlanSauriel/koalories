# 🍎 Contador de Calorías - Web App

> Una aplicación web moderna y rápida para calcular, registrar y monitorear el consumo diario de calorías, construida con **React + TypeScript** y enfocada en una experiencia **100% *client-side*** con persistencia de datos en LocalStorage.

## 🚀 Características Principales

| Icono | Característica | Descripción |
| :---: | :--- | :--- |
| ✅ | **Gestión de Perfiles** | Crea y administra múltiples perfiles de usuario sin necesidad de base de datos externa. |
| 🧬 | **Cálculo TDEE** | Implementación precisa de la fórmula **Mifflin-St Jeor** para estimar las calorías diarias (Gasto Energético Total Diario). |
| 🇲🇽 | **Base de Datos Local** | Incluye más de 60 alimentos predefinidos con porciones basadas en la Guía de Alimentos para la Población Mexicana. |
| 📅 | **Seguimiento Inteligente** | Registra el consumo diario con un sistema de búsqueda y filtros por categoría instantáneo. |
| 📊 | **Progreso Visual** | Anillo circular interactivo que muestra el estado de la meta: **Verde** (Dentro), **Naranja** (Cerca), **Rojo** (Excedido). |
| ✨ | **UX Detallada** | Mensajes motivacionales dinámámicos que cambian según el progreso del usuario. |
| 📈 | **Historial Gráfico** | Visualización del consumo de los últimos 5 días mediante gráficos de barras y líneas (Recharts). |
| 📥 | **Exportar PDF** | Generación de reportes diarios descargables que incluyen el resumen del perfil, meta, consumo y lista de alimentos registrados (jsPDF). |
| 🌓 | **Tema Adaptativo** | Soporte completo para Tema Claro y Oscuro con persistencia automática en LocalStorage. |
| 📱 | **Diseño Responsive** | Interfaz optimizada y *mobile-first* para funcionar perfectamente en cualquier dispositivo. |

---

## 🛠 Stack Tecnológico

Este proyecto fue construido con un enfoque modular y de alto rendimiento.

| Categoría | Herramienta | Notas |
| :--- | :--- | :--- |
| **Framework** | [React 18](https://reactjs.org/) | Biblioteca principal de UI. |
| **Lenguaje** | [TypeScript](https://www.typescriptlang.org/) | Para tipado estático y escalabilidad. |
| **Build Tool** | [Vite](https://vitejs.dev/) | Bundler moderno y extremadamente rápido. |
| **Estilos** | CSS Modules & CSS Variables | Diseño modular y sistema de temas ligero. |
| **Gráficos** | [Recharts](http://recharts.org/) | Para la visualización del historial en `/historial`. |
| **PDF Export** | [jsPDF](https://raw.githack.com/MrRio/jsPDF/master/docs/) | Generación de documentos en el lado del cliente. |
| **Routing** | [react-router-dom](https://reactrouter.com/en/main) | Manejo declarativo de la navegación. |
| **Estado/Persistencia** | Context API + Custom Hooks | Gestión simple de estado global y persistencia con `useLocalStorage`. |

---

## ⚙️ Instalación y Uso Local

Para poner en marcha el proyecto en tu máquina local:

### 1. Clona el Repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd contador-de-calorias
```

### 2. Instala Dependencias

```bash
npm install
# o
yarn install
```

### 3. Ejecuta el Servidor de Desarrollo

```bash
npm run dev
# o
yarn dev
```

La aplicación estará disponible en `http://localhost:5173/` (o el puerto que muestre Vite).

### 4. Build para Producción

Para generar una versión optimizada lista para desplegar:

```bash
npm run build
```

-----

## 📦 Estructura del Proyecto

```
src/
├── components/           # Componentes atómicos y reutilizables
│   ├── ui/               # Componentes base (shadcn/ui/radix style)
│   ├── ProgressRing/     # Lógica y estilos del anillo de progreso
│   └── ... 
├── pages/                # Vistas principales de la aplicación
│   ├── Login.tsx         # Creación/selección de perfil
│   ├── Registro.tsx      # Ingreso de datos físicos / Cálculo TDEE
│   ├── Dashboard.tsx     # Registro diario de calorías
│   └── Historial.tsx     # Gráficos de seguimiento
├── context/              # Manejo de estado global (Sesión, Tema)
├── hooks/                # Lógica reutilizable (LocalStorage, Calculadora)
├── data/
│   └── foods.seed.json   # Base de datos de alimentos local (JSON)
├── utils/                # Funciones auxiliares (fechas, formatos, PDF)
├── types.d.ts            # Definiciones de tipos de TypeScript
└── index.css             # Archivo principal de estilos (Design System - Variables)
```

-----

## 🔑 Persistencia de Datos (LocalStorage)

La aplicación utiliza las siguientes claves para la persistencia de datos *client-side*:

  - `cc_profiles`: Array de todos los perfiles de usuario.
  - `cc_activeProfileId`: ID del perfil activo actualmente.
  - `cc_theme`: Tema seleccionado (`'light'` o `'dark'`).
  - `cc_intake_{profileId}_{dateISO}`: Registro de alimentos consumidos para un día específico.

-----

## ⚠️ Disclaimer

**Demostración Educativa y de Portafolio**.

Esta aplicación **NO** está destinada a uso médico o profesional. Los cálculos calóricos se basan en fórmulas estándar (Mifflin-St Jeor) y estimaciones de porciones. No guarda datos sensibles. **No sustituye la asesoría de un médico o nutricionista profesional.**

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**.

-----

<p align="center">Hecho con ❤️ para la comunidad hispanohablante</p>

# Route Creator & Editor

A powerful web-based tool for managing KML routes, visualizing ward boundaries, and generating optimized routes from vehicle history.

## 🚀 Features

### 🗺️ KML Editor
- **Import & Export**: Seamlessly import existing KML/XML files and export your work.
- **Layer Management**: Organize map elements into layers for better visibility.
- **Property Editing**: Modify properties of map features directly.

### 🤖 Auto Route Generation
- **Intelligent Routing**: Automatically generate routes based on vehicle history data.
- **Ward Boundary Analysis**: Filter points within specific ward boundaries.
- **Buffer Zones**: Create buffer zones around boundaries to include nearby points.
- **Efficiency Stats**: View statistics on point coverage and efficiency.

### 📍 Interactive Map
- **Visual Feedback**: Real-time visualization of routes, boundaries, and raw data.
- **Map Controls**: Easy-to-use controls for zooming, panning, and layer toggling.

## 📖 How to Use

### 1. Editor Mode
- **Start a Project**: Create a new project or open an existing one.
- **Import Data**: Click "Import KML" to load your route files.
- **Edit**: Use the sidebar panels to manage layers and edit feature properties.
- **Save/Export**: Save your progress or export the final KML file.

### 2. Auto Route Mode
- **Switch Module**: Toggle to "Auto Route" mode from the sidebar.
- **Upload Data**:
    1.  Upload **Vehicle History** (KML/GeoJSON) - The raw path data.
    2.  Upload **Ward Boundary** (KML/GeoJSON) - The target area.
- **Configure**: Adjust buffer radius and other settings.
- **Generate**: The system will automatically filter points and generate a clean route inside the boundary.
- **Export**: Download the generated route as a KML file.

## 🛠️ Tech Stack
- **Frontend**: React, Vite, TypeScript
- **Styling**: Tailwind CSS
- **Maps**: Leaflet, React-Leaflet
- **Geospatial**: Turf.js, togeojson, tokml

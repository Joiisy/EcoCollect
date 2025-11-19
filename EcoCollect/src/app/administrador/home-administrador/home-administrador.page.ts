import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DOCUMENT } from "@angular/common";
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonFab,
  IonFabButton,
  IonInput,
  IonTextarea,
  IonButtons,
  IonModal,
  AlertController,
  IonSpinner,
  IonFabList,
  IonAlert,
  IonMenu,
  IonMenuButton,
  IonText, IonRouterOutlet, IonApp, 
  NavController} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  notifications,
  location,
  add,
  trash,
  download,
  play,
  stop,
  copy,
  document,
  close,
  refresh,
  wifi,
  sunny,
  moon,
  locate,
  eyeOff,
  eye, people, car, logOut } from "ionicons/icons";
import { CargaDatos } from "src/services/datos/carga-datos";
import { Geolocation } from "@capacitor/geolocation";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat, toLonLat } from "ol/proj";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import LineString from "ol/geom/LineString";
import Style from "ol/style/Style";
import CircleStyle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import { Coordinate } from "ol/coordinate";
import { Calles } from "../../../interfaces/calles";
import { Rutas } from "../../../interfaces/rutas";
import { AuthService } from '../../../services/auth';

// Interfaz para los puntos del recorrido
interface PuntoRecorrido {
  id: number;
  lat: number;
  lng: number;
  calle: string;
  timestamp: Date;
  orden: number;
}

@Component({
  selector: "app-home-conductor",
  templateUrl: "./home-administrador.page.html",
  styleUrls: ["./home-administrador.page.scss"],
  standalone: true,
  imports: [IonApp, IonRouterOutlet, 
    IonModal,
    IonButtons,
    IonButton,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonAlert,
    IonFab,
    IonFabButton,
    IonInput,
    IonTextarea,
    IonSpinner,
    CommonModule,
    FormsModule,
    IonIcon,
    IonMenu,
    IonMenuButton,
    IonText,
  ],
})
export class HomeAdministradorPage implements OnInit {
  private map: Map | undefined;
    private nav = inject(NavController);

  private datos = inject(CargaDatos);
  private alertController = inject(AlertController);
  modalRutasAbierto = false;
  markerLayer: any;
  routeLayer: any;
  private rutasLayer: any;
  calleGuardada = "";
  data: Calles[] = [];
  currentLocation: { lat: number; lng: number } | null = null;
  isLoading = true;
  guardandoRuta = false;
  cargandoRutas = false;
  isDarkMode = false;
  rutasVisibles = true; 

  // Variables para el recorrido
  modoRecorrido = false;
  puntosRecorrido: PuntoRecorrido[] = [];
  siguienteId = 1;
  showAlert = false;
  alertMessage = "";

  // Variables para la ruta completa
  nombreRuta = "ruta casa";
  perfilId = "f64cbf63-089f-4aa5-8c77-eddb1400ea70";
  rutaCompleta: Rutas | null = null;
  showJsonPreview = false;
  JSON = JSON;

  // Variables para gestión de rutas
  rutasGuardadas: Rutas[] = [];
  private authService = inject(AuthService);
  private document = inject(DOCUMENT);
  userRole = "";
  userName = "";

  constructor() {
    addIcons({people,car,logOut,copy,trash,close,download,location,document,notifications,add,play,stop,refresh,wifi,sunny,moon,locate,eyeOff,eye,});
  }

  async ngOnInit() {
    await this.loadMap();
    this.cargarRecorridoGuardado();
    this.actualizarRutaCompleta();
    this.cargarRutasGuardadas();
    await this.loadUserData();
  }

modalAbierto = false;

abrirModal() {
  this.modalAbierto = true;
}

cerrarModal() {
  this.modalAbierto = false;
}

goConductores(){
  this.nav.navigateForward('/admin-conductores');
}

goVehiculos(){
  this.nav.navigateForward('/vehiculos');
}

  cerrarModalRutas() {
    this.modalRutasAbierto = false;
  }

   async loadUserData() {
    this.userName = await this.authService.getUserName();
    this.userRole = await this.authService.getUserRole();
  
  }

  async loadMap() {
    this.isLoading = true;

    try {
      const permissions = await Geolocation.checkPermissions();

      if (permissions.location !== "granted") {
        const request = await Geolocation.requestPermissions();
        if (request.location !== "granted") {
          throw new Error("Permisos de ubicación denegados");
        }
      }

      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      });

      const lat = coordinates.coords.latitude;
      const lng = coordinates.coords.longitude;

      console.log("📍 Ubicación REAL obtenida:", { lat, lng });

      this.currentLocation = { lat, lng };

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new Error("Coordenadas inválidas obtenidas");
      }

      this.initializeMap(lng, lat);
    } catch (error) {
      console.error("❌ Error obteniendo ubicación:", error);
      console.log("🗺️ Usando ubicación por defecto: Buenaventura");
      this.initializeMap(-77.0797, 3.8836);
    } finally {
      this.isLoading = false;
    }
  }

  private initializeMap(lng: number, lat: number): void {
    if (this.map) {
      this.map.setTarget(undefined);    }

    console.log("🗺️ Inicializando mapa en:", { lng, lat });

    this.map = new Map({
      target: "mapId",
      layers: [
        new TileLayer({
          source: new OSM(
            {
              attributions: [] 
            }
          ),
          
          
        }),
      ],
      view: new View({
        center: fromLonLat([lng, lat]),
        zoom: 15,
      }),
    });

    // Capa para marcadores de ubicación
    this.markerLayer = new VectorLayer({
      source: new VectorSource(),
    });

    // Capa para la línea del recorrido actual
    this.routeLayer = new VectorLayer({
      source: new VectorSource(),
      style: new Style({
        stroke: new Stroke({
          color: "#ff0000",
          width: 4,
        }),
      }),
    });

    // Nueva capa para rutas guardadas
    this.rutasLayer = new VectorLayer({
      source: new VectorSource(),
      style: new Style({
        stroke: new Stroke({
          color: "#3880ff",
          width: 3,
          lineDash: [5, 5],
        }),
      }),
    });

    this.map.addLayer(this.markerLayer);
    this.map.addLayer(this.routeLayer);
    this.map.addLayer(this.rutasLayer);

    // Agregar marcador en la ubicación actual
    this.addLocationMarker(lng, lat);

    // Configurar evento de clic para agregar puntos al recorrido
    this.map.on("click", async (event) => {
      if (this.modoRecorrido) {
        await this.agregarPuntoRecorrido(event.coordinate);
      } else {
        await this.obtenerYGuardarCalle(event.coordinate);
      }
    });

    // Dibujar recorrido existente si hay puntos
    this.dibujarRecorrido();
  }

  // ===== MÉTODOS PARA GESTIÓN DE RECORRIDO =====

  toggleModoRecorrido() {
    this.modoRecorrido = !this.modoRecorrido;
    this.mostrarMensaje(
      this.modoRecorrido
        ? "Modo recorrido ACTIVADO - Haz clic en el mapa para agregar puntos"
        : "Modo recorrido DESACTIVADO"
    );
  }

  async agregarPuntoRecorrido(coordinate: Coordinate) {
    try {
      const lonLat = toLonLat(coordinate);
      const [lng, lat] = lonLat;

      // Obtener nombre de la calle
      const nombreCalle = await this.obtenerNombreCalle(lat, lng);

      const nuevoPunto: PuntoRecorrido = {
        id: this.siguienteId++,
        lat,
        lng,
        calle: nombreCalle,
        timestamp: new Date(),
        orden: this.puntosRecorrido.length + 1,
      };

      this.puntosRecorrido.push(nuevoPunto);
      this.guardarRecorrido();
      this.dibujarPuntoRecorrido(nuevoPunto);
      this.dibujarRecorrido();

      // Actualizar la ruta completa
      this.actualizarRutaCompleta();

      this.mostrarMensaje(`Punto ${nuevoPunto.orden} agregado: ${nombreCalle}`);
    } catch (error) {
      console.error("Error agregando punto:", error);
      this.mostrarMensaje("Error al agregar punto");
    }
  }

  private dibujarPuntoRecorrido(punto: PuntoRecorrido) {
    if (!this.markerLayer) return;

    const marker = new Feature({
      geometry: new Point(fromLonLat([punto.lng, punto.lat])),
    });

    // Estilo especial para puntos del recorrido
    marker.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({ color: "#ff0000" }),
          stroke: new Stroke({
            color: "white",
            width: 2,
          }),
        }),
      })
    );

    this.markerLayer.getSource().addFeature(marker);
  }

  private dibujarRecorrido() {
    if (!this.routeLayer || this.puntosRecorrido.length < 2) return;

    const coordinates = this.puntosRecorrido
      .sort((a, b) => a.orden - b.orden)
      .map((punto) => fromLonLat([punto.lng, punto.lat]));

    const lineString = new LineString(coordinates);
    const routeFeature = new Feature({
      geometry: lineString,
    });

    this.routeLayer.getSource().clear();
    this.routeLayer.getSource().addFeature(routeFeature);
  }

  eliminarRecorrido() {
    this.puntosRecorrido = [];
    this.siguienteId = 1;
    this.guardarRecorrido();
    this.actualizarRutaCompleta();

    if (this.routeLayer) {
      this.routeLayer.getSource().clear();
    }
    if (this.markerLayer) {
      this.markerLayer.getSource().clear();
    }

    // Volver a dibujar marcador de ubicación actual
    if (this.currentLocation) {
      this.addLocationMarker(
        this.currentLocation.lng,
        this.currentLocation.lat
      );
    }

    this.mostrarMensaje("Recorrido eliminado");
  }

  abrirModalRutas() {
    this.modalRutasAbierto = true;
    // Cargar rutas automáticamente al abrir el modal
    this.cargarRutasGuardadas();
  }

  // ===== MÉTODOS PARA MOSTRAR/OCULTAR RUTAS =====

  toggleRutasGuardadas() {
    this.rutasVisibles = !this.rutasVisibles;

    if (this.rutasVisibles) {
      this.dibujarRutasGuardadas();
      this.mostrarMensaje("Rutas mostradas en el mapa");
    } else {
      this.limpiarRutasGuardadas();
      this.mostrarMensaje("Rutas ocultadas del mapa");
    }
  }

  private dibujarRutasGuardadas() {
    if (!this.rutasLayer || !this.rutasGuardadas.length) {
      console.log("❌ No se pueden dibujar rutas - verificar capa y datos");
      return;
    }

    // Limpiar rutas anteriores
    this.limpiarRutasGuardadas();

    console.log(
      `🎨 Dibujando ${this.rutasGuardadas.length} rutas organizadamente...`
    );

    // Dibujar cada ruta con estilo organizado
    this.rutasGuardadas.forEach((ruta, index) => {
      this.dibujarRutaOrganizada(ruta, index);
    });

    console.log("✅ Todas las rutas dibujadas organizadamente");
   
  }

  private dibujarRutaOrganizada(ruta: Rutas, index: number) {
    try {
      const shapeObj = JSON.parse(ruta.shape);

      // Obtener estilo organizado (colores sólidos, sin punteado)
      const estilo = this.obtenerEstiloOrganizado(index);

      console.log(
        `🔄 Dibujando ruta ${index + 1}: "${ruta.nombre_ruta}" - Color: ${
          estilo.color
        }`
      );

      // Manejar diferentes formatos de geometría
      if (shapeObj.type === "LineString" && shapeObj.coordinates) {
        this.dibujarSegmento(shapeObj.coordinates, ruta.nombre_ruta, estilo);
      } else if (shapeObj.type === "MultiLineString" && shapeObj.coordinates) {
        // Para MultiLineString, dibujar todos los segmentos con el mismo estilo
        shapeObj.coordinates.forEach(
          (segmentoCoords: any[], segmentIndex: number) => {
            this.dibujarSegmento(segmentoCoords, `${ruta.nombre_ruta}`, estilo);
          }
        );
      }
    } catch (error) {
      console.error("❌ Error dibujando ruta organizada:", error);
    }
  }

  private dibujarSegmento(coordenadas: any[], nombre: string, estilo: any) {
    if (!coordenadas || coordenadas.length < 2) {
      console.log("❌ Coordenadas insuficientes para dibujar segmento");
      return;
    }

    // Convertir coordenadas GeoJSON [lng, lat] a coordenadas de OpenLayers
    const coordenadasConvertidas = coordenadas.map((coord: any) => {
      if (coord.length === 2) {
        return fromLonLat(coord);
      }
      return fromLonLat([0, 0]); // Fallback
    });

    const lineString = new LineString(coordenadasConvertidas);
    const feature = new Feature({
      geometry: lineString,
      name: nombre,
    });

    feature.setStyle(
      new Style({
        stroke: new Stroke({
          color: estilo.color,
          width: estilo.ancho,
        }),
      })
    );

    this.rutasLayer.getSource().addFeature(feature);
  }

  private obtenerEstiloOrganizado(index: number): any {
    const colores = [
      "#3880ff", // Azul principal
      "#10dc60", // Verde
      "#ffce00", // Amarillo
      "#f04141", // Rojo
      "#7044ff", // Violeta
      "#0cd1e8", // Celeste
      "#ff6b00", // Naranja
      "#6a1b9a", // Púrpura
      "#004d40", // Verde oscuro
      "#bf360c", // Rojo oscuro
    ];

    const coloresSecundarios = [
      "#4c8dff", // Azul claro
      "#2dd36f", // Verde claro
      "#ffd534", // Amarillo claro
      "#ff6b6b", // Rojo claro
      "#8c7bff", // Violeta claro
      "#34e7e7", // Celeste claro
      "#ff8c42", // Naranja claro
      "#8e24aa", // Púrpura claro
      "#00796b", // Verde azulado
      "#e64a19", // Naranja oscuro
    ];

    const paleta = index < 10 ? colores : coloresSecundarios;
    const colorIndex = index % paleta.length;

    return {
      color: paleta[colorIndex],
      ancho: 4,
    };
  }

  limpiarRutasGuardadas() {
    if (this.rutasLayer) {
      this.rutasLayer.getSource().clear();
    }
  }

 

  obtenerNumeroPuntos(ruta: Rutas): number {
    try {
      const shapeObj = JSON.parse(ruta.shape);
      if (shapeObj.type === "LineString" && shapeObj.coordinates) {
        return shapeObj.coordinates.length;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  // ===== MÉTODOS PARA LA ESTRUCTURA DE RUTA COMPLETA =====

  actualizarRutaCompleta() {
    if (this.puntosRecorrido.length < 2) {
      this.rutaCompleta = null;
      return;
    }

    // Crear el objeto GeoJSON LineString correctamente
    const geoJsonLineString = {
      type: "LineString" as const,
      coordinates: this.puntosRecorrido
        .sort((a, b) => a.orden - b.orden)
        .map((punto) => [punto.lng, punto.lat]),
    };

    // Crear la ruta completa - shape como STRING del GeoJSON
    this.rutaCompleta = {
      id: this.rutaCompleta?.id || '',
      nombre_ruta: this.nombreRuta,
      perfil_id: this.perfilId,
      shape: JSON.stringify(geoJsonLineString),
    };

    console.log("🔄 Ruta actualizada:", this.rutaCompleta);
  }

  getShapePreview(): string {
    if (!this.rutaCompleta) return "No hay ruta generada";

    try {
      const shapeObj = JSON.parse(this.rutaCompleta.shape);
      return `LineString con ${shapeObj.coordinates.length} puntos`;
    } catch {
      return "Error al parsear shape";
    }
  }

  // ===== MÉTODOS MEJORADOS PARA GESTIÓN DE RUTAS =====

  async cargarRutasGuardadas() {
    this.cargandoRutas = true;
    console.log("🔄 Iniciando carga de rutas...");

    try {
      // 1. Obtener rutas del servidor
      this.rutasGuardadas = await this.datos.obtenerRutas();
      console.log("📦 Rutas recibidas del servidor:", this.rutasGuardadas);

      if (!this.rutasGuardadas || this.rutasGuardadas.length === 0) {
        console.log("ℹ️ No hay rutas guardadas en el servidor");
        this.mostrarMensaje("No hay rutas guardadas en el servidor");
        return;
      }

      // 2. Verificar que tenemos rutas válidas
      const rutasValidas = this.rutasGuardadas.filter(
        (ruta) => ruta && ruta.shape && ruta.nombre_ruta
      );

      console.log(
        `✅ ${rutasValidas.length} rutas válidas de ${this.rutasGuardadas.length} totales`
      );

      if (rutasValidas.length === 0) {
        console.log("❌ No hay rutas válidas para mostrar");
        this.mostrarMensaje("Las rutas no tienen formato válido");
        return;
      }

      // 3. Dibujar rutas en el mapa
      this.dibujarRutasGuardadas();

      console.log("🎉 Rutas cargadas y dibujadas exitosamente");
    } catch (error: any) {
      console.error("💥 ERROR en cargarRutasGuardadas:", error);

      let mensajeError = "Error desconocido al cargar rutas";
      if (error.status === 0) {
        mensajeError = "No se pudo conectar al servidor";
      } else if (error.status === 404) {
        mensajeError = "Servidor no encontrado";
      } else if (error.message) {
        mensajeError = error.message;
      }

      this.mostrarAlerta("Error", mensajeError);
    } finally {
      this.cargandoRutas = false;
    }
  }

  async guardarRuta() {
    if (!this.rutaCompleta) {
      this.mostrarAlerta(
        "Error",
        "No hay ruta para guardar. Agrega al menos 2 puntos al recorrido."
      );
      return;
    }

    // Validar que el shape sea un GeoJSON válido
    if (!this.validarGeoJSON(this.rutaCompleta.shape)) {
      this.mostrarAlerta("Error", "El formato de la ruta no es válido");
      return;
    }

    this.guardandoRuta = true;

    try {
      console.log("💾 Intentando guardar ruta:", this.rutaCompleta);

      const respuesta = await this.datos.guardarRuta(this.rutaCompleta);

      console.log("✅ Ruta guardada exitosamente:", respuesta);

      // Recargar la lista de rutas
      await this.cargarRutasGuardadas();

      this.mostrarAlerta(
        "Éxito",
        `Ruta "${this.nombreRuta}" guardada correctamente en el servidor`
      );
    } catch (error: any) {
      console.error("❌ Error detallado al guardar:", error);

      let mensajeError = "Error desconocido al guardar la ruta";

      if (error.status === 0) {
        mensajeError = "No se pudo conectar al servidor. Verifica tu conexión.";
      } else if (error.status === 400) {
        mensajeError = "Datos inválidos enviados al servidor";
      } else if (error.status === 404) {
        mensajeError = "Servidor no encontrado (404)";
      } else if (error.status === 500) {
        mensajeError = "Error interno del servidor (500)";
      } else if (error.message) {
        mensajeError = error.message;
      }

      await this.mostrarAlerta("Error al Guardar", mensajeError);
    } finally {
      this.guardandoRuta = false;
    }
  }

  private validarGeoJSON(shape: string): boolean {
    try {
      const parsed = JSON.parse(shape);
      return (
        parsed.type === "LineString" &&
        Array.isArray(parsed.coordinates) &&
        parsed.coordinates.length >= 2
      );
    } catch {
      return false;
    }
  }

  // async eliminarRuta(rutaId: string, nombreRuta: string) {
  //   try {
  //     const alert = await this.alertController.create({
  //       header: "Confirmar Eliminación",
  //       message: `¿Estás seguro de que quieres eliminar la ruta "${nombreRuta}"?`,
  //       buttons: [
  //         {
  //           text: "Cancelar",
  //           role: "cancel",
  //         },
  //         {
  //           text: "Eliminar",
  //           handler: async () => {
  //             try {
  //               await this.datos.eliminarRuta(rutaId);
  //               this.mostrarMensaje("Ruta eliminada correctamente");
  //               await this.cargarRutasGuardadas(); // Recargar lista
  //             } catch (error) {
  //               console.error("Error eliminando ruta:", error);
  //               this.mostrarAlerta("Error", "No se pudo eliminar la ruta");
  //             }
  //           },
  //         },
  //       ],
  //     });

  //     await alert.present();
  //   } catch (error) {
  //     console.error("Error al preparar eliminación:", error);
  //   }
  // }

  // Método para probar la conexión con el servidor
  async probarConexionServidor() {
    try {
      this.mostrarAlerta(
        "Probando Conexión",
        "Verificando conexión con el servidor..."
      );

      const rutas = await this.datos.obtenerRutas();

      if (rutas.length > 0) {
        this.mostrarAlerta(
          "Conexión Exitosa",
          `Se encontraron ${rutas.length} rutas en el servidor. Conexión funcionando correctamente.`
        );
      } else {
        this.mostrarAlerta(
          "Conexión Exitosa",
          "Conexión al servidor exitosa. No hay rutas guardadas aún."
        );
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      this.mostrarAlerta(
        "Error de Conexión",
        "No se pudo conectar al servidor. Verifica la URL y que el servidor esté funcionando."
      );
    }
  }

  // Método para formatear el JSON de forma legible
  getRutaFormateada(ruta: Rutas): string {
    try {
      const shapeObj = JSON.parse(ruta.shape);
      return JSON.stringify(
        {
          perfil_id: ruta.perfil_id,
          nombre_ruta: ruta.nombre_ruta,
          shape: shapeObj,
        },
        null,
        2
      );
    } catch {
      return JSON.stringify(ruta, null, 2);
    }
  }

  toggleJsonPreview() {
    this.showJsonPreview = !this.showJsonPreview;
  }

  // ===== MÉTODOS AUXILIARES =====

  private async obtenerNombreCalle(lat: number, lng: number): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();

      if (data && data.address) {
        return this.crearStringCalle(data.address);
      }
      return "Calle no identificada";
    } catch (error) {
      console.error("Error obteniendo nombre de calle:", error);
      return "Calle no identificada";
    }
  }

  private guardarRecorrido() {
    localStorage.setItem(
      "recorridoGuardado",
      JSON.stringify({
        puntos: this.puntosRecorrido,
        siguienteId: this.siguienteId,
      })
    );
  }

  private cargarRecorridoGuardado() {
    try {
      const guardado = localStorage.getItem("recorridoGuardado");
      if (guardado) {
        const data = JSON.parse(guardado);
        this.puntosRecorrido = data.puntos || [];
        this.siguienteId = data.siguienteId || 1;

        // Redibujar recorrido si hay puntos
        if (this.puntosRecorrido.length > 0) {
          setTimeout(() => {
            this.dibujarRecorrido();
            this.puntosRecorrido.forEach((punto) =>
              this.dibujarPuntoRecorrido(punto)
            );
            this.actualizarRutaCompleta();
          }, 1000);
        }
      }
    } catch (error) {
      console.error("Error cargando recorrido guardado:", error);
    }
  }

  private mostrarMensaje(mensaje: string) {
    this.alertMessage = mensaje;
    this.showAlert = true;
    setTimeout(() => (this.showAlert = false), 3000);
  }

  private addLocationMarker(lng: number, lat: number): void {
    if (!this.map || !this.markerLayer) return;

    // Solo agregar marcador si no estamos en modo recorrido o no hay puntos
    if (!this.modoRecorrido || this.puntosRecorrido.length === 0) {
      const marker = new Feature({
        geometry: new Point(fromLonLat([lng, lat])),
      });

      marker.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 8,
            fill: new Fill({ color: "#3880ff" }),
            stroke: new Stroke({
              color: "white",
              width: 2,
            }),
          }),
        })
      );

      this.markerLayer.getSource().addFeature(marker);
    }
  }

  async obtenerYGuardarCalle(coordinate: Coordinate) {
    try {
      const lonLat = toLonLat(coordinate);
      const [lng, lat] = lonLat;

      const nombreCalle = await this.obtenerNombreCalle(lat, lng);
      this.guardarCalle(nombreCalle, coordinate);
    } catch (error) {
      console.error("Error:", error);
    }
  }

  crearStringCalle(address: any) {
    const callesConNumeros = [
      address.road,
      address.street,
      address.pedestrian,
      address.footway,
    ].filter((nombre) => nombre && nombre.match(/\d+/));

    if (callesConNumeros.length > 0) {
      const calle = callesConNumeros[0];
      const numero = calle.match(/(\d+)/)[1];
      return `Calle ${numero}`;
    }

    const cualquierCalle = address.road || address.street || address.pedestrian;
    if (cualquierCalle) {
      const match = cualquierCalle.match(/(\d+)/);
      if (match) {
        return `Calle ${match[1]}`;
      }
      return `Calle ${cualquierCalle}`;
    }

    return "Calle no identificada";
  }

  guardarCalle(calleString: string, coordinate: Coordinate) {
    this.calleGuardada = calleString;
    localStorage.setItem("ultimaCalleCapturada", calleString);
    console.log("Calle guardada:", calleString);
    this.mostrarCalleGuardada(calleString, coordinate);
  }

  mostrarCalleGuardada(calleString: string, coordinate: Coordinate) {
    this.mostrarMensaje(`Calle guardada: ${calleString}`);
  }

  async buscar() {
    if (!this.calleGuardada) {
      console.log("No hay calle guardada para buscar");
      return;
    }

    console.log("Buscando calle:", this.calleGuardada);

    const callesEncontradas = await this.datos.buscarCallePorNombre(
      this.calleGuardada
    );
    console.log("Resultados de búsqueda:", callesEncontradas);
  }

  async centrarEnUbicacionActual() {
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
      });

      const lat = coordinates.coords.latitude;
      const lng = coordinates.coords.longitude;

      this.map?.getView().animate({
        center: fromLonLat([lng, lat]),
        zoom: 15,
        duration: 1000,
      });

      this.addLocationMarker(lng, lat);
      this.mostrarMensaje("Mapa centrado en tu ubicación actual");
    } catch (error) {
      console.error("Error centrando en ubicación actual:", error);
      this.mostrarMensaje("Error al obtener la ubicación actual");
    }
  }

  // Función para mostrar alertas
  async mostrarAlerta(titulo: string, mensaje: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ["OK"],
    });

    await alert.present();
  }

  async logout() {
    // Confirmar con el usuario antes de cerrar sesión
    const confirm = await this.alertController.create({
      header: "Cerrar sesión",
      message: "¿Estás seguro que deseas cerrar sesión?",
      buttons: [
        { text: "Cancelar", role: "cancel" },
        {
          text: "Cerrar sesión",
          handler: () => {
            // Ejecutar el cierre en una IIFE async (handler no puede ser async directamente)
            void (async () => {
              this.isLoading = true;
              try {
                // Llamada al servicio de autenticación
                await this.authService.logout();

                // Limpieza local de datos sensibles
                localStorage.removeItem("token");
                localStorage.removeItem("user"); // ajustar según keys reales
                // Si deseas eliminar todo: localStorage.clear();

                // Limpiar y destruir el mapa para evitar fugas
                try {
                  this.markerLayer?.getSource()?.clear?.();
                  this.routeLayer?.getSource()?.clear?.();
                  this.rutasLayer?.getSource()?.clear?.();
                  if (this.map) {
                    this.map.setTarget(undefined);
                    this.map = undefined;
                  }
                } catch (mapErr) {
                  console.warn("Error limpiando mapa durante logout:", mapErr);
                }

                // Navegar reiniciando el historial (no permitir volver atrás)
                await this.nav.navigateRoot("/login");

              } catch (error) {
                console.error("Error al cerrar sesión:", error);
                await this.mostrarAlerta("Error", "No se pudo cerrar sesión. Intenta de nuevo.");
              } finally {
                this.isLoading = false;
              }
            })();
          },
        },
      ],
    });

    await confirm.present();
  }
}

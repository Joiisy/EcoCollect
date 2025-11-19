import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { Geolocation } from '@capacitor/geolocation';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Stroke, Icon } from 'ol/style';
import { LineString, Point } from 'ol/geom';
import { Feature } from 'ol';
import { Rutas } from 'src/interfaces/rutas';
import { CargaDatos } from 'src/services/datos/carga-datos';
import { AlertController } from '@ionic/angular/standalone';
import { Vehiculos } from 'src/interfaces/vehiculos';

interface PuntoRecorrido {
  id: number;
  lat: number;
  lng: number;
  calle: string;
  timestamp: Date;
  orden: number;
}

@Component({
  selector: 'app-home-conductores',
  templateUrl: './home-conductores.page.html',
  styleUrls: ['./home-conductores.page.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonSelect,
    IonSelectOption,
    CommonModule,
    FormsModule,
  ],
})
export class HomeConductoresPage implements OnInit {
  isLoading = true;
  cargandoRutas = false;
  private datos = inject(CargaDatos);
  alertMessage = "";
  showAlert = false;
  private alertController = inject(AlertController);
  currentLocation: { lat: number; lng: number } | null = null;
  private map: Map | undefined;
  rutasGuardadas: Rutas[] = [];
  rutaSeleccionada: Rutas | null = null;
  markerLayer: any;
  routeLayer: any;
  private rutasLayer: any;
  private carLayer: any;
  modoRecorrido = false;
  recorridoPuntos: number[][] = [];
  puntosRecorrido: PuntoRecorrido[] = [];
  private carFeature: any;
  private recorridoInterval: any;
  rutasVisibles = true; 
  puntosRutaActual: number[][] = [];
  indicePuntoActual: number = 0;
  private cargaDatos = inject(CargaDatos);
  
  private recorridoId: string | null = null;
  vehiculoId!: Vehiculos['id'];
  private perfilId: string = "f64cbf63-089f-4aa5-8c77-eddb1400ea70"; // Cambiar por ID real del perfil
  vehiculo! : Vehiculos[];

  constructor() {}

  async ngOnInit() {
    await this.MostrarMapa();
    await this.cargarRutasGuardadas();
    await this.obtenerVehiculos();
  }

  async mostrarAlerta(titulo: string, mensaje: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ["OK"],
    });
    await alert.present();
  }

  async MostrarMapa() {
    this.isLoading = true;

    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      });

      const lat = coordinates.coords.latitude;
      const lng = coordinates.coords.longitude;

      console.log('📍 Ubicación REAL obtenida:', { lat, lng });
      this.currentLocation = { lat, lng };

      this.initializeMap(lng, lat);
    } catch (error) {
      console.error('❌ Error obteniendo ubicación:', error);
      console.log('🗺️ Usando ubicación por defecto: Buenaventura');
      this.initializeMap(-77.0797, 3.8836);
    } finally {
      this.isLoading = false;
    }
  }

  private initializeMap(lng: number, lat: number): void {
    if (this.map) {
      this.map.setTarget(undefined);
    }

    this.map = new Map({
      target: 'mapId',
      layers: [
        new TileLayer({
          source: new OSM({
            attributions: [],
          }),
        }),
      ],
      view: new View({
        center: fromLonLat([lng, lat]),
        zoom: 15,
      }),
    });

    // Capas del mapa
    this.markerLayer = new VectorLayer({ source: new VectorSource() });
    
    this.routeLayer = new VectorLayer({
      source: new VectorSource(),
      style: new Style({
        stroke: new Stroke({ color: '#ff0000', width: 4 }),
      }),
    });

    this.rutasLayer = new VectorLayer({
      source: new VectorSource(),
      style: new Style({
        stroke: new Stroke({ color: '#3880ff', width: 3, lineDash: [5, 5] }),
      }),
    });

    this.carLayer = new VectorLayer({ source: new VectorSource() });

    this.map.addLayer(this.markerLayer);
    this.map.addLayer(this.routeLayer);
    this.map.addLayer(this.rutasLayer);
    this.map.addLayer(this.carLayer);

    this.crearObjetoCarro();
  }

  private crearObjetoCarro(): void {
    const carIcon = new Icon({
      src: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="12" width="24" height="10" rx="2" fill="#3880ff" stroke="#000" stroke-width="1"/>
          <circle cx="10" cy="24" r="3" fill="#333"/>
          <circle cx="22" cy="24" r="3" fill="#333"/>
          <rect x="8" y="8" width="16" height="4" fill="#3880ff" stroke="#000" stroke-width="1"/>
          <rect x="12" y="14" width="8" height="4" fill="#fff" stroke="#000" stroke-width="0.5"/>
        </svg>
      `),
      scale: 1.2,
      anchor: [0.5, 0.5],
    });

    this.carFeature = new Feature({
      geometry: new Point(fromLonLat([0, 0])),
      name: 'carro'
    });

    this.carFeature.setStyle(new Style({ image: carIcon }));
    this.carFeature.setGeometry(null);
    this.carLayer.getSource().addFeature(this.carFeature);
  }

  async seleccionarRuta(event: any) {
    const rutaId = event.detail.value;
    this.rutaSeleccionada = this.rutasGuardadas.find(ruta => ruta.id === rutaId) || null;

    if (this.rutaSeleccionada) {
      console.log('🛣️ Ruta seleccionada para recorrido:', this.rutaSeleccionada.nombre_ruta);
      this.cargarPuntosRuta(this.rutaSeleccionada);
    } else {
      console.warn('⚠️ Ruta no encontrada para el ID seleccionado:', rutaId);
      this.puntosRutaActual = [];
    }
  }

  async seleccionarVehiculo(event: any) {
    this.vehiculoId = event.detail.value;
    console.log('🚗 Vehículo seleccionado para el recorrido:', this.vehiculoId);
  } 

  private cargarPuntosRuta(ruta: Rutas) {
    try {
      const shapeObj = JSON.parse(ruta.shape);
      this.puntosRutaActual = [];

      if (shapeObj.type === 'LineString' && shapeObj.coordinates) {
        this.puntosRutaActual = shapeObj.coordinates;
      } else if (shapeObj.type === 'MultiLineString' && shapeObj.coordinates) {
        this.puntosRutaActual = shapeObj.coordinates[0];
      }

      console.log(`📍 Ruta "${ruta.nombre_ruta}" cargada con ${this.puntosRutaActual.length} puntos`);

      if (this.puntosRutaActual.length > 0) {
        const primerPunto = this.puntosRutaActual[0];
        this.map?.getView().animate({
          center: fromLonLat(primerPunto),
          zoom: 15,
          duration: 1000
        });
      }

    } catch (error) {
      console.error('❌ Error cargando puntos de ruta:', error);
    }
  }

  async toggleRecorridoMode() {
    if (!this.rutaSeleccionada) {
      await this.mostrarAlerta('Error', 'Por favor selecciona una ruta primero');
      return;
    }

    this.modoRecorrido = !this.modoRecorrido;

    if (this.modoRecorrido) {
      console.log('🚗 Iniciando recorrido en ruta:', this.rutaSeleccionada.nombre_ruta);
      await this.iniciarRecorridoRuta();
    } else {
      console.log('🚗 Deteniendo recorrido');
      await this.detenerRecorrido();
    }
  }

  private async iniciarRecorridoRuta() {
    if (this.puntosRutaActual.length === 0) {
      console.error('❌ No hay puntos en la ruta seleccionada');
      return;
    }

    try {
      // 1. Llamar al servicio para iniciar el recorrido en el backend
      const recorridoData = {
        ruta_id: this.rutaSeleccionada!.id.toString(),
        vehiculo_id: this.vehiculoId,
        perfil_id: this.perfilId
      };

      console.log('📡 Enviando datos al servidor:', recorridoData);
      
      const response = await this.datos.iniciarRecorrido(recorridoData);
      
      
      this.recorridoId = response.id || response.recorrido_id;
      console.log('✅ Recorrido iniciado en servidor. ID:', this.recorridoId);

      // 3. Iniciar la simulación visual del recorrido
      this.iniciarSimulacionRecorrido();
      this.finRecorrido();

    } catch (error) {
      console.error('❌ Error al iniciar recorrido en servidor:', error);
      await this.mostrarAlerta('Error', 'No se pudo iniciar el recorrido en el servidor');
      this.modoRecorrido = false;
    }
  }

  private iniciarSimulacionRecorrido() {
    // Reiniciar variables de simulación
    this.indicePuntoActual = 0;
    this.recorridoPuntos = [];
    
    // Posicionar el carro en el primer punto de la ruta
    const primerPunto = this.puntosRutaActual[0];
    this.actualizarPosicionCarro(primerPunto[0], primerPunto[1]);
    this.recorridoPuntos.push(primerPunto);

    // Iniciar simulación de movimiento
    this.recorridoInterval = setInterval(() => {
      this.simularMovimiento();
    }, 3000);
  }

  private async simularMovimiento() {
    if (this.indicePuntoActual >= this.puntosRutaActual.length - 1) {
      console.log('🏁 Recorrido completado');
      await this.detenerRecorrido();
      await this.mostrarAlerta('Recorrido', '¡Has completado la ruta!');
      return;
    }

    // Avanzar al siguiente punto
    this.indicePuntoActual++;
    const puntoActual = this.puntosRutaActual[this.indicePuntoActual];
    
    console.log(`📍 Avanzando al punto ${this.indicePuntoActual + 1}/${this.puntosRutaActual.length}:`, 
                { lng: puntoActual[0], lat: puntoActual[1] });

    // Actualizar posición del carro
    this.actualizarPosicionCarro(puntoActual[0], puntoActual[1]);
    
    // Agregar punto al recorrido actual
    this.recorridoPuntos.push(puntoActual);
    
    // Dibujar recorrido actualizado
    this.dibujarRecorridoActual();

    // Aquí podrías enviar actualizaciones de posición al servidor si es necesario
    await this.actualizarPosicionServidor(puntoActual);
  }

  private async actualizarPosicionServidor(punto: number[]) {
    if (!this.recorridoId) return;

    try {
      // Opcional: Enviar actualización de posición al servidor
      // await this.datos.actualizarPosicionRecorrido({
      //   recorrido_id: this.recorridoId,
      //   lat: punto[1],
      //   lng: punto[0],
      //   timestamp: new Date().toISOString()
      // });
    } catch (error) {
      console.error('❌ Error actualizando posición en servidor:', error);
    }
  }

  private actualizarPosicionCarro(lng: number, lat: number): void {
    if (!this.carFeature) return;

    const coordinates = fromLonLat([lng, lat]);
    this.carFeature.setGeometry(new Point(coordinates));
    
    // Centrar el mapa en el carro
    if (this.map) {
      this.map.getView().animate({
        center: coordinates,
        duration: 1000
      });
    }
  }

  private dibujarRecorridoActual() {
    if (!this.routeLayer || this.recorridoPuntos.length < 2) return;

    this.routeLayer.getSource().clear();

    const coordenadasConvertidas = this.recorridoPuntos.map(coord => 
      fromLonLat(coord)
    );

    const lineString = new LineString(coordenadasConvertidas);
    const feature = new Feature({ geometry: lineString });

    feature.setStyle(new Style({
      stroke: new Stroke({ color: '#ff0000', width: 4 }),
    }));

    this.routeLayer.getSource().addFeature(feature);
  }

  private async detenerRecorrido() {
    // Detener la simulación visual
    if (this.recorridoInterval) {
      clearInterval(this.recorridoInterval);
      this.recorridoInterval = null;
    }
    
    // Ocultar el carro
    if (this.carFeature) {
      this.carFeature.setGeometry(null);
    }
    
    // Aquí podrías llamar a un servicio para finalizar el recorrido en el servidor
    // await this.datos.finalizarRecorrido(this.recorridoId);
    
    this.recorridoId = null;
    this.modoRecorrido = false;
    
    console.log('🛑 Recorrido detenido');
  }

  private dibujarRutasGuardadas() {
    if (!this.rutasLayer || !this.rutasGuardadas.length) return;

    this.limpiarRutasGuardadas();

    this.rutasGuardadas.forEach((ruta, index) => {
      this.dibujarRutaOrganizada(ruta, index);
    });
  }

  private dibujarRutaOrganizada(ruta: Rutas, index: number) {
    try {
      const shapeObj = JSON.parse(ruta.shape);
      const estilo = this.obtenerEstiloOrganizado(index);

      if (shapeObj.type === 'LineString' && shapeObj.coordinates) {
        this.dibujarSegmento(shapeObj.coordinates, ruta.nombre_ruta, estilo);
      } else if (shapeObj.type === 'MultiLineString' && shapeObj.coordinates) {
        shapeObj.coordinates.forEach((segmentoCoords: any[]) => {
          this.dibujarSegmento(segmentoCoords, `${ruta.nombre_ruta}`, estilo);
        });
      }
    } catch (error) {
      console.error('❌ Error dibujando ruta organizada:', error);
    }
  }

  private dibujarSegmento(coordenadas: any[], nombre: string, estilo: any) {
    if (!coordenadas || coordenadas.length < 2) return;

    const coordenadasConvertidas = coordenadas.map((coord: any) => {
      return coord.length === 2 ? fromLonLat(coord) : fromLonLat([0, 0]);
    });

    const lineString = new LineString(coordenadasConvertidas);
    const feature = new Feature({ geometry: lineString, name: nombre });

    feature.setStyle(new Style({
      stroke: new Stroke({ color: estilo.color, width: estilo.ancho }),
    }));

    this.rutasLayer.getSource().addFeature(feature);
  }

  private obtenerEstiloOrganizado(index: number): any {
    const colores = ['#3880ff', '#10dc60', '#ffce00', '#f04141', '#7044ff'];
    const colorIndex = index % colores.length;

    return { color: colores[colorIndex], ancho: 4 };
  }

  limpiarRutasGuardadas() {
    if (this.rutasLayer) {
      this.rutasLayer.getSource().clear();
    }
  }

  async cargarRutasGuardadas() {
    this.cargandoRutas = true;
    try {
      this.rutasGuardadas = await this.datos.obtenerRutas();
      console.log('📦 Rutas recibidas:', this.rutasGuardadas);

      if (this.rutasGuardadas?.length > 0) {
        this.dibujarRutasGuardadas();
      }
    } catch (error: any) {
      console.error('💥 ERROR:', error);
      this.mostrarAlerta('Error', 'Error al cargar rutas');
    } finally {
      this.cargandoRutas = false;
    }
  }

  ngOnDestroy() {
    this.detenerRecorrido();
  }

  toggleRutasGuardadas() {
    this.rutasVisibles = !this.rutasVisibles;

    if (this.rutasVisibles) {
      this.dibujarRutasGuardadas();
      console.log("Rutas mostradas en el mapa");
    } else {
      this.limpiarRutasGuardadas();
      console.log("Rutas ocultadas del mapa");
    }
  }
    async obtenerVehiculos() {
    this.vehiculo = await this.cargaDatos.obtenerVehiculos();
    console.log("Vehiculos Disponibles", this.vehiculo);
  }

  async finRecorrido() {
    if (!this.recorridoId) {
      await this.mostrarAlerta('Error', 'No hay un recorrido activo para finalizar.');
      return;
    }

    try {
      await this.datos.finalizarRecorrido(this.recorridoId);
      console.log('✅ Recorrido finalizado en el servidor. ID:', this.recorridoId);
      await this.mostrarAlerta('Recorrido', 'El recorrido ha sido finalizado correctamente.');
      this.recorridoId = null;
      this.modoRecorrido = false;
      this.detenerRecorrido();
    } catch (error) {
      console.error('❌ Error al finalizar recorrido en el servidor:', error);
      await this.mostrarAlerta('Error', 'No se pudo finalizar el recorrido en el servidor.');
    }
}
}
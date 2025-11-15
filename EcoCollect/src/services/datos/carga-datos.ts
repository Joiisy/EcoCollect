import { Injectable } from '@angular/core';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';
import { environment } from 'src/environments/environment';
import { Calles } from 'src/interfaces/calles';
import { Rutas } from 'src/interfaces/rutas';

@Injectable({
  providedIn: 'root'
})
export class CargaDatos {
  private readonly perfilId = 'f64cbf63-089f-4aa5-8c77-eddb1400ea70';

  constructor() { }

  // Método para obtener calles
  public async getDatos(): Promise<Calles[]> {
    const options = {
      url: environment.url + '/calles',
      method: 'GET',
    };
    const response: HttpResponse = await CapacitorHttp.get(options);    
    return response.data.data as Calles[];
  }

  // Método para buscar calles por nombre
  public async buscarCallePorNombre(nombre: string): Promise<Calles[]> {
    const options = {
      url: environment.url + '/calles',
      method: 'GET',
    };
    
    const response: HttpResponse = await CapacitorHttp.get(options);    
    const todasLasCalles = response.data.data as Calles[];
    
    return todasLasCalles.filter(calle => 
      calle.nombre.toLowerCase().includes(nombre.toLowerCase())
    );
  }

  // NUEVO: Método mejorado para guardar rutas
  async guardarRuta(rutaData: Rutas): Promise<any> {
    // Determinar si estamos en desarrollo o producción
    const isDev = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1';
    
    const baseUrl = isDev ? environment.url : environment.url;
    
    // Construir la URL correctamente
    const url = `${baseUrl}/rutas`;
    
    console.log('🌐 URL de guardado:', url);
    console.log('📦 Datos a enviar:', rutaData);

    const options = {
      url: url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: rutaData
    };

    try {
      console.log('🚀 Enviando solicitud POST...');
      const response: HttpResponse = await CapacitorHttp.post(options);
      
      console.log('✅ Respuesta del servidor:', response);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data;
      } else {
        throw new Error(`Error ${response.status}: ${response.data?.message || 'Error del servidor'}`);
      }
    } catch (error: any) {
      console.error('❌ Error completo al guardar ruta:', error);
      
      // Proporcionar más detalles del error
      const errorDetails = {
        message: error.message,
        status: error.status,
        url: url,
        data: rutaData
      };
      
      throw errorDetails;
    }
  }

  // Método para obtener rutas del servidor (mejorado)
  async obtenerRutas(): Promise<Rutas[]> {
    const isDev = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1';
    const baseUrl = isDev ? environment.url : environment.url;
    const url = `${baseUrl}/rutas?perfil_id=${this.perfilId}`;
    
    console.log('🔍 Obteniendo rutas desde:', url);

    const options = {
      url: url,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    try {
      const response: HttpResponse = await CapacitorHttp.get(options);
      console.log('📋 Rutas obtenidas:', response.data);
      
      if (response.data && response.data.data) {
        return response.data.data as Rutas[];
      } else {
        return [];
      }
    } catch (error) {
      console.error('❌ Error al obtener rutas:', error);
      throw error;
    }
  }

  // NUEVO: Método para eliminar una ruta
    // async eliminarRuta(rutaId: string): Promise<any> {
    //   const isDev = window.location.hostname === 'localhost' || 
    //                 window.location.hostname === '127.0.0.1';
    //   const baseUrl = isDev ? environment.url : environment.url;
    //   const url = `${baseUrl}/rutas/${rutaId}`;

    //   const options = {
    //     url: url,
    //     method: 'DELETE',
    //     headers: {
    //       'Accept': 'application/json'
    //     }
    //   };

  //   try {
  //     const response: HttpResponse = await CapacitorHttp.delete(options);
  //     return response.data;
  //   } catch (error) {
  //     console.error('Error al eliminar ruta:', error);
  //     throw error;
  //   }
  // }
}
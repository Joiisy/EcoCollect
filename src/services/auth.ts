import { inject, Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';
import { Preferences } from '@capacitor/preferences'
import { Alerts } from './alerts/alerts';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  password?: string;
  role: 'admin' | 'conductor';
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabase: SupabaseClient;
  public currentUser: UserProfile | null = null;
  private Alerts = inject(Alerts);
  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    const userId = await this.getStorage('userId');
    if (userId) {
      await this.getUserProfile();
    }
  }

  // 🔥 NUEVO: OBTENER DATOS COMPLETOS DEL USUARIO
  async getCurrentUserData(): Promise<{ name: string; role: string; email: string } | null> {
    try {
      const profile = await this.getUserProfile();
      
      if (profile) {
        return {
          name: profile.name,
          role: profile.role,
          email: profile.email
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error obteniendo datos del usuario:', error);
      return null;
    }
  }

  // 🔥 NUEVO: OBTENER SOLO EL NOMBRE
  async getUserName(): Promise<string> {
    const userData = await this.getCurrentUserData();
    return userData?.name || 'Usuario';
  }

  async getUserRole(): Promise<string> {
    const userData = await this.getCurrentUserData();
    return userData?.role || 'user';
  }

  async getUserEmail(): Promise<string> {
    const userData = await this.getCurrentUserData();
    return userData?.email || '';
  }

  async register(formValue: { 
    name: string; 
    email: string; 
    password: string;
    role?: 'conductor' | 'admin';
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Verificar si el email ya existe
      const { data: existingUser, error: checkError } = await this.supabase
        .from('profiles')
        .select('email')
        .eq('email', formValue.email)
        .single();

      if (existingUser) {
        return { success: false, error: 'El email ya está registrado' };
      }

      const { data: newUser, error } = await this.supabase
        .from('profiles')
        .insert([{
          email: formValue.email,
          name: formValue.name,
          password: formValue.password,
          role: formValue.role || 'conductor',
          is_active: true,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      if (newUser) {
        console.log('✅ Usuario registrado directamente en profiles:', newUser);
        return { success: true };
      }
      
      return { success: false, error: 'Error al crear usuario' };
    } catch (error) {
      console.error('Error en register:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  async login(formValue: {
    email: string;
    password: string;
  }): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
    try {
      console.log('🔐 Intentando login con:', formValue.email);

      const { data: user, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('email', formValue.email)
        .eq('password', formValue.password)
        .eq('is_active', true)
        .single();

      if (error) {
        this.Alerts.DataIncorreta();
        return { success: false, error: 'Credenciales incorrectas' };
      }

      if (!user) {
        return { success: false, error: 'Usuario no encontrado' };
      }

      console.log('✅ Login exitoso:', user);

      // Actualizar last_login
      await this.supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      // Guardar sesión
      await this.saveSession(user);
      this.currentUser = user;

      return { 
        success: true, 
        user: user 
      };
    } catch (error) {
      console.error('💥 Error en login:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  async getUserProfile(): Promise<UserProfile | null> {
    try {
      if (this.currentUser) {
        return this.currentUser;
      }

      const userId = await this.getStorage('userId');
      if (!userId) {
        return null;
      }

      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error obteniendo profile:', error);
        return null;
      }

      this.currentUser = profile;
      return profile;
    } catch (error) {
      console.error('Error en getUserProfile:', error);
      return null;
    }
  }

  /**
   @param id id del perfil a obtener
   @param forceRefresh si es true fuerza la consulta al servidor y actualiza la cache
   */
  async getProfileById(id: string, forceRefresh = false): Promise<UserProfile | null> {
    const cacheKey = `profile_${id}`;
    try {
      // intentar leer cache local
      if (!forceRefresh) {
        try {
          const { value } = await Preferences.get({ key: cacheKey });
          if (value) {
            const cached = JSON.parse(value) as UserProfile;
            return cached;
          }
        } catch (e) {
          // si falla el parse o la lectura, seguimos y consultamos al servidor
          console.warn('No se pudo leer cache de perfil (se consultará al servidor):', e);
        }
      }

      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error obteniendo perfil por id:', error);
        return null;
      }

      // guardar en cache (no bloquear si falla)
      try {
        await Preferences.set({ key: cacheKey, value: JSON.stringify(profile) });
      } catch (e) {
        console.warn('No se pudo cachear perfil:', e);
      }

      return profile;
    } catch (error) {
      console.error('Error en getProfileById:', error);
      return null;
    }
  }

  /**
   * Invalida el cache de un perfil guardado en Preferences
   * @param id id del perfil a invalidar
   */
  async invalidateProfileCache(id: string): Promise<void> {
    try {
      const cacheKey = `profile_${id}`;
      await Preferences.remove({ key: cacheKey });
    } catch (e) {
      console.warn('No se pudo invalidar cache de perfil:', e);
    }
  }

  async getAllConductores(): Promise<UserProfile[]> {
    try {
      const { data: conductors, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('role', 'conductor');

      if (error) {
        console.error('Error obteniendo conductores:', error);
        return [];
      }

      return conductors || [];
    } catch (error) {
      console.error('Error en getAllConductors:', error);
      return [];
    }
  }

  // Cerrar sesión
  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.clearStorage();
      this.currentUser = null;
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al cerrar sesión' };
    }
  }

  // Métodos para roles (SIMPLIFICADOS)
  async hasRole(requiredRole: string): Promise<boolean> {
    const user = await this.getUserProfile();
    return user?.role === requiredRole;
  }

  async hasAnyRole(requiredRoles: string[]): Promise<boolean> {
    const user = await this.getUserProfile();
    return user ? requiredRoles.includes(user.role) : false;
  }

  async isAdmin(): Promise<boolean> {
    const user = await this.getUserProfile();
    return user?.role === 'admin';
  }

  async isConductor(): Promise<boolean> {
    const user = await this.getUserProfile();
    return user?.role === 'conductor';
  }

  async isAuthenticated(): Promise<boolean> {
    const userId = await this.getStorage('userId');
    return !!userId;
  }

  //  Guardar sesión en Preferences
  private async saveSession(user: UserProfile): Promise<void> {
    await this.setStorage('isLoggedIn', 'true');
    await this.setStorage('userEmail', user.email);
    await this.setStorage('userId', user.id);
    await this.setStorage('userRole', user.role);
    await this.setStorage('userName', user.name);
  }

  private async setStorage(key: string, value: string): Promise<void> {
    await Preferences.set({ key, value });
  }

  private async getStorage(key: string): Promise<string | null> {
    const { value } = await Preferences.get({ key });
    return value;
  }

  private async clearStorage(): Promise<void> {
    const keys = ['isLoggedIn', 'userEmail', 'userId', 'userRole', 'userName'];
    for (const key of keys) {
      await Preferences.remove({ key });
    }


  }
}
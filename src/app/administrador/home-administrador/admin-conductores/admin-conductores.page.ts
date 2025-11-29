import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  NavController,
  IonText,
  IonList,
  IonItem,
  IonFab,
  IonFabButton,
  IonModal,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonLabel,
  IonSpinner,
  LoadingController,
  IonInput,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, arrowBack, personRemoveOutline, play, close } from 'ionicons/icons';
import { AuthService } from 'src/services/auth';
import { UserProfile } from 'src/interfaces/userprofile';
import { Alerts } from 'src/services/alerts/alerts';
@Component({
  selector: 'app-admin-conductores',
  templateUrl: './admin-conductores.page.html',
  styleUrls: ['./admin-conductores.page.scss'],
  standalone: true,
  imports: [
    IonSpinner,
    IonLabel,
    IonCardContent,
    IonCardHeader,
    IonCard,
    IonModal,
    IonFabButton,
    IonFab,
    IonItem,
    IonList,
    IonText,
    IonIcon,
    IonButton,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    /* added */ IonInput,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class AdminConductoresPage implements OnInit {
  private nav = inject(NavController);
  private authService = inject(AuthService);
  registerForm!: FormGroup;
  private AuthService = inject(AuthService);
  private Alerts = inject(Alerts);
  private loadingController = inject(LoadingController);
  Perfil: UserProfile | null = null;
  conductores: UserProfile[] = [];

  modalAbierto = false;
  modalAbiertoInfo = false;

  constructor() {
    addIcons({arrowBack,personRemoveOutline,add,close,});
  }

  async ngOnInit() {
    await this.getConductores();
    this.registerForm = new FormGroup({
      name: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required]),
      role: new FormControl('conductor', Validators.required),
    });
  }

  back() {
    this.nav.back();
  }

  async getConductores() {
    this.conductores = await this.authService.getAllConductores();
  }

  abrirModal() {
    this.modalAbierto = true;
  }

  cerrarModal() {
    this.modalAbierto = false;
  }


  abrirModalInfo() {
    this.modalAbiertoInfo = true;
  }

  cerrarModalInfo() {
    this.modalAbiertoInfo = false;
  }

  async register() {
    if (this.registerForm.invalid) return this.Alerts.DataVacia();

    const loading = await this.loadingController.create({
      message: 'Registrando conductor...',
    });

    await loading.present();

    try {
      const formValue = this.registerForm.value;
      const result = await this.AuthService.register({
        name: formValue.name,
        email: formValue.email,
        password: formValue.password,
        role: formValue.role,
      });

      if (result.success) {
        await loading.dismiss();
        this.registerForm.reset();
      } else {
        await loading.dismiss();
      }
    } catch (error) {
      console.error('Error during registration:', error);
      await loading.dismiss();
      this.Alerts.DataIncorreta();
    }
  }

  async verConductor(id: string) {
    this.Perfil = await this.authService.getProfileById(id);
    this.abrirModalInfo();
  }

}

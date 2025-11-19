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
  IonInput,
  NavController,
  IonFab,
  IonFabButton,
  IonModal,
  IonItem,
  IonLabel, IonList, IonText } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBack, add, close, personRemoveOutline } from 'ionicons/icons';
import { AuthService } from '../../../services/auth';
import { Alerts } from 'src/services/alerts/alerts';
import { CargaDatos } from '../../../services/datos/carga-datos';
import { Vehiculos } from '../../../interfaces/vehiculos';
import {
  LoadingController,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-vehiculos',
  templateUrl: './vehiculos.page.html',
  styleUrls: ['./vehiculos.page.scss'],
  standalone: true,
  imports: [IonText, IonList, 
    IonItem,
    IonModal,
    IonFabButton,
    IonFab,
    IonIcon,
    IonButton,
    IonContent,
    IonHeader,
    IonToolbar,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonInput,
    IonSelect,
    IonSelectOption,
  ],
})
export class VehiculosPage implements OnInit {
  private authService = inject(AuthService);
  private alerts = inject(Alerts);
  private CargaDatos = inject(CargaDatos);
  private loadingController = inject(LoadingController);
  private nav = inject(NavController);
  modalAbierto = false;
  vehiculoForm!: FormGroup;
  vehiculo! : Vehiculos[];

  private readonly perfilId = 'f64cbf63-089f-4aa5-8c77-eddb1400ea70';
  anos = ['2019', '2020', '2021', '2022', '2023', '2024'];

  constructor() {
    addIcons({arrowBack,add,close,personRemoveOutline});
  }

  async ngOnInit() {
    await this.obtenerVehiculos();
    this.vehiculoForm = new FormGroup({
      placa: new FormControl('', [Validators.required]),
      marca: new FormControl('', [Validators.required]),
      modelo: new FormControl('', [Validators.required]),
      activo: new FormControl(true, [Validators.required]),
      perfil_id: new FormControl(this.perfilId, [Validators.required]),
    });
  }

  abrirModal() {
    this.modalAbierto = true;
  }

  cerrarModal() {
    this.modalAbierto = false;
  }
  back() {
    this.nav.back();
  }

  async registrarVehiculo() {
    const formValue = this.vehiculoForm.value;

    if (this.vehiculoForm.invalid) return this.alerts.DataIncorreta();
    const loading = await this.loadingController.create({
      message: 'Registrando Vehiculo...',
    });

    await loading.present();
    try {
      await this.CargaDatos.registrarVehiculo(formValue);
      await loading.dismiss();
      this.vehiculoForm.reset();
      this.obtenerVehiculos();
      console.log('Vehículo registrado con éxito', formValue);
    } catch (error) {
      console.error('Error registrando vehículo:', error);
    }
  }

  async obtenerVehiculos() {
    this.vehiculo = await this.CargaDatos.obtenerVehiculos();
    console.log("Vehiculos Disponibles", this.vehiculo);
  }
}

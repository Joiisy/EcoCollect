import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonInput, IonItem, IonImg, IonButton, IonText, IonLabel, IonSkeletonText, LoadingController, NavController } from '@ionic/angular/standalone';
import { Alerts } from '../../../services/alerts/alerts';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonSkeletonText, IonLabel, IonText, IonButton, IonImg, IonItem, IonInput, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, ReactiveFormsModule]
})
export class LoginPage implements OnInit {
    private loadingController = inject(LoadingController);
    private Alerts = inject(Alerts)
    private authService = inject(AuthService)
    private Nav = inject(NavController)
  loginForm!: FormGroup;

  constructor() { }

  ngOnInit() {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required])
    });
  }

 async login(){
    if (this.loginForm.invalid) return this.Alerts.DataVacia();

  const loading = await this.loadingController.create({
    message: 'Iniciando sesión...',
  });
  await loading.present();

  try {
    const formValue = this.loginForm.value;
    const result = await this.authService.login({
      email: formValue.email,
      password: formValue.password
    });
    
    if (result.success && result.user) {
      console.log('🎉 Login exitoso, rol:', result.user.role);
      
      // 🔥 NAVEGAR SEGÚN EL ROL DEL USER
      if (result.user.role === 'admin') {
        this.Nav.navigateRoot('/home-administrador');
      } else if (result.user.role === 'conductor') {
        this.Nav.navigateRoot('/home-conductores');
      } else {
        this.Nav.navigateRoot('/login');
      }
      
      await loading.dismiss();
    } else {
      await loading.dismiss();
    }
  } catch (error) {
    console.error('Error during login:', error);
    await loading.dismiss();
  }
 }
 goRe(){
  this.Nav.navigateForward('/register')
}
}

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonImg, IonText, IonItem, IonLabel, IonButton, IonSelectOption, LoadingController, NavController, IonSelect, IonInput } from '@ionic/angular/standalone';
import { AuthService } from '../../../services/auth';
import { Alerts } from '../../../services/alerts/alerts';

@Component({
  selector: 'app-registro',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonButton, IonLabel, IonItem, IonText, IonImg, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, ReactiveFormsModule,IonSelectOption,IonSelect, IonInput]
})
export class RegisterPage implements OnInit {

  constructor() { }

  ngOnInit() {

  }



}

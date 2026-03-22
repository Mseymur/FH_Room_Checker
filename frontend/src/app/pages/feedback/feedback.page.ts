import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader,
  IonItem, IonList, IonSelect, IonSelectOption,
  IonTextarea, ToastController, NavController,
  IonIcon, IonInput
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chatbubbleEllipsesOutline, informationCircleOutline } from 'ionicons/icons';
import { Firestore, collection, addDoc, serverTimestamp } from '@angular/fire/firestore';
import { Auth, signInAnonymously } from '@angular/fire/auth';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.page.html',
  styleUrls: ['./feedback.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, 
    IonItem, IonList, IonSelect, IonSelectOption, 
    IonTextarea, CommonModule, FormsModule, IonIcon, IonInput
  ]
})
export class FeedbackPage {
  feedbackObj = {
    category: '',
    email: '',
    description: ''
  };

  submitting = false;

  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);
  private toastController = inject(ToastController);
  private navCtrl = inject(NavController);

  constructor() {
    addIcons({ chevronBackOutline, chatbubbleEllipsesOutline, informationCircleOutline });
  }

  goBack() {
    this.navCtrl.navigateBack('/building-overview');
  }

  async submitFeedback() {
    if (!this.feedbackObj.category || !this.feedbackObj.description.trim()) {
      await this.showToast('Please fill in both the category and description fields.', 'warning');
      return;
    }

    if (this.submitting) return;
    this.submitting = true;

    try {
      await signInAnonymously(this.auth);

      const fbCollection = collection(this.firestore, 'user_feedback');
      await addDoc(fbCollection, {
        category: this.feedbackObj.category,
        email: this.feedbackObj.email || null,
        description: this.feedbackObj.description,
        timestamp: serverTimestamp()
      });
      await this.showToast('Feedback submitted successfully! Thank you.', 'success');
      this.feedbackObj = { category: '', email: '', description: '' };
    } catch (error) {
      console.error('Error submitting feedback: ', error);
      await this.showToast('Failed to submit feedback. Please try again later.', 'danger');
    } finally {
      this.submitting = false;
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 3500,
      position: 'top'
    });
    await toast.present();
  }
}

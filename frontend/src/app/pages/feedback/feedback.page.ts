import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader,
  IonItem, IonList, IonSelect, IonSelectOption,
  IonTextarea, ToastController, NavController,
  IonIcon, IonInput
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
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
    IonTextarea, CommonModule, FormsModule, IonIcon, IonInput,
    RouterModule
  ]
})
export class FeedbackPage {
  feedbackObj = {
    category: '',
    name: '',
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

  async submitFeedback() {
    if (!this.feedbackObj.category) {
      await this.showToast('Please select a category.', 'warning');
      return;
    }
    if (!this.feedbackObj.description || !this.feedbackObj.description.trim()) {
      await this.showToast('Please enter a description.', 'warning');
      return;
    }

    if (this.submitting) return;
    this.submitting = true;

    try {
      // Create a timeout promise to prevent silent hangs (e.g., from AppCheck restrictions)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 10000)
      );

      const submitTask = async () => {
        await signInAnonymously(this.auth);
        const fbCollection = collection(this.firestore, 'user_feedback');
        await addDoc(fbCollection, {
          category: this.feedbackObj.category,
          name: this.feedbackObj.name || null,
          email: this.feedbackObj.email || null,
          description: this.feedbackObj.description,
          timestamp: serverTimestamp()
        });
      };

      await Promise.race([submitTask(), timeoutPromise]);

      await this.showToast('Feedback submitted successfully! Thank you.', 'success');
      this.feedbackObj = { category: '', name: '', email: '', description: '' };
    } catch (error: any) {
      console.error('Error submitting feedback: ', error);
      const msg = error.message === 'Request timed out' 
        ? 'Submission timed out. Please check your connection.'
        : 'Failed to submit feedback. Please try again later.';
      await this.showToast(msg, 'danger');
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

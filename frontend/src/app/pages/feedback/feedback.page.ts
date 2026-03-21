import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, 
  IonItem, IonList, IonSelect, IonSelectOption, 
  IonTextarea, ToastController,
  IonIcon, IonInput
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chatbubbleEllipsesOutline, informationCircleOutline } from 'ionicons/icons';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

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

  private firestore: Firestore = inject(Firestore);
  private toastController = inject(ToastController);
  private router: Router = inject(Router);

  constructor() {
    addIcons({ chevronBackOutline, chatbubbleEllipsesOutline, informationCircleOutline });
  }

  goBack() {
    this.router.navigate(['/building-overview']);
  }

  async submitFeedback() {
    if (!this.feedbackObj.category || !this.feedbackObj.description.trim()) {
      await this.showToast('Please fill in both the category and description fields.', 'warning');
      return;
    }

    try {
      const fbCollection = collection(this.firestore, 'user_feedback');
      await addDoc(fbCollection, {
        category: this.feedbackObj.category,
        email: this.feedbackObj.email || null,
        description: this.feedbackObj.description,
        timestamp: new Date()
      });
      await this.showToast('Feedback submitted successfully! Thank you.', 'success');
      this.feedbackObj = { category: '', email: '', description: '' }; // reset form
    } catch (error) {
      console.error('Error adding document: ', error);
      await this.showToast('Failed to submit feedback. Please try again later.', 'danger');
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 3000,
      position: 'bottom'
    });
    await toast.present();
  }
}

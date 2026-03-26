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
  private static readonly MAX_CATEGORY_LENGTH = 100;
  private static readonly MAX_NAME_LENGTH = 100;
  private static readonly MAX_EMAIL_LENGTH = 254;
  private static readonly MAX_DESCRIPTION_LENGTH = 2000;
  private static readonly SUBMISSION_COOLDOWN_MS = 30_000;

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
    const category = this.feedbackObj.category.trim();
    const name = this.feedbackObj.name.trim();
    const email = this.feedbackObj.email.trim().toLowerCase();
    const description = this.feedbackObj.description.trim();

    if (!category) {
      await this.showToast('Please select a category.', 'warning');
      return;
    }
    if (category.length >= FeedbackPage.MAX_CATEGORY_LENGTH) {
      await this.showToast('Category is too long.', 'warning');
      return;
    }
    if (!description) {
      await this.showToast('Please enter a description.', 'warning');
      return;
    }
    if (description.length >= FeedbackPage.MAX_DESCRIPTION_LENGTH) {
      await this.showToast('Description must stay under 2000 characters.', 'warning');
      return;
    }
    if (name.length >= FeedbackPage.MAX_NAME_LENGTH) {
      await this.showToast('Name is too long.', 'warning');
      return;
    }
    if (email.length >= FeedbackPage.MAX_EMAIL_LENGTH) {
      await this.showToast('Email address is too long.', 'warning');
      return;
    }
    if (email && !this.isValidEmail(email)) {
      await this.showToast('Please enter a valid email address.', 'warning');
      return;
    }
    if (this.isCoolingDown()) {
      await this.showToast('Please wait a bit before submitting again.', 'warning');
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
        const payload: Record<string, unknown> = {
          category,
          description,
          timestamp: serverTimestamp()
        };

        if (name) {
          payload['name'] = name;
        }

        if (email) {
          payload['email'] = email;
        }

        await addDoc(fbCollection, payload);
        this.markSubmissionTime();
      };

      await Promise.race([submitTask(), timeoutPromise]);

      await this.showToast('Feedback submitted successfully! Thank you.', 'success');
      this.feedbackObj = { category: '', name: '', email: '', description: '' };
    } catch (error: any) {
      console.error('Error submitting feedback: ', error);
      const msg = error.message === 'Request timed out'
        ? 'Submission timed out. Please check your connection.'
        : `Failed: ${error.message}`;
      await this.showToast(msg, 'danger');
    } finally {
      this.submitting = false;
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isCoolingDown(): boolean {
    const lastSubmission = window.localStorage.getItem('feedback_last_submission_at');
    if (!lastSubmission) {
      return false;
    }

    const lastSubmissionTime = Number(lastSubmission);
    if (!Number.isFinite(lastSubmissionTime)) {
      return false;
    }

    return Date.now() - lastSubmissionTime < FeedbackPage.SUBMISSION_COOLDOWN_MS;
  }

  private markSubmissionTime(): void {
    window.localStorage.setItem('feedback_last_submission_at', Date.now().toString());
  }

  goBack() {
    this.navCtrl.navigateRoot(['/']);
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

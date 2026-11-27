import { Component, inject } from '@angular/core';
import {
  IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, NavController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, homeOutline, mapOutline, personOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {
  private navCtrl = inject(NavController);

  constructor() {
    addIcons({ add, homeOutline, mapOutline, personOutline });
  }

  newEntry(): void {
    this.navCtrl.navigateForward('/entry/new');
  }
}
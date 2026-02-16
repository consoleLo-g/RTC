import { Routes } from '@angular/router';
import { ChatComponent } from './chat/chat.component';

export const routes: Routes = [
    { path: '', component: ChatComponent }, // serve chat at root
    { path: 'chat', component: ChatComponent },
    { path: '**', redirectTo: '' }, // fallback for unknown routes
];

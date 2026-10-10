import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch(() => {
  const message = document.createElement('p');
  message.textContent = 'Aplikaciju nije moguće otvoriti. Osvježi stranicu i pokušaj ponovno.';
  message.setAttribute('role', 'alert');
  document.body.replaceChildren(message);
});

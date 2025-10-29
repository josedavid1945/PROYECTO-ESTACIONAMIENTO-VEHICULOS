import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

const API_URL = 'http://localhost:3000/api';

@Injectable({
  providedIn: 'root'
})
export class Config {
  private http = inject(HttpClient);

  

}

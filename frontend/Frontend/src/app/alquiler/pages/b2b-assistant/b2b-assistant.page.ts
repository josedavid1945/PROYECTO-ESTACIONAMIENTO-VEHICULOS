import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { B2bChatComponent } from '../../components/b2b-chat/b2b-chat.component';

@Component({
  selector: 'app-b2b-assistant',
  standalone: true,
  imports: [CommonModule, B2bChatComponent],
  template: `
    <div class="b2b-page">
      <div class="page-header">
        <h1>Asistente B2B</h1>
        <p class="subtitle">
          Gestiona partners, webhooks y operaciones del estacionamiento con IA
        </p>
      </div>
      
      <div class="chat-wrapper">
        <app-b2b-chat></app-b2b-chat>
      </div>

      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
          </div>
          <h3>Webhooks B2B</h3>
          <p>Integra partners externos con eventos en tiempo real y firmas HMAC seguras</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
            </svg>
          </div>
          <h3>IA Multimodal</h3>
          <p>Analiza imágenes de placas, tickets y documentos PDF automáticamente</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>
          </div>
          <h3>Herramientas MCP</h3>
          <p>10+ herramientas especializadas para gestión del estacionamiento</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </div>
          <h3>Analytics</h3>
          <p>Consulta recaudación, ocupación y estadísticas en lenguaje natural</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .b2b-page {
      padding: 30px;
      min-height: 100vh;
      background: #0f172a;
    }

    .page-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .page-header h1 {
      color: #f1f5f9;
      font-size: 2rem;
      margin: 0 0 10px 0;
      font-weight: 600;
    }

    .subtitle {
      color: #64748b;
      font-size: 1rem;
      margin: 0;
    }

    .chat-wrapper {
      max-width: 800px;
      margin: 0 auto 40px;
      height: 600px;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .feature-card {
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(59, 130, 246, 0.1);
      border-radius: 14px;
      padding: 24px;
      text-align: center;
      transition: all 0.3s ease;
    }

    .feature-card:hover {
      background: rgba(59, 130, 246, 0.08);
      border-color: rgba(59, 130, 246, 0.3);
      transform: translateY(-3px);
    }

    .feature-icon {
      margin-bottom: 14px;
    }

    .feature-icon svg {
      width: 36px;
      height: 36px;
      color: #3b82f6;
    }

    .feature-card h3 {
      color: #f1f5f9;
      font-size: 1rem;
      margin: 0 0 8px 0;
      font-weight: 600;
    }

    .feature-card p {
      color: #64748b;
      font-size: 0.85rem;
      margin: 0;
      line-height: 1.5;
    }

    @media (max-width: 768px) {
      .b2b-page {
        padding: 15px;
      }

      .page-header h1 {
        font-size: 1.5rem;
      }

      .chat-wrapper {
        height: 500px;
      }
    }
  `]
})
export class B2bAssistantPage {}
